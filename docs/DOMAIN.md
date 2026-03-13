# Dominio

## Cliente
- id
- nome
- telefone
- cpfCnpj
- observacoes
- criadoEm

## Pedido
- id
- clienteId
- status
- prazo
- subtotal
- total
- observacoes
- criadoEm

## ItemFoto
- id
- pedidoId
- arquivoUrl
- tamanho
- quantidade
- brilho
- contraste
- saturacao
- cropData

## ItemDocumento
- id
- pedidoId
- arquivoUrl
- tipoImpressao
- colorido
- quantidade
- acabamento

## TabelaPreco
- id
- categoria
- tamanho
- prazo
- faixaQuantidade
- valorUnitario
