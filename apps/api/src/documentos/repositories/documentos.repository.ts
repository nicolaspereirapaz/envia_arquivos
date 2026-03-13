import { Injectable } from '@nestjs/common';
import type { ItemDocumento } from '../item-documento.interface';

@Injectable()
export class DocumentosRepository {
  private readonly documentos: ItemDocumento[] = [];

  create(item: ItemDocumento): ItemDocumento {
    this.documentos.push(item);
    return item;
  }

  createMany(itens: ItemDocumento[]): ItemDocumento[] {
    itens.forEach((item) => this.documentos.push(item));
    return itens;
  }

  findAll(): ItemDocumento[] {
    return this.documentos;
  }

  findById(id: string): ItemDocumento | undefined {
    return this.documentos.find((item) => item.id === id);
  }

  findByPedidoId(pedidoId: string): ItemDocumento[] {
    return this.documentos.filter((item) => item.pedidoId === pedidoId);
  }
}
