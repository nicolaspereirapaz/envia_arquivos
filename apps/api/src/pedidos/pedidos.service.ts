import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PRAZOS_PEDIDO, type PrazoPedido } from '../common/types/prazo-pedido.type';
import { createId } from '../common/utils/create-id';
import { ClientesService } from '../clientes/clientes.service';
import { DocumentosService } from '../documentos/documentos.service';
import type { CreateItemDocumentoDto } from '../documentos/dto/create-item-documento.dto';
import { FotosService } from '../fotos/fotos.service';
import type { CreateItemFotoDto } from '../fotos/dto/create-item-foto.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { PrecificacaoService } from '../precificacao/precificacao.service';
import type { ItemPrecificacaoDto } from '../precificacao/dto/item-precificacao.dto';
import type { ItemPrecificacao } from '../precificacao/interfaces/precificacao.interface';
import {
  PEDIDO_STATUS,
  type Pedido,
  type PedidoDetalhado,
  type PedidoStatus,
} from './pedido.interface';
import type {
  CreatePedidoDocumentoItemDto,
  CreatePedidoDto,
  CreatePedidoFotoItemDto,
} from './dto/create-pedido.dto';
import { PedidoItensRepository } from './repositories/pedido-itens.repository';
import { PedidosRepository } from './repositories/pedidos.repository';

@Injectable()
export class PedidosService {
  constructor(
    private readonly pedidosRepository: PedidosRepository,
    private readonly pedidoItensRepository: PedidoItensRepository,
    @Inject(forwardRef(() => ClientesService))
    private readonly clientesService: ClientesService,
    private readonly precificacaoService: PrecificacaoService,
    @Inject(forwardRef(() => FotosService))
    private readonly fotosService: FotosService,
    @Inject(forwardRef(() => DocumentosService))
    private readonly documentosService: DocumentosService,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  criar(dados: CreatePedidoDto): PedidoDetalhado {
    const clienteId = dados.clienteId.trim();
    const prazo = this.validarPrazo(dados.prazo);

    this.clientesService.buscarPorId(clienteId);

    const fotos = Array.isArray(dados.fotos) ? dados.fotos : [];
    const documentos = Array.isArray(dados.documentos) ? dados.documentos : [];
    const itens = this.resolverItens(dados, fotos, documentos);
    const simulacao = this.precificacaoService.simular({ prazo, itens });

    const pedido = this.pedidosRepository.create({
      id: createId(),
      clienteId,
      status: 'recebido',
      prazo,
      subtotal: simulacao.subtotal,
      taxaUrgencia: simulacao.taxaUrgencia,
      total: simulacao.total,
      observacoes: this.normalizarTextoOpcional(dados.observacoes),
      createdAt: new Date(),
    });

    this.pedidoItensRepository.save(pedido.id, itens);

    if (fotos.length > 0) {
      this.fotosService.criarMuitos(
        fotos.map((item) => this.mapearFotoParaCriacao(item, pedido.id)),
      );
    }

    if (documentos.length > 0) {
      this.documentosService.criarMuitos(
        documentos.map((item) =>
          this.mapearDocumentoParaCriacao(item, pedido.id),
        ),
      );
    }

    this.notificacoesService.criar({
      pedidoId: pedido.id,
      tipo: 'novo_pedido',
      mensagem: 'Novo pedido recebido',
    });

    return this.buscarDetalhadoPorId(pedido.id);
  }

  listar(): Pedido[] {
    return this.pedidosRepository.findAll();
  }

  listarPorClienteId(clienteId: string): Pedido[] {
    return this.pedidosRepository.findByClienteId(clienteId);
  }

  buscarPorId(id: string): Pedido {
    const pedido = this.pedidosRepository.findById(id);

    if (!pedido) {
      throw new NotFoundException('Pedido nao encontrado.');
    }

    return pedido;
  }

  buscarDetalhadoPorId(id: string): PedidoDetalhado {
    const pedido = this.buscarPorId(id);

    return {
      ...pedido,
      itens: this.pedidoItensRepository.findByPedidoId(id),
      fotos: this.fotosService.listarPorPedidoId(id),
      documentos: this.documentosService.listarPorPedidoId(id),
    };
  }

  atualizarStatus(id: string, status: string): Pedido {
    const pedido = this.buscarPorId(id);

    if (!PEDIDO_STATUS.includes(status as PedidoStatus)) {
      throw new BadRequestException('Status de pedido invalido.');
    }

    pedido.status = status as PedidoStatus;
    return pedido;
  }

  private validarPrazo(prazo: string): PrazoPedido {
    if (!PRAZOS_PEDIDO.includes(prazo as PrazoPedido)) {
      throw new BadRequestException('Prazo invalido.');
    }

    return prazo as PrazoPedido;
  }

  private mapearFotoParaCriacao(
    item: CreatePedidoFotoItemDto,
    pedidoId: string,
  ): CreateItemFotoDto {
    return {
      pedidoId,
      arquivoNome: item.arquivoNome,
      arquivoUrl: item.arquivoUrl,
      tamanho: item.tamanho,
      quantidade: item.quantidade,
      brilho: item.brilho,
      contraste: item.contraste,
      saturacao: item.saturacao,
      cropData: item.cropData,
    };
  }

  private mapearDocumentoParaCriacao(
    item: CreatePedidoDocumentoItemDto,
    pedidoId: string,
  ): CreateItemDocumentoDto {
    return {
      pedidoId,
      arquivoNome: item.arquivoNome,
      arquivoUrl: item.arquivoUrl,
      quantidade: item.quantidade,
      colorido: item.colorido,
      tipoImpressao: item.tipoImpressao,
      acabamento: item.acabamento,
    };
  }

  private normalizarTextoOpcional(valor?: string): string | undefined {
    if (valor === undefined) {
      return undefined;
    }

    const normalized = valor.trim();

    return normalized.length > 0 ? normalized : undefined;
  }

  private resolverItens(
    dados: CreatePedidoDto,
    fotos: CreatePedidoFotoItemDto[],
    documentos: CreatePedidoDocumentoItemDto[],
  ): ItemPrecificacao[] {
    if (Array.isArray(dados.itens) && dados.itens.length > 0) {
      return dados.itens.map((item, index) =>
        this.normalizarItemPrecificacao(item, index),
      );
    }

    if (fotos.length === 0 && documentos.length === 0) {
      throw new BadRequestException(
        'Informe ao menos um item para criar o pedido.',
      );
    }

    return [
      ...fotos.map((item) => ({
        tipo: 'foto' as const,
        tamanho: item.tamanho.trim(),
        quantidade: item.quantidade,
      })),
      ...documentos.map((item) => ({
        tipo: 'documento' as const,
        quantidade: item.quantidade,
        colorido: item.colorido,
      })),
    ];
  }

  private normalizarItemPrecificacao(
    item: ItemPrecificacao | ItemPrecificacaoDto,
    index: number,
  ): ItemPrecificacao {
    if (item.tipo === 'foto') {
      if (!item.tamanho) {
        throw new BadRequestException(
          `O item ${index + 1} precisa de tamanho para foto.`,
        );
      }

      return {
        tipo: 'foto',
        tamanho: item.tamanho.trim(),
        quantidade: item.quantidade,
      };
    }

    if (item.colorido === undefined) {
      throw new BadRequestException(
        `O item ${index + 1} precisa definir se o documento e colorido.`,
      );
    }

    return {
      tipo: 'documento',
      quantidade: item.quantidade,
      colorido: item.colorido,
    };
  }
}
