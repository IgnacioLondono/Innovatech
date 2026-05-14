# syntax=docker/dockerfile:1
# Multi-stage: Node compila el SPA; nginx sin privilegios sirve estáticos (runtime no root).

# --- Etapa 1: dependencias (capa cacheable cuando solo cambia el código fuente) ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Etapa 2: build de Vite ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY . .

ARG VITE_API_DESPACHOS_URL=
ARG VITE_API_VENTAS_URL=
ENV VITE_API_DESPACHOS_URL=${VITE_API_DESPACHOS_URL}
ENV VITE_API_VENTAS_URL=${VITE_API_VENTAS_URL}

RUN npm run build

# --- Etapa 3: runtime mínimo, usuario no privilegiado (nginx, no root) ---
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
ARG NGINX_CONF=standalone

COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx/nginx.${NGINX_CONF}.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
USER nginx
