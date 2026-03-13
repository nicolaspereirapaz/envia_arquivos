import { Injectable } from '@nestjs/common';
import type { ItemFoto } from '../item-foto.interface';

@Injectable()
export class FotosRepository {
  private readonly fotos: ItemFoto[] = [];

  create(item: ItemFoto): ItemFoto {
    this.fotos.push(item);
    return item;
  }

  createMany(itens: ItemFoto[]): ItemFoto[] {
    itens.forEach((item) => this.fotos.push(item));
    return itens;
  }

  findAll(): ItemFoto[] {
    return this.fotos;
  }

  findById(id: string): ItemFoto | undefined {
    return this.fotos.find((item) => item.id === id);
  }

  findByPedidoId(pedidoId: string): ItemFoto[] {
    return this.fotos.filter((item) => item.pedidoId === pedidoId);
  }
}
