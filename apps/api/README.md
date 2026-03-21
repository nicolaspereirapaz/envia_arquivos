# API

Backend NestJS da Fare Foto.

## Responsabilidades
- cadastro e consulta de clientes
- simulacao de precificacao
- criacao e consulta de pedidos
- upload real de fotos e documentos
- notificacoes e stream SSE
- resumo para WhatsApp

## Como rodar
```bash
npm run start:dev
```

A API sobe por padrao em `http://localhost:3000` e expõe Swagger em
`http://localhost:3000/api`.

## Persistencia atual
- persistencia principal em PostgreSQL quando `DATABASE_URL` estiver definida
- fallback local em arquivo JSON via `tmp/fare-foto-store.json` quando o banco nao estiver configurado
- uploads gravados em `uploads/`
- a persistencia local pode ser configurada com `FARE_FOTO_STORE_PERSIST` e `FARE_FOTO_STORE_PATH`

## Testes
```bash
npm run test
npm run test:e2e
npm run build
```

## Principais rotas
- `GET /health`
- `POST /clientes`
- `GET /clientes`
- `GET /clientes/:id`
- `POST /precificacao/simular`
- `POST /uploads/photos`
- `POST /uploads/documents`
- `POST /pedidos`
- `GET /pedidos`
- `GET /pedidos/:id`
- `PATCH /pedidos/:id/status`
- `GET /notificacoes`
- `GET /notificacoes/stream`
- `PATCH /notificacoes/:id/lida`
- `GET /whatsapp/pedido/:id/resumo`
