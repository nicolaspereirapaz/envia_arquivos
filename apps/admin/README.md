# Admin

Painel interno da Fare Foto para operacao do atendimento e da producao.

## Como rodar

Suba a API primeiro em `http://localhost:3000`.

Depois rode o admin:
```bash
npm run dev
```

O painel abre por padrao em [http://localhost:3001](http://localhost:3001).

## Variavel opcional

Use `NEXT_PUBLIC_API_BASE_URL` se quiser apontar o painel para outra instancia da API.

Exemplo:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 npm run dev
```

## Fluxo atual

- dashboard com fila de pedidos, filtros por busca e status
- detalhe completo de pedido com fotos, documentos e observacoes
- criacao operacional de clientes e pedidos com upload de arquivos
- atualizacao de status pelo painel
- notificacoes em tempo real via `GET /notificacoes/stream`
- marcacao de notificacoes como lidas
- resumo final em `/whatsapp/pedido/:id/resumo`

## Qualidade
```bash
npm run lint
npm run test
npm run build
```
