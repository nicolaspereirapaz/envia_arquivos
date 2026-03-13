import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PedidosService } from '../pedidos/pedidos.service';
import { FotosRepository } from './repositories/fotos.repository';
import { FotosService } from './fotos.service';

describe('FotosService', () => {
  let service: FotosService;
  let pedidosService: { buscarPorId: (id: string) => { id: string } };

  beforeEach(async () => {
    pedidosService = {
      buscarPorId: (id: string) => ({ id }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FotosService,
        FotosRepository,
        {
          provide: PedidosService,
          useValue: pedidosService,
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
});
