import { Injectable } from '@nestjs/common';
import { FareFotoStoreService } from '../../common/persistence/fare-foto-store.service';
import type { ItemFoto } from '../item-foto.interface';

@Injectable()
export class FotosRepository {
  constructor(private readonly store: FareFotoStoreService) {}

  create(item: ItemFoto): ItemFoto {
    const fotos = this.store.read('fotos');
    fotos.push(item);
    this.store.write('fotos', fotos);
    return item;
  }

  createMany(itens: ItemFoto[]): ItemFoto[] {
    const fotos = this.store.read('fotos');
    fotos.push(...itens);
    this.store.write('fotos', fotos);
    return itens;
  }

  findAll(): ItemFoto[] {
    return this.store.read('fotos');
  }

  findById(id: string): ItemFoto | undefined {
    return this.store.read('fotos').find((item) => item.id === id);
  }

  findByPedidoId(pedidoId: string): ItemFoto[] {
    return this.store
      .read('fotos')
      .filter((item) => item.pedidoId === pedidoId);
  }
}
