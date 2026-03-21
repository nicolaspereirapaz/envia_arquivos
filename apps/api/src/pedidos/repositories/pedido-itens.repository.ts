import { Injectable } from '@nestjs/common';
import { FareFotoStoreService } from '../../common/persistence/fare-foto-store.service';
import type { ItemPrecificacao } from '../../precificacao/interfaces/precificacao.interface';

@Injectable()
export class PedidoItensRepository {
  constructor(private readonly store: FareFotoStoreService) {}

  save(pedidoId: string, itens: ItemPrecificacao[]): void {
    const itensPorPedido = this.store.read('pedidoItensByPedidoId');
    itensPorPedido[pedidoId] = itens;
    this.store.write('pedidoItensByPedidoId', itensPorPedido);
  }

  findByPedidoId(pedidoId: string): ItemPrecificacao[] {
    return this.store.read('pedidoItensByPedidoId')[pedidoId] ?? [];
  }
}
