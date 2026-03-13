export interface Notificacao {
  id: string;
  pedidoId: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  criadaEm: Date;
}
