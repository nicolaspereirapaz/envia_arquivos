import { Injectable } from '@nestjs/common';
import type { ItemPrecificacao } from '../../precificacao/interfaces/precificacao.interface';

@Injectable()
export class PedidoItensRepository {
  private readonly itensPorPedido = new Map<string, ItemPrecificacao[]>();

  save(pedidoId: string, itens: ItemPrecificacao[]): void {
    this.itensPorPedido.set(pedidoId, itens);
  }

  findByPedidoId(pedidoId: string): ItemPrecificacao[] {
    return this.itensPorPedido.get(pedidoId) ?? [];
  }
}
