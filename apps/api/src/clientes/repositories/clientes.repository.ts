import { Injectable } from '@nestjs/common';
import { FareFotoStoreService } from '../../common/persistence/fare-foto-store.service';
import type { Cliente } from '../cliente.interface';

@Injectable()
export class ClientesRepository {
  constructor(private readonly store: FareFotoStoreService) {}

  create(cliente: Cliente): Cliente {
    const clientes = this.store.read('clientes');
    clientes.push(cliente);
    this.store.write('clientes', clientes);
    return cliente;
  }

  findAll(): Cliente[] {
    return this.store.read('clientes');
  }

  findById(id: string): Cliente | undefined {
    return this.store.read('clientes').find((cliente) => cliente.id === id);
  }

  update(cliente: Cliente): Cliente {
    const clientes = this.store.read('clientes');
    const index = clientes.findIndex((item) => item.id === cliente.id);

    if (index >= 0) {
      clientes[index] = cliente;
    } else {
      clientes.push(cliente);
    }

    this.store.write('clientes', clientes);
    return cliente;
  }

  deleteById(id: string): void {
    const clientes = this.store.read('clientes');
    const index = clientes.findIndex((cliente) => cliente.id === id);

    if (index >= 0) {
      clientes.splice(index, 1);
      this.store.write('clientes', clientes);
    }
  }
}
