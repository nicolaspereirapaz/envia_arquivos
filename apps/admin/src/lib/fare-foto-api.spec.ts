import {
  createCliente,
  createPedido,
  getPedidoDetalhado,
  getWhatsappResumo,
  listNotificacoes,
  listPedidos,
  marcarNotificacaoComoLida,
  updatePedidoStatus,
  uploadArquivos,
} from './fare-foto-api';

describe('fare-foto-api helpers', () => {
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

  it('should skip upload request when no files are provided', async () => {
    await expect(
      uploadArquivos('http://localhost:3000', 'photos', []),
    ).resolves.toEqual([]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should upload files using multipart form data', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            categoria: 'photos',
            originalName: 'familia.jpg',
            filename: 'uuid.jpg',
            mimeType: 'image/jpeg',
            size: 10,
            url: '/uploads/photos/uuid.jpg',
          },
        ]),
        {
          status: 201,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    const result = await uploadArquivos('http://localhost:3000/', 'photos', [
      new File(['image bytes'], 'familia.jpg', { type: 'image/jpeg' }),
    ]);

    expect(result).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/uploads/photos',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
        headers: expect.any(Headers),
      }),
    );

    const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers;
    expect(requestHeaders).toBeInstanceOf(Headers);
    expect((requestHeaders as Headers).get('Accept')).toBe('application/json');
    expect((requestHeaders as Headers).get('Content-Type')).toBeNull();
  });

  it('should create cliente with json payload', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'cliente-1',
          nome: 'Joao',
          telefone: '11999999999',
          createdAt: new Date().toISOString(),
        }),
        {
          status: 201,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    const result = await createCliente('http://localhost:3000', {
      nome: 'Joao',
      telefone: '11999999999',
    });

    expect(result.id).toBe('cliente-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/clientes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          nome: 'Joao',
          telefone: '11999999999',
        }),
        headers: expect.any(Headers),
      }),
    );
  });

  it('should surface validation errors from createPedido', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: ['Prazo invalido.', 'Informe ao menos um item.'],
        }),
        {
          status: 400,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    await expect(
      createPedido('http://localhost:3000', {
        clienteId: 'cliente-1',
        prazo: 'uma_hora',
      }),
    ).rejects.toThrow('Prazo invalido. | Informe ao menos um item.');
  });

  it('should get whatsapp summary from the expected route', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          pedidoId: 'pedido-1',
          mensagem: 'Pedido Fare Foto',
          link: 'https://wa.me/5511999999999?text=Pedido',
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    const result = await getWhatsappResumo('http://localhost:3000', 'pedido-1');

    expect(result.pedidoId).toBe('pedido-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/whatsapp/pedido/pedido-1/resumo',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('should list pedidos from the pedidos route', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 'pedido-1',
            clienteId: 'cliente-1',
            status: 'recebido',
            prazo: 'uma_hora',
            subtotal: 20,
            taxaUrgencia: 5,
            total: 25,
            createdAt: new Date().toISOString(),
          },
        ]),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    const result = await listPedidos('http://localhost:3000');

    expect(result).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/pedidos',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('should patch pedido status using the expected payload', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'pedido-1',
          clienteId: 'cliente-1',
          status: 'pronto',
          prazo: 'uma_hora',
          subtotal: 20,
          taxaUrgencia: 5,
          total: 25,
          createdAt: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    const result = await updatePedidoStatus(
      'http://localhost:3000',
      'pedido-1',
      'pronto',
    );

    expect(result.status).toBe('pronto');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/pedidos/pedido-1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'pronto' }),
      }),
    );
  });

  it('should get pedido detail from the expected route', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'pedido-1',
          clienteId: 'cliente-1',
          status: 'recebido',
          prazo: 'uma_hora',
          subtotal: 20,
          taxaUrgencia: 5,
          total: 25,
          createdAt: new Date().toISOString(),
          itens: [
            {
              tipo: 'foto',
              tamanho: '10x15',
              quantidade: 2,
            },
          ],
          fotos: [],
          documentos: [],
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    const result = await getPedidoDetalhado('http://localhost:3000', 'pedido-1');

    expect(result.id).toBe('pedido-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/pedidos/pedido-1',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('should list and mark notificacoes as read', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 'not-1',
              pedidoId: 'pedido-1',
              tipo: 'novo_pedido',
              mensagem: 'Novo pedido recebido',
              lida: false,
              criadaEm: new Date().toISOString(),
            },
          ]),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'not-1',
            pedidoId: 'pedido-1',
            tipo: 'novo_pedido',
            mensagem: 'Novo pedido recebido',
            lida: true,
            criadaEm: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
      );

    const notificacoes = await listNotificacoes('http://localhost:3000');
    const notificacaoAtualizada = await marcarNotificacaoComoLida(
      'http://localhost:3000',
      'not-1',
    );

    expect(notificacoes).toHaveLength(1);
    expect(notificacaoAtualizada.lida).toBe(true);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/notificacoes',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/notificacoes/not-1/lida',
      expect.objectContaining({
        method: 'PATCH',
      }),
    );
  });
});
