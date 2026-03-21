import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import {
  createCliente,
  createPedido,
  getDefaultApiBaseUrl,
  getPedidoDetalhado,
  getWhatsappResumo,
  listClientes,
  listNotificacoes,
  listPedidos,
  marcarNotificacaoComoLida,
  updatePedidoStatus,
  uploadArquivos,
} from "@/lib/fare-foto-api";

jest.mock("@/lib/fare-foto-api", () => ({
  PRAZO_OPTIONS: [
    {
      value: "vinte_quatro_horas",
      label: "24 horas",
      helper: "Sem taxa de urgencia",
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
  ],
  PEDIDO_STATUS_OPTIONS: [
    {
      value: "recebido",
      label: "Recebido",
    },
    {
      value: "em_producao",
      label: "Em producao",
    },
    {
      value: "pronto",
      label: "Pronto",
    },
    {
      value: "entregue",
      label: "Entregue",
    },
    {
      value: "cancelado",
      label: "Cancelado",
    },
  ],
  createCliente: jest.fn(),
  createPedido: jest.fn(),
  getDefaultApiBaseUrl: jest.fn(),
  getPedidoDetalhado: jest.fn(),
  getWhatsappResumo: jest.fn(),
  listClientes: jest.fn(),
  listNotificacoes: jest.fn(),
  listPedidos: jest.fn(),
  marcarNotificacaoComoLida: jest.fn(),
  updatePedidoStatus: jest.fn(),
  uploadArquivos: jest.fn(),
}));

const mockedCreateCliente = jest.mocked(createCliente);
const mockedCreatePedido = jest.mocked(createPedido);
const mockedGetDefaultApiBaseUrl = jest.mocked(getDefaultApiBaseUrl);
const mockedGetPedidoDetalhado = jest.mocked(getPedidoDetalhado);
const mockedGetWhatsappResumo = jest.mocked(getWhatsappResumo);
const mockedListClientes = jest.mocked(listClientes);
const mockedListNotificacoes = jest.mocked(listNotificacoes);
const mockedListPedidos = jest.mocked(listPedidos);
const mockedMarcarNotificacaoComoLida = jest.mocked(
  marcarNotificacaoComoLida,
);
const mockedUpdatePedidoStatus = jest.mocked(updatePedidoStatus);
const mockedUploadArquivos = jest.mocked(uploadArquivos);

const pedidoDetalhadoPorId = {
  "pedido-1": {
    id: "pedido-1",
    clienteId: "cliente-1",
    status: "recebido",
    prazo: "uma_hora",
    subtotal: 20,
    taxaUrgencia: 5,
    total: 25,
    createdAt: "2026-03-21T12:00:00.000Z",
    observacoes: "Separar envelope",
    itens: [
      {
        tipo: "foto",
        tamanho: "10x15",
        quantidade: 2,
      },
    ],
    fotos: [
      {
        id: "foto-1",
        pedidoId: "pedido-1",
        arquivoNome: "familia.jpg",
        arquivoUrl: "/uploads/photos/familia.jpg",
        tamanho: "10x15",
        quantidade: 2,
      },
    ],
    documentos: [],
  },
  "pedido-9": {
    id: "pedido-9",
    clienteId: "cliente-9",
    status: "pronto",
    prazo: "vinte_quatro_horas",
    subtotal: 12,
    taxaUrgencia: 0,
    total: 12,
    createdAt: "2026-03-20T08:00:00.000Z",
    itens: [
      {
        tipo: "documento",
        quantidade: 3,
        colorido: true,
      },
    ],
    fotos: [],
    documentos: [
      {
        id: "doc-1",
        pedidoId: "pedido-9",
        arquivoNome: "contrato.pdf",
        arquivoUrl: "/uploads/documents/contrato.pdf",
        quantidade: 3,
        colorido: true,
      },
    ],
  },
  "pedido-2": {
    id: "pedido-2",
    clienteId: "cliente-2",
    status: "recebido",
    prazo: "uma_hora",
    subtotal: 10,
    taxaUrgencia: 5,
    total: 15,
    createdAt: "2026-03-21T12:11:00.000Z",
    itens: [
      {
        tipo: "foto",
        tamanho: "10x15",
        quantidade: 1,
      },
    ],
    fotos: [
      {
        id: "foto-2",
        pedidoId: "pedido-2",
        arquivoNome: "familia.jpg",
        arquivoUrl: "/uploads/photos/uploaded-photo-0.jpg",
        tamanho: "10x15",
        quantidade: 1,
      },
    ],
    documentos: [],
  },
} as const;

describe("Admin Home page", () => {
  beforeEach(() => {
    mockedGetDefaultApiBaseUrl.mockReturnValue("http://localhost:3000");
    mockedListClientes.mockResolvedValue([
      {
        id: "cliente-1",
        nome: "Ana",
        telefone: "11999999999",
        createdAt: "2026-03-21T12:00:00.000Z",
      },
      {
        id: "cliente-9",
        nome: "Carlos",
        telefone: "11888888888",
        createdAt: "2026-03-20T08:00:00.000Z",
      },
      {
        id: "cliente-2",
        nome: "Bruno",
        telefone: "11777777777",
        createdAt: "2026-03-21T12:10:00.000Z",
      },
    ]);
    mockedListPedidos.mockResolvedValue([
      {
        id: "pedido-1",
        clienteId: "cliente-1",
        status: "recebido",
        prazo: "uma_hora",
        subtotal: 20,
        taxaUrgencia: 5,
        total: 25,
        observacoes: "Separar envelope",
        createdAt: "2026-03-21T12:00:00.000Z",
      },
      {
        id: "pedido-9",
        clienteId: "cliente-9",
        status: "pronto",
        prazo: "vinte_quatro_horas",
        subtotal: 12,
        taxaUrgencia: 0,
        total: 12,
        createdAt: "2026-03-20T08:00:00.000Z",
      },
    ]);
    mockedListNotificacoes.mockResolvedValue([
      {
        id: "not-1",
        pedidoId: "pedido-1",
        tipo: "novo_pedido",
        mensagem: "Novo pedido recebido",
        lida: false,
        criadaEm: "2026-03-21T12:05:00.000Z",
      },
    ]);
    mockedGetPedidoDetalhado.mockImplementation(async (_baseUrl, pedidoId) => {
      return (
        pedidoDetalhadoPorId[pedidoId as keyof typeof pedidoDetalhadoPorId] ??
        pedidoDetalhadoPorId["pedido-1"]
      );
    });
    mockedUpdatePedidoStatus.mockResolvedValue({
      id: "pedido-1",
      clienteId: "cliente-1",
      status: "pronto",
      prazo: "uma_hora",
      subtotal: 20,
      taxaUrgencia: 5,
      total: 25,
      createdAt: "2026-03-21T12:00:00.000Z",
    });
    mockedMarcarNotificacaoComoLida.mockResolvedValue({
      id: "not-1",
      pedidoId: "pedido-1",
      tipo: "novo_pedido",
      mensagem: "Novo pedido recebido",
      lida: true,
      criadaEm: "2026-03-21T12:05:00.000Z",
    });
    mockedUploadArquivos.mockImplementation(async (_baseUrl, endpoint, files) =>
      endpoint === "photos"
        ? files.map((file, index) => ({
            categoria: "photos",
            originalName: file.name,
            filename: `uploaded-photo-${index}.jpg`,
            mimeType: file.type || "image/jpeg",
            size: file.size,
            url: `/uploads/photos/uploaded-photo-${index}.jpg`,
          }))
        : [],
    );
    mockedCreateCliente.mockResolvedValue({
      id: "cliente-2",
      nome: "Bruno",
      telefone: "11777777777",
      createdAt: "2026-03-21T12:10:00.000Z",
    });
    mockedCreatePedido.mockResolvedValue(pedidoDetalhadoPorId["pedido-2"]);
    mockedGetWhatsappResumo.mockResolvedValue({
      pedidoId: "pedido-2",
      mensagem: "Pedido Fare Foto\nCliente: Bruno",
      link: "https://wa.me/5511999999999?text=pedido",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads dashboard data and opens the most recent pedido detail", async () => {
    render(<Home />);

    expect(await screen.findByText("Pedido pedido-1")).toBeInTheDocument();
    expect(mockedListClientes).toHaveBeenCalledWith("http://localhost:3000");
    expect(mockedListPedidos).toHaveBeenCalledWith("http://localhost:3000");
    expect(mockedListNotificacoes).toHaveBeenCalledWith(
      "http://localhost:3000",
    );
    expect(mockedGetPedidoDetalhado).toHaveBeenCalledWith(
      "http://localhost:3000",
      "pedido-1",
    );
    const detalhe = screen.getByRole("region", { name: "Detalhes do pedido" });
    expect(within(detalhe).getByText("familia.jpg")).toBeInTheDocument();
    expect(within(detalhe).getByText("Separar envelope")).toBeInTheDocument();
  });

  it("filters the queue and opens another pedido detail on demand", async () => {
    const user = userEvent.setup();

    render(<Home />);
    await screen.findByText("Pedido pedido-1");

    fireEvent.change(screen.getByLabelText("Buscar pedido ou cliente"), {
      target: { value: "Carlos" },
    });
    await waitFor(() => {
      const fila = screen.getByRole("region", { name: "Fila de pedidos" });
      expect(within(fila).queryByText("Pedido pedido-1")).not.toBeInTheDocument();
      expect(within(fila).getByText("Pedido pedido-9")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Ver detalhes do pedido pedido-9" }),
    );

    await waitFor(() => {
      expect(mockedGetPedidoDetalhado).toHaveBeenCalledWith(
        "http://localhost:3000",
        "pedido-9",
      );
    });

    const detalhe = screen.getByRole("region", { name: "Detalhes do pedido" });
    expect(within(detalhe).getByText("contrato.pdf")).toBeInTheDocument();
    expect(within(detalhe).getByText("Carlos")).toBeInTheDocument();
  });

  it("submits the operational flow and shows the backend result", async () => {
    const user = userEvent.setup();

    render(<Home />);
    await screen.findByText("Pedido pedido-1");

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Bruno" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "11777777777" },
    });
    fireEvent.change(screen.getByLabelText("Arquivos de foto"), {
      target: {
        files: [new File(["image-bytes"], "familia.jpg", { type: "image/jpeg" })],
      },
    });
    await user.click(
      screen.getByRole("button", { name: "Executar fluxo agora" }),
    );

    await waitFor(() => {
      expect(mockedUploadArquivos).toHaveBeenCalledWith(
        "http://localhost:3000",
        "photos",
        expect.arrayContaining([expect.any(File)]),
      );
    });

    expect(mockedCreateCliente).toHaveBeenCalledWith("http://localhost:3000", {
      nome: "Bruno",
      telefone: "11777777777",
      observacoes: undefined,
    });
    expect(mockedCreatePedido).toHaveBeenCalledWith("http://localhost:3000", {
      clienteId: "cliente-2",
      prazo: "uma_hora",
      observacoes: undefined,
      fotos: [
        {
          arquivoUrl: "/uploads/photos/uploaded-photo-0.jpg",
          tamanho: "10x15",
          quantidade: 1,
        },
      ],
      documentos: undefined,
    });
    expect(
      await screen.findByRole("link", { name: "Abrir resumo no WhatsApp" }),
    ).toHaveAttribute("href", "https://wa.me/5511999999999?text=pedido");
    expect(await screen.findByText(/Pedido Fare Foto/)).toBeInTheDocument();
    expect(await screen.findByText(/Cliente: Bruno/)).toBeInTheDocument();
  });

  it("updates pedido status and opens the related pedido from notifications", async () => {
    const user = userEvent.setup();

    render(<Home />);
    await screen.findByText("Pedido pedido-1");

    fireEvent.change(screen.getByLabelText("Atualizar status do pedido pedido-1"), {
      target: { value: "pronto" },
    });
    await waitFor(() => {
      expect(mockedUpdatePedidoStatus).toHaveBeenCalledWith(
        "http://localhost:3000",
        "pedido-1",
        "pronto",
      );
    });

    await user.click(screen.getByRole("button", { name: "Abrir pedido pedido-1" }));
    await waitFor(() => {
      expect(mockedGetPedidoDetalhado).toHaveBeenCalledWith(
        "http://localhost:3000",
        "pedido-1",
      );
    });

    await user.click(
      screen.getByRole("button", {
        name: "Marcar notificacao not-1 como lida",
      }),
    );
    await waitFor(() => {
      expect(mockedMarcarNotificacaoComoLida).toHaveBeenCalledWith(
        "http://localhost:3000",
        "not-1",
      );
    });
  });
});
