import { Test, TestingModule } from '@nestjs/testing';
import { FareFotoStoreService } from '../common/persistence/fare-foto-store.service';
import type { Pedido } from '../pedidos/pedido.interface';
import { PedidosService } from '../pedidos/pedidos.service';
import { ClientesController } from './clientes.controller';
import { ClientesRepository } from './repositories/clientes.repository';
import { ClientesService } from './clientes.service';

describe('ClientesController', () => {
  let controller: ClientesController;

  beforeEach(async () => {
    const pedidosService = {
      listarPorClienteId: (): Pedido[] => [],
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [
        ClientesService,
        ClientesRepository,
        FareFotoStoreService,
        {
          provide: PedidosService,
          useValue: pedidosService,
        },
      ],
    }).compile();

    controller = module.get<ClientesController>(ClientesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a cliente', () => {
    const resultado = controller.criar({
      nome: 'Joao',
      telefone: '11999999999',
    });

    expect(resultado).toMatchObject({
      nome: 'Joao',
      telefone: '11999999999',
    });
    expect(resultado.id).toEqual(expect.any(String));
    expect(resultado.createdAt).toBeInstanceOf(Date);
  });

  it('should list, get and update clientes', () => {
    const cliente = controller.criar({
      nome: 'Joao',
      telefone: '11999999999',
    });

    expect(controller.listar()).toHaveLength(1);
    expect(controller.buscarPorId(cliente.id)).toEqual(cliente);

    const atualizado = controller.atualizar(cliente.id, {
      telefone: '11900000000',
    });

    expect(atualizado.telefone).toBe('11900000000');
  });
});
