# Fare Foto

Sistema web responsivo para a operacao completa da Fare Foto: envio de fotos e
documentos, simulacao de preco, acompanhamento de pedido, painel interno e
integracao com WhatsApp.

## Estrutura
- apps/web -> area do cliente
- apps/admin -> painel interno
- apps/api -> backend
- docs -> documentacao base
- packages -> compartilhamento de tipos, UI e configuracoes

## Stack atual
- `apps/api`: NestJS com uploads reais, notificacoes em tempo real e persistencia em PostgreSQL com fallback local
- `apps/admin`: Next.js para operacao interna, fila de pedidos, detalhe, filtros e sincronizacao em tempo real
- `apps/web`: Next.js para clientes, com editor basico de imagem, simulacao, envio e acompanhamento do pedido

## Como rodar localmente
Instale as dependencias na raiz:

```bash
npm install
```

Suba cada app em um terminal:

```bash
npm run dev:api
npm run dev:admin
npm run dev:web
```

Portas padrao:
- API: `http://localhost:3000`
- Admin: `http://localhost:3001`
- Web: `http://localhost:3002`

## Modo final sem Docker
Para subir a stack local em modo producao com PostgreSQL embutido:

```bash
npm run start:final
```

## Variaveis principais
Use a raiz como referencia. Um exemplo esta em [`.env.example`](/home/npp/Documentos/Dev/envia_arquivos/.env.example).

- `PORT`: porta da API
- `FARE_FOTO_STORE_PERSIST`: ativa persistencia local em arquivo JSON
- `FARE_FOTO_STORE_PATH`: caminho do arquivo de persistencia
- `DATABASE_URL`: conexao PostgreSQL para a persistencia principal
- `NEXT_PUBLIC_API_BASE_URL`: base da API para `admin` e `web`

## Validacao
```bash
npm run ci:validate
```

## Subir com Docker
Tambem da para subir a stack inteira com:

```bash
npm run docker:up
```

A stack sobe com PostgreSQL, healthchecks e volumes persistentes.
