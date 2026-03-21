import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { Pool } from 'pg';
import type { Cliente } from '../../clientes/cliente.interface';
import type { ItemDocumento } from '../../documentos/item-documento.interface';
import type { ItemFoto } from '../../fotos/item-foto.interface';
import type { Notificacao } from '../../notificacoes/notificacao.interface';
import type { Pedido } from '../../pedidos/pedido.interface';
import type { ItemPrecificacao } from '../../precificacao/interfaces/precificacao.interface';
import type { UploadedArquivo } from '../../uploads/interfaces/uploaded-arquivo.interface';

const POSTGRES_TABLE_NAME = 'fare_foto_store_snapshots';
const POSTGRES_SNAPSHOT_ID = 'default';

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T | PromiseLike<T>): void;
  reject(reason?: unknown): void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

export interface FareFotoStoreState {
  clientes: Cliente[];
  pedidos: Pedido[];
  pedidoItensByPedidoId: Record<string, ItemPrecificacao[]>;
  fotos: ItemFoto[];
  documentos: ItemDocumento[];
  notificacoes: Notificacao[];
  uploads: UploadedArquivo[];
}

export type FareFotoStoreKey = keyof FareFotoStoreState;
export type FareFotoStoreDriver = 'memory' | 'file' | 'postgres';

interface SerializedFareFotoStoreState {
  clientes?: Array<Omit<Cliente, 'createdAt'> & { createdAt: string }>;
  pedidos?: Array<Omit<Pedido, 'createdAt'> & { createdAt: string }>;
  pedidoItensByPedidoId?: Record<string, ItemPrecificacao[]>;
  fotos?: Array<Omit<ItemFoto, 'createdAt'> & { createdAt: string }>;
  documentos?: Array<Omit<ItemDocumento, 'createdAt'> & { createdAt: string }>;
  notificacoes?: Array<Omit<Notificacao, 'criadaEm'> & { criadaEm: string }>;
  uploads?: UploadedArquivo[];
}

