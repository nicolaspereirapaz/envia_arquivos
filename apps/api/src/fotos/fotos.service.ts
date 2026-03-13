import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { createId } from '../common/utils/create-id';
import { PedidosService } from '../pedidos/pedidos.service';
import { FotosRepository } from './repositories/fotos.repository';
import type { CreateItemFotoDto } from './dto/create-item-foto.dto';
import type { ItemFoto } from './item-foto.interface';

@Injectable()
export class FotosService {
  constructor(
    private readonly fotosRepository: FotosRepository,
    @Inject(forwardRef(() => PedidosService))
    private readonly pedidosService: PedidosService,
  ) {}

  criar(dados: CreateItemFotoDto): ItemFoto {
    const pedidoId = dados.pedidoId.trim();

    this.pedidosService.buscarPorId(pedidoId);

    return this.fotosRepository.create({
      id: createId(),
      pedidoId,
      arquivoNome: dados.arquivoNome.trim(),
      arquivoUrl: this.normalizarTextoOpcional(dados.arquivoUrl),
      tamanho: dados.tamanho.trim(),
      quantidade: dados.quantidade,
      brilho: dados.brilho,
      contraste: dados.contraste,
      saturacao: dados.saturacao,
      cropData: this.normalizarTextoOpcional(dados.cropData),
      createdAt: new Date(),
    });
  }

  criarMuitos(dados: CreateItemFotoDto[]): ItemFoto[] {
    const itens = dados.map((item) => this.criar(item));
    return this.fotosRepository.findAll().filter((foto) =>
      itens.some((item) => item.id === foto.id),
    );
  }

  listar(): ItemFoto[] {
    return this.fotosRepository.findAll();
  }

  buscarPorId(id: string): ItemFoto {
    const item = this.fotosRepository.findById(id);

    if (!item) {
      throw new NotFoundException('Item de foto nao encontrado.');
    }

    return item;
  }

  listarPorPedidoId(pedidoId: string): ItemFoto[] {
    return this.fotosRepository.findByPedidoId(pedidoId);
  }

  private normalizarTextoOpcional(valor?: string): string | undefined {
    if (valor === undefined) {
      return undefined;
    }

    const normalized = valor.trim();

    return normalized.length > 0 ? normalized : undefined;
  }
}
