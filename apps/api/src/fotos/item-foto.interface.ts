export interface ItemFoto {
  id: string;
  pedidoId: string;
  arquivoNome: string;
  arquivoUrl?: string;
  tamanho: string;
  quantidade: number;
  brilho?: number;
  contraste?: number;
  saturacao?: number;
  cropData?: string;
  createdAt: Date;
}
