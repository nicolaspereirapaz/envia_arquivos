FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY . .

RUN npm run build --workspace=api

ENV NODE_ENV=production
ENV PORT=3000
ENV FARE_FOTO_STORE_PERSIST=true
ENV FARE_FOTO_STORE_PATH=/app/tmp/fare-foto-store.json

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
