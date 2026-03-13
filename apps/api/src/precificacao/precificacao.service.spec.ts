import { Test, TestingModule } from '@nestjs/testing';
import { PrecificacaoService } from './precificacao.service';

describe('PrecificacaoService', () => {
  let service: PrecificacaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrecificacaoService],
    }).compile();

    service = module.get<PrecificacaoService>(PrecificacaoService);
  });

  it('should simulate photo pricing example', () => {
    const resultado = service.simular({
      itens: [
        {
          tipo: 'foto',
          tamanho: '10x15',
          quantidade: 20,
        },
      ],
      prazo: 'uma_hora',
    });

    expect(resultado).toEqual({
      subtotal: 20,
      taxaUrgencia: 5,
      total: 25,
      detalhes: [
        {
          tipo: 'foto',
          descricao: 'Foto 10x15',
          valorUnitario: 1,
          quantidade: 20,
          totalItem: 20,
        },
      ],
    });
  });

  it('should simulate documento pb and colorido', () => {
    const resultado = service.simular({
      itens: [
        {
          tipo: 'documento',
          quantidade: 2,
          colorido: false,
        },
        {
          tipo: 'documento',
          quantidade: 3,
          colorido: true,
        },
      ],
      prazo: 'vinte_quatro_horas',
    });

    expect(resultado.subtotal).toBe(5.5);
    expect(resultado.taxaUrgencia).toBe(0);
    expect(resultado.total).toBe(5.5);
  });

  it('should reject invalid prazo', () => {
    expect(() =>
      service.simular({
        itens: [
          {
            tipo: 'foto',
            tamanho: '10x15',
            quantidade: 1,
          },
        ],
        prazo: 'amanha' as never,
      }),
    ).toThrow('Prazo inválido.');
  });

  it('should reject invalid tamanho', () => {
    expect(() =>
      service.simular({
        itens: [
          {
            tipo: 'foto',
            tamanho: '9x9',
            quantidade: 1,
          },
        ],
        prazo: 'na_hora',
      }),
    ).toThrow('Tamanho de foto inválido no item 1.');
  });
});
