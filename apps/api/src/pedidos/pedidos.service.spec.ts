import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Cliente } from '../clientes/cliente.interface';
import { ClientesService } from '../clientes/clientes.service';
import { DocumentosService } from '../documentos/documentos.service';
import { FotosService } from '../fotos/fotos.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { PrecificacaoService } from '../precificacao/precificacao.service';
import { PedidoItensRepository } from './repositories/pedido-itens.repository';
import { PedidosRepository } from './repositories/pedidos.repository';
import { PedidosService } from './pedidos.service';

describe('PedidosService', () => {
  let service: PedidosService;
  let fotosStore: Array<{ pedidoId: string }>;
  let documentosStore: Array<{ pedidoId: string }>;
  let notificacoesStore: Array<{ pedidoId: string; mensagem: string }>;
  let clientesService: { buscarPorId: (id: string) => Cliente };

  beforeEach(async () => {
    fotosStore = [];
    documentosStore = [];
    notificacoesStore = [];
    clientesService = {
      buscarPorId: (id: string) => ({
        id,
        nome: 'Joao',
        telefone: '11999999999',
        createdAt: new Date(),
      }),
    };

    const fotosService = {
      criarMuitos: (dados: Array<{ pedidoId: string }>) => {
        fotosStore.push(...dados);
        return dados;
      },
      listarPorPedidoId: (pedidoId: string) =>
        fotosStore.filter((item) => item.pedidoId === pedidoId),
    };

    const documentosService = {
      criarMuitos: (dados: Array<{ pedidoId: string }>) => {
        documentosStore.push(...dados);
        return dados;
      },
      listarPorPedidoId: (pedidoId: string) =>
        documentosStore.filter((item) => item.pedidoId === pedidoId),
    };

    const notificacoesService = {
      criar: (dados: { pedidoId: string; mensagem: string }) => {
        notificacoesStore.push(dados);
        return {
          id: 'not-1',
          tipo: 'novo_pedido',
          lida: false,
          criadaEm: new Date(),
          ...dados,
        };
      },
      listar: () => notificacoesStore,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        PedidosRepository,
        PedidoItensRepository,
        PrecificacaoService,
        {
          provide: FotosService,
          useValue: fotosService,
        },
        {
          provide: DocumentosService,
          useValue: documentosService,
        },
        {
          provide: NotificacoesService,
          useValue: notificacoesService,
        },
        {
          provide: ClientesService,
          useValue: clientesService,
        },
      ],
    }).compile();

    service = module.get<PedidosService>(PedidosService);
  });

  it('should create pedido, itens and notification', () => {
    const pedido = service.criar({
      clienteId: 'cliente-1',
      prazo: 'uma_hora',
      observacoes: 'Urgente',
      itens: [
        {
          tipo: 'foto',
          tamanho: '10x15',
          quantidade: 20,
        },
        {
          tipo: 'documento',
          quantidade: 2,
          colorido: false,
        },
      ],
    });

    expect(pedido.id).toEqual(expect.any(String));
    expect(pedido.status).toBe('recebido');
    expect(pedido.taxaUrgencia).toBe(5);
    expect(pedido.subtotal).toBe(21);
    expect(pedido.total).toBe(26);
    expect(pedido.itens).toHaveLength(2);
    expect(pedido.fotos).toHaveLength(0);
    expect(pedido.documentos).toHaveLength(0);
    expect(fotosStore).toHaveLength(0);
    expect(documentosStore).toHaveLength(0);
    expect(notificacoesStore).toHaveLength(1);
    expect(notificacoesStore[0].mensagem).toBe('Novo pedido recebido');
  });

  it('should reject pedido when cliente does not exist', () => {
    jest.spyOn(clientesService, 'buscarPorId').mockImplementation(() => {
      throw new NotFoundException('Cliente nao encontrado.');
    });

    expect(() =>
      service.criar({
        clienteId: 'cliente-invalido',
        prazo: 'uma_hora',
        itens: [
          {
            tipo: 'foto',
            tamanho: '10x15',
            quantidade: 1,
          },
        ],
      }),
    ).toThrow('Cliente nao encontrado.');
  });

  it('should update pedido status', () => {
    const pedido = service.criar({
      clienteId: 'cliente-1',
      prazo: 'na_hora',
      itens: [
        {
          tipo: 'foto',
          tamanho: '13x18',
          quantidade: 1,
        },
      ],
    });

    const atualizado = service.atualizarStatus(pedido.id, 'pronto');

    expect(atualizado.status).toBe('pronto');
  });

  it('should keep compatibility with legacy fotos/documentos payload', () => {
    const pedido = service.criar({
      clienteId: 'cliente-1',
      prazo: 'uma_hora',
      fotos: [
        {
          arquivoNome: 'familia.jpg',
          tamanho: '10x15',
          quantidade: 5,
        },
      ],
      documentos: [
        {
          arquivoNome: 'contrato.pdf',
          quantidade: 2,
          colorido: true,
        },
      ],
    });

    expect(pedido.itens).toEqual([
      {
        tipo: 'foto',
        tamanho: '10x15',
        quantidade: 5,
      },
      {
        tipo: 'documento',
        quantidade: 2,
        colorido: true,
      },
    ]);
    expect(pedido.fotos).toHaveLength(1);
    expect(pedido.documentos).toHaveLength(1);
    expect(fotosStore).toHaveLength(1);
    expect(documentosStore).toHaveLength(1);
  });
});
