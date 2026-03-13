import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PedidosService } from '../pedidos/pedidos.service';
import { DocumentosRepository } from './repositories/documentos.repository';
import { DocumentosService } from './documentos.service';

describe('DocumentosService', () => {
  let service: DocumentosService;
  let pedidosService: { buscarPorId: (id: string) => { id: string } };

  beforeEach(async () => {
    pedidosService = {
      buscarPorId: (id: string) => ({ id }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosService,
        DocumentosRepository,
        {
          provide: PedidosService,
          useValue: pedidosService,
        },
      ],
    }).compile();

    service = module.get<DocumentosService>(DocumentosService);
  });

  it('should create and get documento by id', () => {
    const documento = service.criar({
      pedidoId: 'pedido-1',
      arquivoNome: 'arquivo.pdf',
      quantidade: 10,
      colorido: true,
    });

    expect(documento.createdAt).toBeInstanceOf(Date);
    expect(service.buscarPorId(documento.id)).toEqual(documento);
    expect(service.listarPorPedidoId('pedido-1')).toHaveLength(1);
  });

  it('should validate pedido existence', () => {
    jest.spyOn(pedidosService, 'buscarPorId').mockImplementation(() => {
      throw new NotFoundException('Pedido nao encontrado.');
    });

    expect(() =>
      service.criar({
        pedidoId: 'pedido-invalido',
        arquivoNome: 'arquivo.pdf',
        quantidade: 1,
        colorido: false,
      }),
    ).toThrow('Pedido nao encontrado.');
  });
});
