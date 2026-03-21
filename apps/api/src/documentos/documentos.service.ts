import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { createId } from '../common/utils/create-id';
import { PedidosService } from '../pedidos/pedidos.service';
import { UploadsService } from '../uploads/uploads.service';
import { DocumentosRepository } from './repositories/documentos.repository';
import type { CreateItemDocumentoDto } from './dto/create-item-documento.dto';
import type { ItemDocumento } from './item-documento.interface';

@Injectable()
export class DocumentosService {
  constructor(
    private readonly documentosRepository: DocumentosRepository,
    @Inject(forwardRef(() => PedidosService))
    private readonly pedidosService: PedidosService,
    private readonly uploadsService: UploadsService,
  ) {}

  criar(dados: CreateItemDocumentoDto): ItemDocumento {
    const pedidoId = dados.pedidoId.trim();
    const arquivo = this.uploadsService.prepararArquivoParaCadastro(
      'documents',
      dados.arquivoNome,
      dados.arquivoUrl,
    );

    this.pedidosService.buscarPorId(pedidoId);

    return this.documentosRepository.create({
      id: createId(),
      pedidoId,
      arquivoNome: arquivo.arquivoNome,
      arquivoUrl: arquivo.arquivoUrl,
      quantidade: dados.quantidade,
      colorido: dados.colorido,
      tipoImpressao: this.normalizarTextoOpcional(dados.tipoImpressao),
      acabamento: this.normalizarTextoOpcional(dados.acabamento),
      createdAt: new Date(),
    });
  }

  criarMuitos(dados: CreateItemDocumentoDto[]): ItemDocumento[] {
    const itens = dados.map((item) => this.criar(item));
    return this.documentosRepository
      .findAll()
      .filter((documento) => itens.some((item) => item.id === documento.id));
  }

  listar(): ItemDocumento[] {
    return this.documentosRepository.findAll();
  }

  buscarPorId(id: string): ItemDocumento {
    const item = this.documentosRepository.findById(id);

    if (!item) {
      throw new NotFoundException('Item de documento nao encontrado.');
    }

    return item;
  }

  listarPorPedidoId(pedidoId: string): ItemDocumento[] {
    return this.documentosRepository.findByPedidoId(pedidoId);
  }

  private normalizarTextoOpcional(valor?: string): string | undefined {
    if (valor === undefined) {
      return undefined;
    }

    const normalized = valor.trim();

    return normalized.length > 0 ? normalized : undefined;
  }
}
