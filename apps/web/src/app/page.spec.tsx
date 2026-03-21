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
  getCliente,
  getDefaultApiBaseUrl,
  getPedidoDetalhado,
  getWhatsappResumo,
  simularPrecificacao,
  uploadArquivos,
} from "@/lib/fare-foto-web-api";

jest.mock("@/lib/fare-foto-web-api", () => ({
  FOTO_TAMANHOS: ["10x15", "13x18", "15x21"],
  PHOTO_CROP_PRESETS: [
    { value: "original", label: "Original" },
    { value: "quadrado", label: "Quadrado" },
    { value: "retrato", label: "Retrato" },
    { value: "paisagem", label: "Paisagem" },
  ],
  PRAZO_OPTIONS: [
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
  ],
  createCliente: jest.fn(),
  createPedido: jest.fn(),
  getCliente: jest.fn(),
  getDefaultApiBaseUrl: jest.fn(),
  getPedidoDetalhado: jest.fn(),
  getWhatsappResumo: jest.fn(),
  simularPrecificacao: jest.fn(),
  uploadArquivos: jest.fn(),
}));

const mockedCreateCliente = jest.mocked(createCliente);
const mockedCreatePedido = jest.mocked(createPedido);
const mockedGetCliente = jest.mocked(getCliente);
const mockedGetDefaultApiBaseUrl = jest.mocked(getDefaultApiBaseUrl);
const mockedGetPedidoDetalhado = jest.mocked(getPedidoDetalhado);
const mockedGetWhatsappResumo = jest.mocked(getWhatsappResumo);
const mockedSimularPrecificacao = jest.mocked(simularPrecificacao);
const mockedUploadArquivos = jest.mocked(uploadArquivos);

