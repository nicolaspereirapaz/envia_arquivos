export type TipoItemPrecificacao = 'foto' | 'documento';

export interface ItemPrecificacaoFoto {
  tipo: 'foto';
  tamanho: string;
  quantidade: number;
}

export interface ItemPrecificacaoDocumento {
  tipo: 'documento';
  quantidade: number;
  colorido: boolean;
}

export type ItemPrecificacao = ItemPrecificacaoFoto | ItemPrecificacaoDocumento;

export interface DetalhePrecificacao {
  tipo: TipoItemPrecificacao;
  descricao: string;
  valorUnitario: number;
  quantidade: number;
  totalItem: number;
}

export interface SimulacaoPrecificacao {
  subtotal: number;
  taxaUrgencia: number;
  total: number;
  detalhes: DetalhePrecificacao[];
}
