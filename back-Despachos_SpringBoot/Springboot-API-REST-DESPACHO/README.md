# API REST Despachos (Spring Boot)

Microservicio de despachos para el proyecto Innovatech. Incluye lo necesario para el **EP2** (Docker, compose, persistencia y CI/CD).

## Requisitos

- Java 17 (solo desarrollo local sin Docker)
- Docker y Docker Compose
- Cuenta AWS (RDS en la nube o MySQL en Docker para desarrollo)

## Variables de entorno

| Variable       | Descripción                          |
|----------------|--------------------------------------|
| `DB_ENDPOINT`  | Host MySQL (RDS o `mysql` en compose) |
| `DB_PORT`      | Puerto MySQL (típico `3306`)         |
| `DB_NAME`      | Nombre de la base de datos           |
| `DB_USERNAME`  | Usuario                              |
| `DB_PASSWORD`  | Contraseña                           |

Copia `env.example` a `.env` y ajusta valores. En AWS Academy suele usarse el endpoint de RDS que definiste en el EP1.

## Ejecutar con Docker Compose (API + MySQL local)

Levanta el backend y una base MySQL con **volumen nombrado** `mysql_data` para que los datos sobrevivan a `docker compose down` (sin `-v`).

```bash
cp env.example .env
docker compose up -d --build
```

La API queda en `http://localhost:8081` (puerto configurable con `API_PORT` en `.env`).

### Justificación del volumen (EP2)

- **Named volume (`mysql_data`)**: Docker administra la ubicación en disco; es la opción habitual para datos de base de datos porque es portable entre máquinas del equipo y no acopla rutas del host (a diferencia de un **bind mount**, útil en desarrollo para montar código fuente en caliente, pero menos adecuado para ficheros de datos gestionados por el motor MySQL).

## Imagen Docker (multi-stage)

El `Dockerfile` usa una etapa **Maven** para compilar y una **JRE Alpine** ligera para ejecutar el JAR. El proceso corre como usuario **no root** (`spring`).

```bash
docker build -t despacho-api:local .
docker run --rm -p 8081:8081 \
  -e DB_ENDPOINT=... -e DB_PORT=3306 -e DB_NAME=... \
  -e DB_USERNAME=... -e DB_PASSWORD=... \
  despacho-api:local
```

## CI/CD (GitHub Actions)

El workflow `.github/workflows/deploy.yml` se dispara con **push a la rama `deploy`**.

1. Autenticación en AWS (access key del laboratorio o método que permita tu docente).
2. Login en **Amazon ECR**, build de la imagen y push (`:latest` y `:SHA`).
3. Conexión **SSH** a la instancia EC2 del backend, `docker pull` y `docker run` con las variables de la base (típicamente **RDS** en producción).

### Secrets recomendados en GitHub

| Secret | Uso |
|--------|-----|
| `AWS_ACCESS_KEY_ID` | Credenciales AWS para el runner |
| `AWS_SECRET_ACCESS_KEY` | |
| `AWS_REGION` | Región (ej. `us-east-1`) |
| `ECR_REPOSITORY_BACKEND` | Nombre del repositorio en ECR |
| `EC2_BACKEND_HOST` | IP o DNS público de la EC2 backend |
| `EC2_USER` | Usuario SSH (ej. `ec2-user`, `ubuntu`) |
| `EC2_SSH_PRIVATE_KEY` | Clave privada PEM |
| `DB_ENDPOINT`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | Conexión a MySQL/RDS en el contenedor |

Si tu entrega es **solo esta carpeta** como repositorio Git, edita el workflow: borra el bloque `paths:` y cambia `context` del build a `.`.

## Enlace con el frontend

El frontend consume `GET/POST/PUT` bajo `/api/v1/despachos`. Asegúrate de que CORS y la URL base configurada en el front apunten a esta API (puerto `8081` por defecto).

## Swagger

Con la aplicación en marcha: `http://localhost:8081/swagger-ui.html`
