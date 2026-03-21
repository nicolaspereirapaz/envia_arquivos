import {
  createCliente,
  createPedido,
  getCliente,
  getPedidoDetalhado,
  getWhatsappResumo,
  simularPrecificacao,
  uploadArquivos,
} from "./fare-foto-web-api";

describe("fare-foto-web-api helpers", () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("skips upload when no files are provided", async () => {
    await expect(
      uploadArquivos("http://localhost:3000", "photos", []),
    ).resolves.toEqual([]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("simulates pricing using the expected endpoint", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
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
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const result = await simularPrecificacao("http://localhost:3000", {
      prazo: "uma_hora",
      itens: [
        {
          tipo: "foto",
          tamanho: "10x15",
          quantidade: 20,
        },
      ],
    });

    expect(result.total).toBe(25);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/precificacao/simular",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("fetches cliente and pedido details from the API", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "cliente-1",
            nome: "Ana",
            telefone: "11999999999",
            createdAt: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "pedido-1",
            clienteId: "cliente-1",
            status: "recebido",
            prazo: "uma_hora",
            subtotal: 20,
            taxaUrgencia: 5,
            total: 25,
            createdAt: new Date().toISOString(),
            itens: [],
            fotos: [],
            documentos: [],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

    const cliente = await getCliente("http://localhost:3000", "cliente-1");
    const pedido = await getPedidoDetalhado("http://localhost:3000", "pedido-1");

    expect(cliente.nome).toBe("Ana");
    expect(pedido.id).toBe("pedido-1");
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3000/clientes/cliente-1",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/pedidos/pedido-1",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("creates cliente, pedido and gets whatsapp summary", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "cliente-1",
            nome: "Bruno",
            telefone: "11988888888",
            createdAt: new Date().toISOString(),
          }),
          {
            status: 201,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "pedido-1",
            clienteId: "cliente-1",
            status: "recebido",
            prazo: "uma_hora",
            subtotal: 10,
            taxaUrgencia: 5,
            total: 15,
            itens: [],
            fotos: [],
            documentos: [],
          }),
          {
            status: 201,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            pedidoId: "pedido-1",
            mensagem: "Pedido Fare Foto",
            link: "https://wa.me/5511999999999?text=pedido",
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

    const cliente = await createCliente("http://localhost:3000", {
      nome: "Bruno",
      telefone: "11988888888",
    });
    const pedido = await createPedido("http://localhost:3000", {
      clienteId: cliente.id,
      prazo: "uma_hora",
      fotos: [
        {
          arquivoUrl: "/uploads/photos/foto-1.jpg",
          tamanho: "10x15",
          quantidade: 1,
        },
      ],
    });
    const whatsapp = await getWhatsappResumo("http://localhost:3000", pedido.id);

    expect(cliente.id).toBe("cliente-1");
    expect(pedido.total).toBe(15);
    expect(whatsapp.link).toContain("wa.me");
  });
});
