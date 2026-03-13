export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  cpfCnpj?: string;
  observacoes?: string;
  createdAt: Date;
}
