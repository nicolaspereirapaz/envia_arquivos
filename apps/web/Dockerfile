FROM node:24-bookworm-slim

ARG NEXT_PUBLIC_API_BASE_URL=http://api:3000

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY . .

RUN npm run build --workspace=web

WORKDIR /app/apps/web

EXPOSE 3002

CMD ["npm", "run", "start"]
