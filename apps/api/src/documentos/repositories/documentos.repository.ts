import { Injectable } from '@nestjs/common';
import { FareFotoStoreService } from '../../common/persistence/fare-foto-store.service';
import type { ItemDocumento } from '../item-documento.interface';

@Injectable()
export class DocumentosRepository {
  constructor(private readonly store: FareFotoStoreService) {}

  create(item: ItemDocumento): ItemDocumento {
    const documentos = this.store.read('documentos');
    documentos.push(item);
    this.store.write('documentos', documentos);
    return item;
  }

  createMany(itens: ItemDocumento[]): ItemDocumento[] {
    const documentos = this.store.read('documentos');
    documentos.push(...itens);
    this.store.write('documentos', documentos);
    return itens;
  }

  findAll(): ItemDocumento[] {
    return this.store.read('documentos');
  }

  findById(id: string): ItemDocumento | undefined {
    return this.store.read('documentos').find((item) => item.id === id);
  }

  findByPedidoId(pedidoId: string): ItemDocumento[] {
    return this.store
      .read('documentos')
      .filter((item) => item.pedidoId === pedidoId);
  }
}
