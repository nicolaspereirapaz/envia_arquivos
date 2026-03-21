import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FareFotoStoreService } from '../common/persistence/fare-foto-store.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { UploadsService } from '../uploads/uploads.service';
import { FotosRepository } from './repositories/fotos.repository';
import { FotosService } from './fotos.service';

describe('FotosService', () => {
  let service: FotosService;
  let pedidosService: { buscarPorId: (id: string) => { id: string } };
  let uploadsService: {
    prepararArquivoParaCadastro: (
      categoria: 'photos',
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
        _categoria: 'photos',
        arquivoNome?: string,
        arquivoUrl?: string,
      ) => ({
        arquivoNome: arquivoNome ?? 'familia.jpg',
        arquivoUrl,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FotosService,
        FotosRepository,
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

    service = module.get<FotosService>(FotosService);
  });

  it('should create and get foto by id', () => {
    const foto = service.criar({
      pedidoId: 'pedido-1',
      arquivoNome: 'foto1.jpg',
      tamanho: '10x15',
      quantidade: 20,
    });

    expect(foto.createdAt).toBeInstanceOf(Date);
    expect(service.buscarPorId(foto.id)).toEqual(foto);
    expect(service.listarPorPedidoId('pedido-1')).toHaveLength(1);
  });

  it('should validate pedido existence', () => {
    jest.spyOn(pedidosService, 'buscarPorId').mockImplementation(() => {
      throw new NotFoundException('Pedido nao encontrado.');
    });

    expect(() =>
      service.criar({
        pedidoId: 'pedido-invalido',
        arquivoNome: 'foto1.jpg',
        tamanho: '10x15',
        quantidade: 1,
      }),
    ).toThrow('Pedido nao encontrado.');
  });

  it('should accept uploaded file URL and derive stored metadata', () => {
    const foto = service.criar({
      pedidoId: 'pedido-1',
      arquivoUrl: '/uploads/photos/foto-123.jpg',
      tamanho: '10x15',
      quantidade: 2,
    });

    expect(foto.arquivoNome).toBe('familia.jpg');
    expect(foto.arquivoUrl).toBe('/uploads/photos/foto-123.jpg');
  });
});
