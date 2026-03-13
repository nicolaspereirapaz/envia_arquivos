export const PRAZOS_PEDIDO = [
  'na_hora',
  'uma_hora',
  'vinte_quatro_horas',
] as const;

export type PrazoPedido = (typeof PRAZOS_PEDIDO)[number];
