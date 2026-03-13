import type { PrazoPedido } from '../common/types/prazo-pedido.type';
import type { ItemDocumento } from '../documentos/item-documento.interface';
import type { ItemFoto } from '../fotos/item-foto.interface';
import type { ItemPrecificacao } from '../precificacao/interfaces/precificacao.interface';

export const PEDIDO_STATUS = [
  'recebido',
  'em_producao',
  'pronto',
  'entregue',
  'cancelado',
] as const;

export type PedidoStatus = (typeof PEDIDO_STATUS)[number];

export interface Pedido {
  id: string;
  clienteId: string;
  status: PedidoStatus;
  prazo: PrazoPedido;
  subtotal: number;
  taxaUrgencia: number;
  total: number;
  observacoes?: string;
  createdAt: Date;
}

export interface PedidoDetalhado extends Pedido {
  itens: ItemPrecificacao[];
  fotos: ItemFoto[];
  documentos: ItemDocumento[];
}
