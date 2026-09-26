# SAFIC · Frontend (Quasar)
#   dev   → servidor de desarrollo con recarga en caliente (docker compose)
#   build → compila la SPA (dist/spa)
#   prod  → nginx sirve la SPA y reenvía /api al backend

FROM node:24-alpine AS base
WORKDIR /app

# ---------- Desarrollo ----------
FROM base AS dev
# node_modules vive en un volumen propio; se crea con el dueño correcto (usuario node, UID 1000).
RUN mkdir -p /app/node_modules && chown -R node:node /app
USER node
EXPOSE 9000
# Instala dependencias la primera vez (volumen vacío) y levanta Quasar.
CMD ["sh", "-c", "[ -x node_modules/.bin/quasar ] || npm ci; npm run dev"]

# ---------- Compilación ----------
FROM base AS build
COPY package.json package-lock.json ./
COPY quasar.config.ts tsconfig.json index.html env.d.ts postcss.config.js eslint.config.js ./
COPY public ./public
COPY src ./src
RUN npm ci --no-audit --no-fund && npm run build

# ---------- Producción ----------
FROM nginx:1.29-alpine AS prod
# Backend al que se reenvía /api (en ECS se cambia por la URL interna del servicio).
ENV API_UPSTREAM=http://api:8080
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/spa /usr/share/nginx/html
EXPOSE 8080