@Injectable()
export class FareFotoStoreService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(FareFotoStoreService.name);
  private readonly databaseUrl = process.env.DATABASE_URL?.trim();
  private readonly filePath =
    process.env.FARE_FOTO_STORE_PATH?.trim() ||
    join(process.cwd(), 'tmp', 'fare-foto-store.json');
  private readonly driver = this.resolverDriver();
  private readonly initialization = createDeferred<void>();
  private pool: Pool | null = null;
  private pendingPersist: Promise<void> = Promise.resolve();
  private state =
    this.driver === 'file'
      ? this.carregarEstadoDoArquivo()
      : this.criarEstadoInicial();

  constructor() {
    if (this.driver !== 'postgres') {
      this.initialization.resolve();
    }
  }

  getDriver(): FareFotoStoreDriver {
    return this.driver;
  }

  async onModuleInit(): Promise<void> {
    if (this.driver !== 'postgres' || !this.databaseUrl) {
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: this.databaseUrl,
      });

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${POSTGRES_TABLE_NAME} (
          id TEXT PRIMARY KEY,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const postgresState = await this.carregarEstadoDoPostgres();

      if (postgresState) {
        this.state = postgresState;
      } else {
        const legacyFileState = this.tentarCarregarEstadoDoArquivo();

        if (legacyFileState) {
          this.state = legacyFileState;
          await this.persistirNoPostgres(
            this.serializarEstado(legacyFileState),
          );
          this.logger.log(
            'Estado local importado do arquivo JSON para PostgreSQL.',
          );
        } else {
          await this.persistirNoPostgres(
            this.serializarEstado(this.criarEstadoInicial()),
          );
        }
      }

      this.logger.log('Persistencia ativa em PostgreSQL.');
      this.initialization.resolve();
    } catch (error) {
      this.initialization.reject(error);

      if (this.pool) {
        await this.pool.end().catch(() => undefined);
        this.pool = null;
      }

      throw error;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pendingPersist.catch((error: unknown) => {
      this.logger.error(
        'Falha ao concluir persistencia pendente antes do shutdown.',
        this.normalizarErro(error),
      );
    });

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  read<K extends FareFotoStoreKey>(key: K): FareFotoStoreState[K] {
    return structuredClone(this.state[key]);
  }

  write<K extends FareFotoStoreKey>(
    key: K,
    value: FareFotoStoreState[K],
  ): void {
    this.state[key] = structuredClone(value);
    this.persistir();
  }

  reset(): void {
    this.state = this.criarEstadoInicial();
    this.persistir();
  }

  private persistir(): void {
    if (this.driver === 'file') {
      this.persistirNoArquivo(this.state);
      return;
    }

    if (this.driver === 'postgres') {
      const snapshot = this.serializarEstado(this.state);

      this.pendingPersist = this.pendingPersist
        .then(() => this.initialization.promise)
        .then(() => this.persistirNoPostgres(snapshot))
        .catch((error: unknown) => {
          this.logger.error(
            'Falha ao persistir estado no PostgreSQL.',
            this.normalizarErro(error),
          );
          throw error;
        });
    }
  }

  private resolverDriver(): FareFotoStoreDriver {
    if (this.databaseUrl && this.databaseUrl.length > 0) {
      return 'postgres';
    }

    if (this.devePersistirEmDisco()) {
      return 'file';
    }

    return 'memory';
  }

  private devePersistirEmDisco(): boolean {
    const override = process.env.FARE_FOTO_STORE_PERSIST?.trim();

    if (override === 'true') {
      return true;
    }

    if (override === 'false') {
      return false;
    }

    return !this.estaEmAmbienteDeTeste();
  }

  private estaEmAmbienteDeTeste(): boolean {
    return (
      process.env.NODE_ENV === 'test' ||
      process.env.JEST_WORKER_ID !== undefined
    );
  }

  private carregarEstadoDoArquivo(): FareFotoStoreState {
    return this.tentarCarregarEstadoDoArquivo() ?? this.criarEstadoInicial();
  }

  private tentarCarregarEstadoDoArquivo(): FareFotoStoreState | null {
    if (!existsSync(this.filePath)) {
      return null;
    }

    try {
      const raw = readFileSync(this.filePath, 'utf8').trim();

      if (raw.length === 0) {
        return this.criarEstadoInicial();
      }

      return this.normalizarEstado(
        JSON.parse(raw) as SerializedFareFotoStoreState,
      );
    } catch {
      return this.criarEstadoInicial();
    }
  }

  private persistirNoArquivo(state: FareFotoStoreState): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(
      this.filePath,
      JSON.stringify(this.serializarEstado(state), null, 2),
      'utf8',
    );
  }

  private async carregarEstadoDoPostgres(): Promise<FareFotoStoreState | null> {
    if (!this.pool) {
      return null;
    }

    const result = await this.pool.query<{ payload: unknown }>(
      `
        SELECT payload
        FROM ${POSTGRES_TABLE_NAME}
        WHERE id = $1
        LIMIT 1
      `,
      [POSTGRES_SNAPSHOT_ID],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    const payload =
      typeof row.payload === 'string'
        ? (JSON.parse(row.payload) as SerializedFareFotoStoreState)
        : (row.payload as SerializedFareFotoStoreState);

    return this.normalizarEstado(payload);
  }

  private async persistirNoPostgres(
    snapshot: SerializedFareFotoStoreState,
  ): Promise<void> {
    if (!this.pool) {
      throw new Error('Pool PostgreSQL indisponivel para persistencia.');
    }

    await this.pool.query(
      `
        INSERT INTO ${POSTGRES_TABLE_NAME} (id, payload, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_at = NOW()
      `,
      [POSTGRES_SNAPSHOT_ID, JSON.stringify(snapshot)],
    );
  }

  private criarEstadoInicial(): FareFotoStoreState {
    return {
      clientes: [],
      pedidos: [],
      pedidoItensByPedidoId: {},
      fotos: [],
      documentos: [],
      notificacoes: [],
      uploads: [],
    };
  }

  private normalizarEstado(
    data: SerializedFareFotoStoreState,
  ): FareFotoStoreState {
    return {
      clientes: Array.isArray(data.clientes)
        ? data.clientes.map((cliente) => ({
            ...cliente,
            createdAt: new Date(cliente.createdAt),
          }))
        : [],
      pedidos: Array.isArray(data.pedidos)
        ? data.pedidos.map((pedido) => ({
            ...pedido,
            createdAt: new Date(pedido.createdAt),
          }))
        : [],
      pedidoItensByPedidoId:
        data.pedidoItensByPedidoId &&
        typeof data.pedidoItensByPedidoId === 'object'
          ? Object.fromEntries(
              Object.entries(data.pedidoItensByPedidoId).map(
                ([pedidoId, itens]) => [
                  pedidoId,
                  Array.isArray(itens) ? itens : [],
                ],
              ),
            )
          : {},
      fotos: Array.isArray(data.fotos)
        ? data.fotos.map((foto) => ({
            ...foto,
            createdAt: new Date(foto.createdAt),
          }))
        : [],
      documentos: Array.isArray(data.documentos)
        ? data.documentos.map((documento) => ({
            ...documento,
            createdAt: new Date(documento.createdAt),
          }))
        : [],
      notificacoes: Array.isArray(data.notificacoes)
        ? data.notificacoes.map((notificacao) => ({
            ...notificacao,
            criadaEm: new Date(notificacao.criadaEm),
          }))
        : [],
      uploads: Array.isArray(data.uploads) ? structuredClone(data.uploads) : [],
    };
  }

  private serializarEstado(
    state: FareFotoStoreState,
  ): SerializedFareFotoStoreState {
    return {
      clientes: state.clientes.map((cliente) => ({
        ...cliente,
        createdAt: cliente.createdAt.toISOString(),
      })),
      pedidos: state.pedidos.map((pedido) => ({
        ...pedido,
        createdAt: pedido.createdAt.toISOString(),
      })),
      pedidoItensByPedidoId: structuredClone(state.pedidoItensByPedidoId),
      fotos: state.fotos.map((foto) => ({
        ...foto,
        createdAt: foto.createdAt.toISOString(),
      })),
      documentos: state.documentos.map((documento) => ({
        ...documento,
        createdAt: documento.createdAt.toISOString(),
      })),
      notificacoes: state.notificacoes.map((notificacao) => ({
        ...notificacao,
        criadaEm: notificacao.criadaEm.toISOString(),
      })),
      uploads: structuredClone(state.uploads),
    };
  }

  private normalizarErro(error: unknown): string {
    return error instanceof Error
      ? (error.stack ?? error.message)
      : String(error);
  }
}
