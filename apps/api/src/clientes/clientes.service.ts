import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { createId } from '../common/utils/create-id';
import { PedidosService } from '../pedidos/pedidos.service';
import { ClientesRepository } from './repositories/clientes.repository';
import type { CreateClienteDto } from './dto/create-cliente.dto';
import type { UpdateClienteDto } from './dto/update-cliente.dto';
import type { Cliente } from './cliente.interface';

@Injectable()
export class ClientesService {
  constructor(
    private readonly clientesRepository: ClientesRepository,
    @Inject(forwardRef(() => PedidosService))
    private readonly pedidosService: PedidosService,
  ) {}

  criar(cliente: CreateClienteDto): Cliente {
    const novoCliente: Cliente = {
      id: createId(),
      nome: cliente.nome.trim(),
      telefone: cliente.telefone.trim(),
      cpfCnpj: this.normalizarTextoOpcional(cliente.cpfCnpj),
      observacoes: this.normalizarTextoOpcional(cliente.observacoes),
      createdAt: new Date(),
    };

    return this.clientesRepository.create(novoCliente);
  }

  listar(): Cliente[] {
    return this.clientesRepository.findAll();
  }

  buscarPorId(id: string): Cliente {
    const cliente = this.clientesRepository.findById(id);

    if (!cliente) {
      throw new NotFoundException('Cliente nao encontrado.');
    }

    return cliente;
  }

  atualizar(id: string, dados: UpdateClienteDto): Cliente {
    const clienteAtual = this.buscarPorId(id);
    const cliente: Cliente = {
      ...clienteAtual,
    };

    if (dados.nome !== undefined) {
      cliente.nome = dados.nome.trim();
    }

    if (dados.telefone !== undefined) {
      cliente.telefone = dados.telefone.trim();
    }

    if (dados.cpfCnpj !== undefined) {
      cliente.cpfCnpj = this.normalizarTextoOpcional(dados.cpfCnpj);
    }

    if (dados.observacoes !== undefined) {
      cliente.observacoes = this.normalizarTextoOpcional(dados.observacoes);
    }

    return this.clientesRepository.update(cliente);
  }

  remover(id: string): void {
    this.buscarPorId(id);

    if (this.pedidosService.listarPorClienteId(id).length > 0) {
      throw new ConflictException(
        'Nao e possivel excluir um cliente com pedidos vinculados.',
      );
    }

    this.clientesRepository.deleteById(id);
  }

  private normalizarTextoOpcional(valor?: string): string | undefined {
    if (valor === undefined) {
      return undefined;
    }

    const normalized = valor.trim();

    return normalized.length > 0 ? normalized : undefined;
  }
}
