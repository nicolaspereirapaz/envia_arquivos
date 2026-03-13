import { Test, TestingModule } from '@nestjs/testing';
import type { Pedido } from '../pedidos/pedido.interface';
import { PedidosService } from '../pedidos/pedidos.service';
import { ClientesRepository } from './repositories/clientes.repository';
import { ClientesService } from './clientes.service';

describe('ClientesService', () => {
  let service: ClientesService;
  let pedidosService: { listarPorClienteId: () => Pedido[] };

  beforeEach(async () => {
    pedidosService = {
      listarPorClienteId: () => [],
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        ClientesRepository,
        {
          provide: PedidosService,
          useValue: pedidosService,
        },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create, list, get and update clientes in memory', () => {
    const cliente = service.criar({
      nome: 'Joao',
      telefone: '11999999999',
    });

    expect(cliente).toMatchObject({
      nome: 'Joao',
      telefone: '11999999999',
    });
    expect(cliente.id).toEqual(expect.any(String));
    expect(cliente.createdAt).toBeInstanceOf(Date);
    expect(service.listar()).toEqual([cliente]);
    expect(service.buscarPorId(cliente.id)).toEqual(cliente);

    const atualizado = service.atualizar(cliente.id, {
      observacoes: 'Cliente recorrente',
    });

    expect(atualizado.observacoes).toBe('Cliente recorrente');
  });

  it('should remove cliente without pedidos vinculados', () => {
    const cliente = service.criar({
      nome: 'Maria',
      telefone: '11988888888',
    });

    service.remover(cliente.id);

    expect(service.listar()).toHaveLength(0);
  });

  it('should block delete when cliente has pedidos', () => {
    const cliente = service.criar({
      nome: 'Carlos',
      telefone: '11977777777',
    });
    jest.spyOn(pedidosService, 'listarPorClienteId').mockReturnValue([
      {
        id: 'pedido-1',
        clienteId: cliente.id,
        status: 'recebido',
        prazo: 'uma_hora',
        subtotal: 10,
        total: 15,
        createdAt: new Date(),
      },
    ]);

    expect(() => service.remover(cliente.id)).toThrow(/pedidos vinculados/i);
  });
});
