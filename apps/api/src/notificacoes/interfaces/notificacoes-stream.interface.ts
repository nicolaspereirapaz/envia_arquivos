import type { Notificacao } from '../notificacao.interface';

export interface NotificacoesStreamPayload {
  reason: 'snapshot' | 'criada' | 'atualizada';
  updatedAt: string;
  notificacoes: Array<{
    id: string;
    pedidoId: string;
    tipo: string;
    mensagem: string;
    lida: boolean;
    criadaEm: string;
  }>;
}

export function serializarNotificacao(
  notificacao: Notificacao,
): NotificacoesStreamPayload['notificacoes'][number] {
  return {
    ...notificacao,
    criadaEm: notificacao.criadaEm.toISOString(),
  };
}
