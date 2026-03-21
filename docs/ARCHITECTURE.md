# Arquitetura Oficial

## Estrategia
Monorepo + monolito modular

## Apps
- apps/web
- apps/admin
- apps/api

## Packages
- packages/types
- packages/core
- packages/ui
- packages/config

## Backend
- NestJS
- Persistencia principal em PostgreSQL quando `DATABASE_URL` estiver definida
- Fallback local em arquivo JSON usando `tmp/fare-foto-store.json`
- Upload de arquivos em filesystem local na pasta `uploads/`
- Stream SSE para notificacoes em tempo real do admin

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- `apps/admin` para operacao interna
- `apps/web` para jornada do cliente

## Modulos principais
- clientes
- pedidos
- precificacao
- uploads
- fotos
- documentos
- notificacoes
- whatsapp

## Regras
- Controllers nao acessam banco diretamente
- Regras de negocio ficam em application/domain
- WhatsApp e integracao, nao nucleo do sistema
- Preco fica isolado no modulo de precificacao
- Upload real acontece antes da criacao do pedido e retorna `arquivoUrl` para os modulos de fotos e documentos
- O painel admin consome a API REST diretamente e depende de CORS habilitado no backend
- A area do cliente consome a mesma API e usa o resumo de WhatsApp como fechamento do fluxo
- O store central mantem o estado em memoria e sincroniza com PostgreSQL ou arquivo conforme a configuracao
