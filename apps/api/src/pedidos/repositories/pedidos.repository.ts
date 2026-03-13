import { Injectable } from '@nestjs/common';
import type { Pedido } from '../pedido.interface';

@Injectable()
export class PedidosRepository {
  private readonly pedidos: Pedido[] = [];

  create(pedido: Pedido): Pedido {
    this.pedidos.push(pedido);
    return pedido;
  }

  findAll(): Pedido[] {
    return this.pedidos;
  }

  findById(id: string): Pedido | undefined {
    return this.pedidos.find((pedido) => pedido.id === id);
  }

  findByClienteId(clienteId: string): Pedido[] {
    return this.pedidos.filter((pedido) => pedido.clienteId === clienteId);
  }
}
