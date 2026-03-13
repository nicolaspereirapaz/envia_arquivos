export interface ItemDocumento {
  id: string;
  pedidoId: string;
  arquivoNome: string;
  arquivoUrl?: string;
  quantidade: number;
  colorido: boolean;
  tipoImpressao?: string;
  acabamento?: string;
  createdAt: Date;
}
