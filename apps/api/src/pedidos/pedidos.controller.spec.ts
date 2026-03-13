import { Test, TestingModule } from '@nestjs/testing';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';

describe('PedidosController', () => {
  let controller: PedidosController;

  const pedidoDetalhado = {
    id: 'pedido-1',
    clienteId: 'cliente-1',
    status: 'recebido' as const,
    prazo: 'uma_hora' as const,
    subtotal: 20,
    taxaUrgencia: 5,
    total: 25,
    createdAt: new Date(),
    itens: [
      {
        tipo: 'foto' as const,
        tamanho: '10x15',
        quantidade: 20,
      },
    ],
    fotos: [],
    documentos: [],
  };

  const pedidosService = {
    criar: () => pedidoDetalhado,
    listar: () => [pedidoDetalhado],
    buscarDetalhadoPorId: () => pedidoDetalhado,
    atualizarStatus: (_id: string, status: string) => ({
      ...pedidoDetalhado,
      status: status as typeof pedidoDetalhado.status,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PedidosController],
      providers: [
        {
          provide: PedidosService,
          useValue: pedidosService,
        },
      ],
    }).compile();

    controller = module.get<PedidosController>(PedidosController);
  });

  it('should create pedido', () => {
    expect(
      controller.criar({
        clienteId: 'cliente-1',
        prazo: 'uma_hora',
        itens: [
          {
            tipo: 'foto',
            tamanho: '10x15',
            quantidade: 20,
          },
        ],
      }),
    ).toEqual(pedidoDetalhado);
  });

  it('should update pedido status', () => {
    const atualizado = controller.atualizarStatus('pedido-1', {
      status: 'pronto',
    });

    expect(atualizado.status).toBe('pronto');
  });
});
