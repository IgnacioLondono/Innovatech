# syntax=docker/dockerfile:1
# Multi-stage: build de Vite + imagen mínima nginx sin privilegios de root en runtime.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# URLs vacías en modo stack: el SPA usa rutas relativas y nginx hace de API gateway.
ARG VITE_API_DESPACHOS_URL=
ARG VITE_API_VENTAS_URL=
ENV VITE_API_DESPACHOS_URL=${VITE_API_DESPACHOS_URL}
ENV VITE_API_VENTAS_URL=${VITE_API_VENTAS_URL}

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
ARG NGINX_CONF=standalone
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.${NGINX_CONF}.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
