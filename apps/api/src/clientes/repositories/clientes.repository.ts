import { Injectable } from '@nestjs/common';
import type { Cliente } from '../cliente.interface';

@Injectable()
export class ClientesRepository {
  private readonly clientes: Cliente[] = [];

  create(cliente: Cliente): Cliente {
    this.clientes.push(cliente);
    return cliente;
  }

  findAll(): Cliente[] {
    return this.clientes;
  }

  findById(id: string): Cliente | undefined {
    return this.clientes.find((cliente) => cliente.id === id);
  }

  deleteById(id: string): void {
    const index = this.clientes.findIndex((cliente) => cliente.id === id);

    if (index >= 0) {
      this.clientes.splice(index, 1);
    }
  }
}
