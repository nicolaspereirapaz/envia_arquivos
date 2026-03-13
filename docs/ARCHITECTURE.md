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
- PostgreSQL

## Frontend
- Next.js
- TypeScript
- Tailwind CSS

## Modulos principais
- clientes
- pedidos
- precificacao
- fotos
- documentos
- notificacoes
- whatsapp

## Regras
- Controllers nao acessam banco diretamente
- Regras de negocio ficam em application/domain
- WhatsApp e integracao, nao nucleo do sistema
- Preco fica isolado no modulo de precificacao
