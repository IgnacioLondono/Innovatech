# Frontend Despachos (React + Vite)

Aplicación web del caso Innovatech: gestión de compras y despachos. Preparada para el **EP2** (Docker, nginx, variables de API y CI/CD).

## Desarrollo local

```bash
npm ci
npm run dev
```

Por defecto las peticiones van por **rutas relativas** `/api/v1/...` y `vite.config.js` redirige:

- `/api/v1/despachos` → `http://localhost:8081`
- `/api/v1/ventas` → `http://localhost:8080`

Levanta ambos backends (y MySQL/RDS) antes de probar los formularios.

### Variables opcionales (build y producción)

Si defines URLs absolutas, el front dejará de usar el proxy de Vite y llamará directamente a esos hosts (útil en EC2 con IPs/DNS distintos).

Crea `.env` o `.env.production` según Vite:

| Variable | Uso |
|----------|-----|
| `VITE_API_DESPACHOS_URL` | Base del API de despachos (ej. `http://10.0.1.50:8081`) |
| `VITE_API_VENTAS_URL` | Base del API de ventas (ej. `http://10.0.1.51:8080`) |

Si las dejas **vacías**, se usan rutas relativas (recomendado con el `docker-compose.yml` de la raíz del proyecto, donde nginx del front hace de **API gateway** hacia los contenedores `despacho-api` y `ventas-api`).

Ver `src/config/api.js`.

## Docker (multi-stage)

1. **Build**: Node 20 instala dependencias y ejecuta `vite build`.
2. **Runtime**: imagen **nginx unprivileged** (sin usuario root), sirve `dist/` en el puerto **8080**.

### Modo standalone (solo este compose)

Sirve el SPA y asume que el navegador alcanza los APIs en las URLs que inyectes en el build:

```bash
docker compose build --build-arg VITE_API_DESPACHOS_URL=http://TU_IP_BACKEND:8081 --build-arg VITE_API_VENTAS_URL=http://TU_IP_VENTAS:8080
```

En `docker-compose.yml` del front se usan por defecto `http://127.0.0.1:8081` y `http://127.0.0.1:8080` (válido si el usuario abre el navegador en la misma máquina donde corren los puertos).

### Modo stack (recomendado con el compose de la raíz)

En el repositorio padre, `docker compose up` construye el front con `NGINX_CONF=stack` y nginx enruta `/api/v1/despachos` y `/api/v1/ventas` a los servicios internos: un solo origen desde el navegador y alineado con la idea de que **solo el front** sea el punto de entrada público en AWS (los backends en subred privada).

## CI/CD (rama `deploy`)

Archivo: `.github/workflows/deploy.yml`

1. Build de la imagen Docker y push a **Amazon ECR**.
2. SSH a la **EC2 del frontend**, `docker pull` y contenedor en el puerto **80** → **8080** interno.

### Secrets sugeridos en GitHub

| Secret | Uso |
|--------|-----|
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | Publicar en ECR |
| `ECR_REPOSITORY_FRONTEND` | Repositorio ECR del front |
| `EC2_FRONTEND_HOST`, `EC2_USER`, `EC2_SSH_PRIVATE_KEY` | Despliegue por SSH |
| `VITE_API_DESPACHOS_URL`, `VITE_API_VENTAS_URL` | URLs absolutas visibles desde el navegador del usuario final (modo standalone en la nube). Si usas gateway en el mismo host, puedes dejarlas vacías y montar otra estrategia (documentar en defensa). |

Si el repositorio Git es **solo esta carpeta**, quita el filtro `paths:` del workflow y cambia `context` a `.`.

## Estructura relevante

- `Dockerfile` — multi-stage + nginx.
- `nginx/nginx.standalone.conf` — solo SPA.
- `nginx/nginx.stack.conf` — SPA + `proxy_pass` a microservicios.
- `docker-compose.yml` — servicio `web`.
- `src/config/api.js` — bases de URL para axios.

## Lint

```bash
npm run lint
```
