# Contratos da API

## Health

### GET /health
Retorna status basico da API e o driver de persistencia em uso.

Response
```json
{
  "status": "ok",
  "persistence": "postgres"
}
```

## Clientes

### POST /clientes
Cria cliente.

Request JSON
```json
{
  "nome": "Joao",
  "telefone": "11999999999",
  "observacoes": "Cliente recorrente"
}
```

### GET /clientes
Lista clientes.

### GET /clientes/:id
Consulta um cliente.

## Precificacao

### POST /precificacao/simular
Simula valor do pedido antes da criacao.

Request JSON
```json
{
  "prazo": "uma_hora",
  "itens": [
    {
      "tipo": "foto",
      "tamanho": "10x15",
      "quantidade": 20
    },
    {
      "tipo": "documento",
      "quantidade": 2,
      "colorido": false
    }
  ]
}
```

## Uploads

### POST /uploads/photos
Envia fotos em `multipart/form-data` com o campo `files`.

Response
```json
[
  {
    "categoria": "photos",
    "originalName": "familia.jpg",
    "filename": "uuid.jpg",
    "mimeType": "image/jpeg",
    "size": 2048,
    "url": "/uploads/photos/uuid.jpg"
  }
]
```

### POST /uploads/documents
Envia documentos em `multipart/form-data` com o campo `files`.

## Pedidos

### POST /pedidos
Cria pedido.

Observacoes
- `fotos[].arquivoNome` e `documentos[].arquivoNome` podem ser omitidos quando `arquivoUrl` vier de uma rota de upload valida.
- O backend reaproveita a URL recebida e completa o nome automaticamente.
- Fotos aceitam `brilho`, `contraste`, `saturacao` e `cropData`.

Request JSON
```json
{
  "clienteId": "cliente-1",
  "prazo": "uma_hora",
  "observacoes": "Separar envelope",
  "fotos": [
    {
      "arquivoUrl": "/uploads/photos/uuid.jpg",
      "tamanho": "10x15",
      "quantidade": 20,
      "brilho": 100,
      "contraste": 100,
      "saturacao": 100,
      "cropData": "quadrado"
    }
  ],
  "documentos": [
    {
      "arquivoUrl": "/uploads/documents/uuid.pdf",
      "quantidade": 2,
      "colorido": false,
      "tipoImpressao": "simples",
      "acabamento": "sem acabamento"
    }
  ]
}
```

### GET /pedidos
Lista pedidos.

### GET /pedidos/:id
Consulta pedido detalhado.

### PATCH /pedidos/:id/status
Atualiza status do pedido.

Request JSON
```json
{
  "status": "pronto"
}
```

### GET /fotos/pedido/:pedidoId
Lista itens de foto por pedido.

### GET /documentos/pedido/:pedidoId
Lista itens de documento por pedido.

## Notificacoes

### GET /notificacoes
Lista notificacoes.

### GET /notificacoes/stream
Abre stream SSE para sincronizacao em tempo real do painel.

Response event data
```json
{
  "reason": "criada",
  "updatedAt": "2026-03-21T12:10:00.000Z",
  "notificacoes": [
    {
      "id": "not-1",
      "pedidoId": "pedido-1",
      "tipo": "novo_pedido",
      "mensagem": "Novo pedido recebido",
      "lida": false,
      "criadaEm": "2026-03-21T12:10:00.000Z"
    }
  ]
}
```

### PATCH /notificacoes/:id/lida
Marca notificacao como lida.

## WhatsApp

### GET /whatsapp/pedido/:id/resumo
Gera resumo do pedido e link de WhatsApp.
