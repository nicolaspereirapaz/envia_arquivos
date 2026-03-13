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

  it('should run the main pedido flow', async () => {
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
            arquivoNome: 'familia.jpg',
            tamanho: '10x15',
            quantidade: 20,
          },
        ],
      })
      .expect(201);

    const pedido = pedidoResponse.body as {
      id: string;
      clienteId: string;
      total: number;
      fotos: Array<{ pedidoId: string }>;
    };

    expect(pedido.clienteId).toBe(cliente.id);
    expect(pedido.total).toBe(25);
    expect(pedido.fotos).toHaveLength(1);

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

    const whatsappResponse = await request(app.getHttpServer())
      .get(`/whatsapp/pedido/${pedido.id}/resumo`)
      .expect(200);
    const whatsapp = whatsappResponse.body as {
      mensagem: string;
      link: string;
    };

    expect(whatsapp.mensagem).toContain(`Cliente: ${cliente.nome}`);
    expect(whatsapp.link).toContain('https://wa.me/');
  });
});
