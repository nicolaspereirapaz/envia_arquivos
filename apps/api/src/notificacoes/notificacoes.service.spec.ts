import { Test, TestingModule } from '@nestjs/testing';
import { FareFotoStoreService } from '../common/persistence/fare-foto-store.service';
import { NotificacoesRepository } from './repositories/notificacoes.repository';
import { NotificacoesService } from './notificacoes.service';

describe('NotificacoesService', () => {
  let service: NotificacoesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacoesService,
        NotificacoesRepository,
        FareFotoStoreService,
      ],
    }).compile();

    service = module.get<NotificacoesService>(NotificacoesService);
  });

  it('should emit snapshot and updates through the notification stream', () => {
    const events: Array<{
      type?: string;
      data?: {
        reason: string;
        notificacoes: Array<{ mensagem: string; lida: boolean }>;
      };
    }> = [];

    const subscription = service.stream().subscribe((event) => {
      events.push(event);
    });

    service.criar({
      pedidoId: 'pedido-1',
      tipo: 'novo_pedido',
      mensagem: 'Novo pedido recebido',
    });

    const notificacao = service.listar()[0];
    service.marcarComoLida(notificacao.id);

    subscription.unsubscribe();

    expect(events).toHaveLength(3);
    expect(events[0].data?.reason).toBe('snapshot');
    expect(events[1].data?.reason).toBe('criada');
    expect(events[1].data?.notificacoes).toHaveLength(1);
    expect(events[2].data?.reason).toBe('atualizada');
    expect(events[2].data?.notificacoes[0].lida).toBe(true);
  });
});
