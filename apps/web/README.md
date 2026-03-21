# App Web
Area do cliente da Fare Foto com:

- upload de fotos e documentos
- editor basico de imagem
- simulacao de preco
- criacao de pedido
- acompanhamento de status

## Como rodar
Suba a API em `http://localhost:3000` e depois execute:

```bash
npm run dev
```

A aplicacao abre por padrao em [http://localhost:3002](http://localhost:3002).

## Recursos da tela
- ajuste de brilho, contraste e saturacao nas fotos
- presets simples de enquadramento
- simulacao imediata de preco por prazo
- envio do pedido com resumo final e link de WhatsApp
- acompanhamento pelo codigo do pedido

## Variavel opcional
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 npm run dev
```
