import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Fare Foto API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
      persistence: 'memory',
    });
  });

  it('should upload photo files', async () => {
    const response = await request(app.getHttpServer())
      .post('/uploads/photos')
      .attach('files', Buffer.from('foto fake 1'), {
        filename: 'familia.jpg',
        contentType: 'image/jpeg',
      })
      .attach('files', Buffer.from('foto fake 2'), {
        filename: 'produto.png',
        contentType: 'image/png',
      })
      .expect(201);

    const arquivos = response.body as Array<{
      categoria: string;
      originalName: string;
      filename: string;
      url: string;
    }>;

    expect(arquivos).toHaveLength(2);
    expect(arquivos[0].categoria).toBe('photos');
    expect(arquivos[0].originalName).toBe('familia.jpg');
    expect(arquivos[0].filename).toEqual(expect.any(String));
    expect(arquivos[0].url).toContain('/uploads/photos/');
  });

  it('should upload document files', async () => {
    const response = await request(app.getHttpServer())
      .post('/uploads/documents')
      .attach('files', Buffer.from('documento fake'), {
        filename: 'pedido.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    const arquivos = response.body as Array<{
      categoria: string;
      originalName: string;
      url: string;
    }>;

    expect(arquivos).toHaveLength(1);
    expect(arquivos[0]).toMatchObject({
      categoria: 'documents',
      originalName: 'pedido.pdf',
    });
    expect(arquivos[0].url).toContain('/uploads/documents/');
  });

  it('should run the main pedido flow', async () => {
    const fotosUploadResponse = await request(app.getHttpServer())
      .post('/uploads/photos')
      .attach('files', Buffer.from('foto fake do pedido'), {
        filename: 'familia.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);
    const uploadedPhotos = fotosUploadResponse.body as Array<{
      url: string;
    }>;
    const fotoUpload = uploadedPhotos[0];

    const documentosUploadResponse = await request(app.getHttpServer())
      .post('/uploads/documents')
      .attach('files', Buffer.from('documento fake do pedido'), {
        filename: 'contrato.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    const uploadedDocuments = documentosUploadResponse.body as Array<{
      url: string;
    }>;
    const documentoUpload = uploadedDocuments[0];

    const clienteResponse = await request(app.getHttpServer())
      .post('/clientes')
      .send({
        nome: 'Joao',
        telefone: '11999999999',
      })
      .expect(201);

    const cliente = clienteResponse.body as {
      id: string;
      nome: string;
      telefone: string;
    };

    await request(app.getHttpServer())
      .post('/precificacao/simular')
      .send({
        itens: [
          {
            tipo: 'foto',
            tamanho: '10x15',
            quantidade: 20,
          },
        ],
        prazo: 'uma_hora',
      })
      .expect(200)
      .expect({
        subtotal: 20,
        taxaUrgencia: 5,
        total: 25,
        detalhes: [
          {
            tipo: 'foto',
            descricao: 'Foto 10x15',
            valorUnitario: 1,
            quantidade: 20,
            totalItem: 20,
          },
        ],
      });

    const pedidoResponse = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        clienteId: cliente.id,
        prazo: 'uma_hora',
        fotos: [
          {
            arquivoUrl: fotoUpload.url,
            tamanho: '10x15',
            quantidade: 20,
          },
        ],
        documentos: [
          {
            arquivoUrl: documentoUpload.url,
            quantidade: 2,
            colorido: false,
          },
        ],
      })
      .expect(201);

    const pedido = pedidoResponse.body as {
      id: string;
      clienteId: string;
      total: number;
      fotos: Array<{
        pedidoId: string;
        arquivoNome: string;
        arquivoUrl?: string;
      }>;
      documentos: Array<{
        pedidoId: string;
        arquivoNome: string;
        arquivoUrl?: string;
      }>;
    };

    expect(pedido.clienteId).toBe(cliente.id);
    expect(pedido.total).toBe(26);
    expect(pedido.fotos).toHaveLength(1);
    expect(pedido.fotos[0].arquivoNome).toBe('familia.jpg');
    expect(pedido.fotos[0].arquivoUrl).toBe(fotoUpload.url);
    expect(pedido.documentos).toHaveLength(1);
    expect(pedido.documentos[0].arquivoNome).toBe('contrato.pdf');
    expect(pedido.documentos[0].arquivoUrl).toBe(documentoUpload.url);

    const notificacoesResponse = await request(app.getHttpServer())
      .get('/notificacoes')
      .expect(200);
    const notificacoes = notificacoesResponse.body as Array<{
      pedidoId: string;
    }>;

    expect(notificacoes).toHaveLength(1);
    expect(notificacoes[0].pedidoId).toBe(pedido.id);

    const fotosResponse = await request(app.getHttpServer())
      .get(`/fotos/pedido/${pedido.id}`)
      .expect(200);
    const fotos = fotosResponse.body as Array<{ pedidoId: string }>;

    expect(fotos).toHaveLength(1);
    expect(fotos[0].pedidoId).toBe(pedido.id);

    const documentosResponse = await request(app.getHttpServer())
      .get(`/documentos/pedido/${pedido.id}`)
      .expect(200);
    const documentos = documentosResponse.body as Array<{ pedidoId: string }>;

    expect(documentos).toHaveLength(1);
    expect(documentos[0].pedidoId).toBe(pedido.id);

    const whatsappResponse = await request(app.getHttpServer())
      .get(`/whatsapp/pedido/${pedido.id}/resumo`)
      .expect(200);
    const whatsapp = whatsappResponse.body as {
      mensagem: string;
      link: string;
    };

    expect(whatsapp.mensagem).toContain(`Cliente: ${cliente.nome}`);
    expect(whatsapp.mensagem).toContain('- familia.jpg | 10x15 | qtd 20');
    expect(whatsapp.mensagem).toContain(
      '- contrato.pdf | preto e branco | qtd 2',
    );
    expect(whatsapp.link).toContain('https://wa.me/');
  });
});
