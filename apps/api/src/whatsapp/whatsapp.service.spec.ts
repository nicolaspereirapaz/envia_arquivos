import { Test, TestingModule } from '@nestjs/testing';
import { ClientesService } from '../clientes/clientes.service';
import { DocumentosService } from '../documentos/documentos.service';
import { FotosService } from '../fotos/fotos.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { WhatsappService } from './whatsapp.service';

describe('WhatsappService', () => {
  let service: WhatsappService;

  const pedidosService = {
    buscarDetalhadoPorId: () => ({
      id: 'pedido-1',
      clienteId: 'cliente-1',
      status: 'recebido' as const,
      prazo: 'uma_hora' as const,
      subtotal: 20,
      taxaUrgencia: 5,
      total: 25,
      observacoes: 'Entregar hoje',
      createdAt: new Date(),
      itens: [],
      fotos: [],
      documentos: [],
    }),
  };

  const clientesService = {
    buscarPorId: () => ({
      id: 'cliente-1',
      nome: 'Joao',
      telefone: '11999999999',
      createdAt: new Date(),
    }),
  };

  const fotosService = {
    listarPorPedidoId: () => [
      {
        id: 'foto-1',
        pedidoId: 'pedido-1',
        arquivoNome: 'familia.jpg',
        tamanho: '10x15',
        quantidade: 20,
        createdAt: new Date(),
      },
    ],
  };

  const documentosService = {
    listarPorPedidoId: () => [
      {
        id: 'doc-1',
        pedidoId: 'pedido-1',
        arquivoNome: 'arquivo.pdf',
        quantidade: 10,
        colorido: true,
        createdAt: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        {
          provide: PedidosService,
          useValue: pedidosService,
        },
        {
          provide: ClientesService,
          useValue: clientesService,
        },
        {
          provide: FotosService,
          useValue: fotosService,
        },
        {
          provide: DocumentosService,
          useValue: documentosService,
        },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
  });

  it('should generate whatsapp summary and link', () => {
    const resultado = service.gerarResumoPedido('pedido-1');

    expect(resultado.pedidoId).toBe('pedido-1');
    expect(resultado.mensagem).toContain('Pedido Fare Foto');
    expect(resultado.mensagem).toContain('Cliente: Joao');
    expect(resultado.mensagem).toContain('- familia.jpg | 10x15 | qtd 20');
    expect(resultado.mensagem).toContain('- arquivo.pdf | colorido | qtd 10');
    expect(resultado.mensagem).toContain('Taxa urgencia: R$ 5.00');
    expect(resultado.link).toContain('https://wa.me/5511999999999?text=');
    expect(resultado.link).toContain(encodeURIComponent('Cliente: Joao'));
  });
});
