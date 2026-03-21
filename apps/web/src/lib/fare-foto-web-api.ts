export const PRAZO_OPTIONS = [
  {
    value: "vinte_quatro_horas",
    label: "24 horas",
    helper: "Mais economico para pedidos planejados",
  },
  {
    value: "uma_hora",
    label: "1 hora",
    helper: "Taxa fixa de R$ 5,00",
  },
  {
    value: "na_hora",
    label: "Na hora",
    helper: "Taxa fixa de R$ 10,00",
  },
] as const;

export const FOTO_TAMANHOS = ["10x15", "13x18", "15x21"] as const;

export const PHOTO_CROP_PRESETS = [
  {
    value: "original",
    label: "Original",
  },
  {
    value: "quadrado",
    label: "Quadrado",
  },
  {
    value: "retrato",
    label: "Retrato",
  },
  {
    value: "paisagem",
    label: "Paisagem",
  },
] as const;

export type PrazoPedido = (typeof PRAZO_OPTIONS)[number]["value"];
export type FotoTamanho = (typeof FOTO_TAMANHOS)[number];
export type UploadEndpoint = "photos" | "documents";
export type PedidoStatus =
  | "recebido"
  | "em_producao"
  | "pronto"
  | "entregue"
  | "cancelado";

export interface UploadedArquivo {
  categoria: UploadEndpoint;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  observacoes?: string;
  createdAt: string;
}

export interface SimulacaoPrecificacao {
  subtotal: number;
  taxaUrgencia: number;
  total: number;
  detalhes: Array<{
    tipo: "foto" | "documento";
    descricao: string;
    valorUnitario: number;
    quantidade: number;
    totalItem: number;
  }>;
}

export interface PedidoDetalhado {
  id: string;
  clienteId: string;
  status: PedidoStatus;
  prazo: PrazoPedido;
  subtotal: number;
  taxaUrgencia: number;
  total: number;
  observacoes?: string;
  createdAt?: string;
  itens: Array<
    | {
        tipo: "foto";
        tamanho: string;
        quantidade: number;
      }
    | {
        tipo: "documento";
        quantidade: number;
        colorido: boolean;
      }
  >;
  fotos: Array<{
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
  }>;
  documentos: Array<{
    id: string;
    pedidoId: string;
    arquivoNome: string;
    arquivoUrl?: string;
    quantidade: number;
    colorido: boolean;
    tipoImpressao?: string;
    acabamento?: string;
  }>;
}

export interface WhatsappResumoPedido {
  pedidoId: string;
  mensagem: string;
  link: string;
}

export interface CreateClientePayload {
  nome: string;
  telefone: string;
  observacoes?: string;
}

export interface SimularPrecificacaoPayload {
  prazo: PrazoPedido;
  itens: Array<
    | {
        tipo: "foto";
        tamanho: string;
        quantidade: number;
      }
    | {
        tipo: "documento";
        quantidade: number;
        colorido: boolean;
      }
  >;
}

export interface CreatePedidoPayload {
  clienteId: string;
  prazo: PrazoPedido;
  observacoes?: string;
  fotos?: Array<{
    arquivoNome?: string;
    arquivoUrl?: string;
    tamanho: string;
    quantidade: number;
    brilho?: number;
    contraste?: number;
    saturacao?: number;
    cropData?: string;
  }>;
  documentos?: Array<{
    arquivoNome?: string;
    arquivoUrl?: string;
    quantidade: number;
    colorido: boolean;
    tipoImpressao?: string;
    acabamento?: string;
  }>;
}

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:3000";

export function getDefaultApiBaseUrl(): string {
  return DEFAULT_API_BASE_URL;
}

export async function uploadArquivos(
  baseUrl: string,
  endpoint: UploadEndpoint,
  files: File[],
): Promise<UploadedArquivo[]> {
  if (files.length === 0) {
    return [];
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  return requestJson<UploadedArquivo[]>(baseUrl, `/uploads/${endpoint}`, {
    method: "POST",
    body: formData,
  });
}

export async function createCliente(
  baseUrl: string,
  payload: CreateClientePayload,
): Promise<Cliente> {
  return requestJson<Cliente>(baseUrl, "/clientes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCliente(
  baseUrl: string,
  clienteId: string,
): Promise<Cliente> {
  return requestJson<Cliente>(baseUrl, `/clientes/${clienteId}`, {
    method: "GET",
  });
}

export async function simularPrecificacao(
  baseUrl: string,
  payload: SimularPrecificacaoPayload,
): Promise<SimulacaoPrecificacao> {
  return requestJson<SimulacaoPrecificacao>(baseUrl, "/precificacao/simular", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createPedido(
  baseUrl: string,
  payload: CreatePedidoPayload,
): Promise<PedidoDetalhado> {
  return requestJson<PedidoDetalhado>(baseUrl, "/pedidos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPedidoDetalhado(
  baseUrl: string,
  pedidoId: string,
): Promise<PedidoDetalhado> {
  return requestJson<PedidoDetalhado>(baseUrl, `/pedidos/${pedidoId}`, {
    method: "GET",
  });
}

export async function getWhatsappResumo(
  baseUrl: string,
  pedidoId: string,
): Promise<WhatsappResumoPedido> {
  return requestJson<WhatsappResumoPedido>(
    baseUrl,
    `/whatsapp/pedido/${pedidoId}/resumo`,
    {
      method: "GET",
    },
  );
}

function normalizeBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, "");

  if (normalized.length === 0) {
    throw new Error("Informe a URL base da API.");
  }

  return normalized;
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const isFormData = init.body instanceof FormData;
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");

  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
    ...init,
    headers,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.statusText));
  }

  return payload as T;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;

    if (Array.isArray(message) && message.length > 0) {
      return message.join(" | ");
    }

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}
