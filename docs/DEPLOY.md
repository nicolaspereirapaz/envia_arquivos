# Deploy

## Stack padrao
- PostgreSQL
- API NestJS
- Admin Next.js
- Web Next.js

## Subida local ou em servidor
Use a raiz do projeto:

```bash
npm run docker:up
```

Isso sobe:
- PostgreSQL em `5432`
- API em `3000`
- Admin em `3001`
- Web em `3002`

## Variaveis importantes
- `DATABASE_URL`
- `PORT`
- `NEXT_PUBLIC_API_BASE_URL`

## Healthchecks
- API: `GET /health`
- Admin: `GET /`
- Web: `GET /`

## Validacao antes do deploy
```bash
npm run ci:validate
```
