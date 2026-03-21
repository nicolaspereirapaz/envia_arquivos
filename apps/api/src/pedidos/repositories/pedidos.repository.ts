import { Injectable } from '@nestjs/common';
import { FareFotoStoreService } from '../../common/persistence/fare-foto-store.service';
import type { Pedido } from '../pedido.interface';

@Injectable()
export class PedidosRepository {
  constructor(private readonly store: FareFotoStoreService) {}

  create(pedido: Pedido): Pedido {
    const pedidos = this.store.read('pedidos');
    pedidos.push(pedido);
    this.store.write('pedidos', pedidos);
    return pedido;
  }

  findAll(): Pedido[] {
    return this.store.read('pedidos');
  }

  findById(id: string): Pedido | undefined {
    return this.store.read('pedidos').find((pedido) => pedido.id === id);
  }

  findByClienteId(clienteId: string): Pedido[] {
    return this.store
      .read('pedidos')
      .filter((pedido) => pedido.clienteId === clienteId);
  }

  update(pedido: Pedido): Pedido {
    const pedidos = this.store.read('pedidos');
    const index = pedidos.findIndex((item) => item.id === pedido.id);

    if (index >= 0) {
      pedidos[index] = pedido;
    } else {
      pedidos.push(pedido);
    }

    this.store.write('pedidos', pedidos);
    return pedido;
  }
}