describe("Web Home page", () => {
  beforeEach(() => {
    mockedGetDefaultApiBaseUrl.mockReturnValue("http://localhost:3000");
    mockedSimularPrecificacao.mockResolvedValue({
      subtotal: 20,
      taxaUrgencia: 5,
      total: 25,
      detalhes: [
        {
          tipo: "foto",
          descricao: "Foto 10x15",
          valorUnitario: 1,
          quantidade: 20,
          totalItem: 20,
        },
      ],
    });
    mockedUploadArquivos.mockImplementation(async (_baseUrl, endpoint, files) =>
      endpoint === "photos"
        ? files.map((file, index) => ({
            categoria: "photos",
            originalName: file.name,
            filename: `photo-${index}.jpg`,
            mimeType: file.type || "image/jpeg",
            size: file.size,
            url: `/uploads/photos/photo-${index}.jpg`,
          }))
        : [],
    );
    mockedCreateCliente.mockResolvedValue({
      id: "cliente-1",
      nome: "Julia",
      telefone: "11999999999",
      createdAt: "2026-03-21T12:00:00.000Z",
    });
    mockedCreatePedido.mockResolvedValue({
      id: "pedido-1",
      clienteId: "cliente-1",
      status: "recebido",
      prazo: "uma_hora",
      subtotal: 20,
      taxaUrgencia: 5,
      total: 25,
      createdAt: "2026-03-21T12:10:00.000Z",
      itens: [],
      fotos: [
        {
          id: "foto-1",
          pedidoId: "pedido-1",
          arquivoNome: "familia.jpg",
          arquivoUrl: "/uploads/photos/photo-0.jpg",
          tamanho: "10x15",
          quantidade: 1,
        },
      ],
      documentos: [],
    });
    mockedGetWhatsappResumo.mockResolvedValue({
      pedidoId: "pedido-1",
      mensagem: "Pedido Fare Foto\nCliente: Julia",
      link: "https://wa.me/5511999999999?text=pedido",
    });
    mockedGetPedidoDetalhado.mockResolvedValue({
      id: "pedido-77",
      clienteId: "cliente-77",
      status: "em_producao",
      prazo: "uma_hora",
      subtotal: 15,
      taxaUrgencia: 5,
      total: 20,
      createdAt: "2026-03-21T13:00:00.000Z",
      itens: [],
      fotos: [],
      documentos: [
        {
          id: "doc-1",
          pedidoId: "pedido-77",
          arquivoNome: "contrato.pdf",
          quantidade: 2,
          colorido: true,
        },
      ],
    });
    mockedGetCliente.mockResolvedValue({
      id: "cliente-77",
      nome: "Marina",
      telefone: "11888888888",
      createdAt: "2026-03-21T12:00:00.000Z",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("simulates pricing after adding a photo", async () => {
    const user = userEvent.setup();

    render(<Home />);

    fireEvent.change(screen.getByLabelText("Arquivos de foto"), {
      target: {
        files: [new File(["image"], "familia.jpg", { type: "image/jpeg" })],
      },
    });
    await user.click(screen.getByRole("button", { name: "Simular preco" }));

    await waitFor(() => {
      expect(mockedSimularPrecificacao).toHaveBeenCalledWith(
        "http://localhost:3000",
        {
          prazo: "uma_hora",
          itens: [
            {
              tipo: "foto",
              tamanho: "10x15",
              quantidade: 1,
            },
          ],
        },
      );
    });

    expect(await screen.findByText("Foto 10x15")).toBeInTheDocument();
    expect(
      screen.getAllByText((content) => content.includes("25,00")).length,
    ).toBeGreaterThan(0);
  });

  it("creates a pedido and shows the final whatsapp summary", async () => {
    const user = userEvent.setup();

    render(<Home />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Julia" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "11999999999" },
    });
    fireEvent.change(screen.getByLabelText("Arquivos de foto"), {
      target: {
        files: [new File(["image"], "familia.jpg", { type: "image/jpeg" })],
      },
    });
    await user.click(screen.getByRole("button", { name: "Enviar pedido" }));

    await waitFor(() => {
      expect(mockedCreateCliente).toHaveBeenCalledWith("http://localhost:3000", {
        nome: "Julia",
        telefone: "11999999999",
        observacoes: undefined,
      });
    });

    expect(mockedCreatePedido).toHaveBeenCalledWith("http://localhost:3000", {
      clienteId: "cliente-1",
      prazo: "uma_hora",
      observacoes: undefined,
      fotos: [
        {
          arquivoUrl: "/uploads/photos/photo-0.jpg",
          tamanho: "10x15",
          quantidade: 1,
          brilho: 100,
          contraste: 100,
          saturacao: 100,
          cropData: undefined,
        },
      ],
      documentos: [],
    });
    expect(
      await screen.findByRole("link", { name: "Abrir resumo no WhatsApp" }),
    ).toHaveAttribute("href", "https://wa.me/5511999999999?text=pedido");
    expect(await screen.findByText(/Cliente: Julia/)).toBeInTheDocument();
  });

  it("tracks an existing pedido by code", async () => {
    const user = userEvent.setup();

    render(<Home />);

    fireEvent.change(screen.getByLabelText("Codigo do pedido"), {
      target: { value: "pedido-77" },
    });
    await user.click(screen.getByRole("button", { name: "Acompanhar" }));

    await waitFor(() => {
      expect(mockedGetPedidoDetalhado).toHaveBeenCalledWith(
        "http://localhost:3000",
        "pedido-77",
      );
    });

    const acompanhamento = await screen.findByText(/Status atual:/);
    expect(acompanhamento).toBeInTheDocument();
    expect(screen.getByText("Marina")).toBeInTheDocument();
    expect(screen.getByText("contrato.pdf")).toBeInTheDocument();

    const links = screen.getAllByRole("link", {
      name: /Abrir resumo/i,
    });
    expect(links[0]).toHaveAttribute(
      "href",
      "https://wa.me/5511999999999?text=pedido",
    );

    const section = screen.getByText("Documentos enviados").closest("div");
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).getByText("contrato.pdf")).toBeInTheDocument();
  });
});
