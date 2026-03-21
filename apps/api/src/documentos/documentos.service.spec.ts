import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FareFotoStoreService } from '../common/persistence/fare-foto-store.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { UploadsService } from '../uploads/uploads.service';
import { DocumentosRepository } from './repositories/documentos.repository';
import { DocumentosService } from './documentos.service';

describe('DocumentosService', () => {
  let service: DocumentosService;
  let pedidosService: { buscarPorId: (id: string) => { id: string } };
  let uploadsService: {
    prepararArquivoParaCadastro: (
      categoria: 'documents',
      arquivoNome?: string,
      arquivoUrl?: string,
    ) => { arquivoNome: string; arquivoUrl?: string };
  };

  beforeEach(async () => {
    pedidosService = {
      buscarPorId: (id: string) => ({ id }),
    };
    uploadsService = {
      prepararArquivoParaCadastro: (
        _categoria: 'documents',
        arquivoNome?: string,
        arquivoUrl?: string,
      ) => ({
        arquivoNome: arquivoNome ?? 'pedido.pdf',
        arquivoUrl,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosService,
        DocumentosRepository,
        FareFotoStoreService,
        {
          provide: PedidosService,
          useValue: pedidosService,
        },
        {
          provide: UploadsService,
          useValue: uploadsService,
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

  it('should accept uploaded document URL and derive stored metadata', () => {
    const documento = service.criar({
      pedidoId: 'pedido-1',
      arquivoUrl: '/uploads/documents/doc-123.pdf',
      quantidade: 3,
      colorido: false,
    });

    expect(documento.arquivoNome).toBe('pedido.pdf');
    expect(documento.arquivoUrl).toBe('/uploads/documents/doc-123.pdf');
  });
});
