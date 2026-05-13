# Guía: montar el proyecto en AWS (Learner Lab y entorno similar)

Esta guía crea lo mínimo para **EC2 + ECR + MySQL + GitHub Actions**, alineado con los workflows del repo. Ajusta nombres y regiones a tu laboratorio.

## Antes de empezar

1. Inicia **AWS Academy → Learner Lab** y pulsa **Start Lab** hasta que la cuenta esté activa.
2. Abre **AWS Console** con el enlace verde (no uses credenciales caducadas).
3. Elige una **región** (ej. `us-east-1`) y **úsala siempre** para ECR, EC2 y RDS (si lo usas).
4. Si el laboratorio te da **Access Key, Secret Key y Session Token**, los tres van a GitHub (más abajo). Si solo hay key/secret permanentes, el token se deja vacío o no creas el secret `AWS_SESSION_TOKEN`.

---

## Parte A — Red y seguridad (VPC y Security Groups)

Muchos labs ya traen una **VPC por defecto** y subredes públicas. Si es tu caso, puedes usarlas.

### A.1 Security Group del frontend (`sg-frontend`)

Crear en **EC2 → Security Groups → Create**:

| Tipo | Puerto | Origen | Motivo |
|------|--------|--------|--------|
| SSH | 22 | Tu IP (`Mi IP`) | Administrar la instancia |
| HTTP | 80 | `0.0.0.0/0` o solo tu IP | Navegador al SPA (demo) |
| (opcional) HTTPS | 443 | Igual | Si añades TLS después |

### A.2 Security Group de backends (`sg-backend`)

| Tipo | Puerto | Origen | Motivo |
|------|--------|--------|--------|
| SSH | 22 | Tu IP | Acceso |
| Custom TCP | 8080 | SG del frontend (`sg-frontend`) | API ventas solo desde el front |
| Custom TCP | 8081 | SG del frontend | API despachos solo desde el front |

Así el encargo puede explicarse como: **solo el front expone HTTP a Internet**; los APIs no reciben tráfico público directo (el navegador habla con el front; el front reenvía o usa URLs que tú definas — ver Parte F).

### A.3 Security Group de MySQL (`sg-mysql`) — si MySQL va en EC2 aparte

| Tipo | Puerto | Origen |
|------|--------|--------|
| Custom TCP | 3306 | `sg-backend` (y otra EC2 que ejecute Spring, si hay más) |

Si MySQL corre **en la misma EC2** que los JAR/containers, puedes usar `localhost` / red bridge de Docker y **no abrir 3306 a Internet**.

### A.4 RDS (opcional)

Si creas **Amazon RDS MySQL**:

- Misma VPC, subred **privada** si el lab lo permite.
- Asocia **`sg-mysql`**: solo entrada **3306** desde **`sg-backend`**.
- Anota: **endpoint**, **puerto**, **usuario**, **contraseña**, **nombre de BD**.

Si el lab no deja RDS o es lento: usa **MySQL en Docker** en la EC2 de backends (ver Parte D).

---

## Parte B — Amazon ECR (imágenes Docker)

1. Consola **Amazon ECR → Repositories → Create repository**.
2. Crea dos repositorios (nombres de ejemplo):
   - `innovatech-frontend`
   - `innovatech-backend-despacho`
3. Si despliegas **ventas** en otra imagen/instancia, crea también `innovatech-backend-ventas`.
4. Entra en cada repo → **View push commands**: ahí verás el **registry** (ej. `123456789012.dkr.ecr.us-east-1.amazonaws.com`) y el comando `docker login`.

Anota:

- `AWS_REGION` (ej. `us-east-1`)
- Nombre exacto de cada repo (para secrets `ECR_REPOSITORY_FRONTEND` y `ECR_REPOSITORY_BACKEND`).

---

## Parte C — EC2: instancias

### C.1 EC2 frontend

1. **EC2 → Launch instance**.
2. AMI: **Amazon Linux 2023** (o Ubuntu 22.04).
3. Tipo: **t3.micro** o el que permita el lab.
4. **Key pair**: crea o elige una `.pem` (la usarás en GitHub `EC2_SSH_PRIVATE_KEY`).
5. Red: subred **pública**, asignar **IP pública automática**.
6. Security group: **`sg-frontend`**.
7. Al crear, anota la **IP pública o DNS** → será `EC2_FRONTEND_HOST`.

### C.2 EC2 backends (ventas + despacho)

Repite el proceso con **`sg-backend`**. Si el lab no da subred privada con salida a Internet para GitHub/ECR, una **EC2 pública** con SG restrictivo en 8080/8081 solo desde `sg-frontend` sigue siendo una defensa razonable para el curso.

Anota **`EC2_BACKEND_HOST`** (IP o DNS).

### C.3 Software en ambas EC2 (por SSH)

Conéctate (ejemplo Amazon Linux):

```bash
ssh -i tu-clave.pem ec2-user@IP_DE_LA_INSTANCIA
```

En **cada** instancia donde vayas a usar `docker` y `aws ecr`:

```bash
sudo dnf update -y   # Amazon Linux 2023
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# Cierra sesión y vuelve a entrir para que aplique el grupo "docker"
```

Instalar **AWS CLI v2** (sigue la guía oficial de AWS para Linux) y comprobar:

```bash
aws --version
docker --version
```

En la **EC2 backend**, si usarás **pull desde ECR** con el usuario del sistema:

- Lo ideal es un **rol IAM** de instancia con políticas mínimas de **ECR** (`GetAuthorizationToken` + lectura del repo). Si el lab no permite roles, configura `aws configure` con las mismas credenciales temporales del lab (sabrán que es laboratorio).

---

## Parte D — Base de datos MySQL

### Opción 1 — MySQL en Docker (muy usada en Learner Lab)

En la **EC2 backend**, con Docker ya instalado:

```bash
mkdir -p ~/mysql-data
docker run -d --name mysql \
  -e MYSQL_ROOT_PASSWORD=TU_ROOT_SEGURO \
  -e MYSQL_DATABASE=innovatech \
  -e MYSQL_USER=app \
  -e MYSQL_PASSWORD=TU_APP_SEGURO \
  -p 127.0.0.1:3306:3306 \
  -v ~/mysql-data:/var/lib/mysql \
  mysql:8.0
```

- `DB_ENDPOINT` para los contenedores Spring en **esa misma máquina**: `host.docker.internal` no existe en Linux por defecto; usa la **IP de la interfaz docker0** o más simple: **IP privada de la EC2** en la URL JDBC, o monta los tres servicios con **un solo `docker-compose`** como en la raíz del repo y usa el hostname `mysql` dentro de la red compose.

En AWS, lo habitual es: **MySQL en la misma EC2**, Spring en contenedor con `DB_ENDPOINT=<IP_PRIVADA_EC2>` y puerto `3306` publicado solo en `127.0.0.1` como arriba (solo local en el host).

### Opción 2 — RDS

Usa el endpoint de RDS en `DB_ENDPOINT`, puerto `3306`, y los secretos que definiste al crear la instancia.

---

## Parte E — GitHub: rama `deploy` y Secrets

1. En el repositorio, crea la rama **`deploy`** y sube el código.
2. **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Descripción |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | Del Learner Lab (o IAM usuario) |
| `AWS_SECRET_ACCESS_KEY` | |
| `AWS_SESSION_TOKEN` | **Solo si el lab entrega session token** (credenciales temporales). Si no existe, crea el secret vacío o elimina la línea del workflow (ya está soportado si el valor está vacío según la acción; si falla, borra el secret o deja un espacio y revisa la doc del action). |
| `AWS_REGION` | ej. `us-east-1` |
| `ECR_REPOSITORY_FRONTEND` | Nombre del repo ECR del front |
| `ECR_REPOSITORY_BACKEND` | Nombre del repo ECR del API despacho |
| `EC2_FRONTEND_HOST` | IP o DNS público del front |
| `EC2_BACKEND_HOST` | IP o DNS del back |
| `EC2_USER` | `ec2-user` o `ubuntu` |
| `EC2_SSH_PRIVATE_KEY` | Contenido completo del `.pem` (incluye `BEGIN` / `END`) |
| `DB_ENDPOINT` | Host MySQL visto **desde dentro del contenedor** en la EC2 back |
| `DB_PORT` | `3306` |
| `DB_NAME` | ej. `innovatech` |
| `DB_USERNAME` | |
| `DB_PASSWORD` | |
| `VITE_API_DESPACHOS_URL` | URL que el **navegador** usará para llamar al API despachos (ej. `http://IP_PUBLICA_BACK:8081` solo si abres el puerto; mejor: proxy en el front — Parte F) |
| `VITE_API_VENTAS_URL` | Igual para ventas (`http://...:8080`) |

Haz **push a `deploy`** solo cuando los secrets estén listos. Los workflows activos están **solo en la raíz** del repositorio (GitHub no ejecuta YAML en subcarpetas):

- `.github/workflows/deploy-frontend.yml`
- `.github/workflows/deploy-backend-despacho.yml`

Repo de ejemplo: [IgnacioLondono/Innovatech](https://github.com/IgnacioLondono/Innovatech).

Si en el futuro separas **solo una carpeta** en otro repo, mueve el YAML correspondiente a `.github/workflows/` de ese repo, quita `paths:` y pon `context: .` en el paso de build.

---

## Parte F — Cómo debe hablar el frontend con los backends en AWS

Tienes dos modelos:

1. **Standalone (el workflow actual del front)**  
   Build con `VITE_API_DESPACHOS_URL` y `VITE_API_VENTAS_URL` = URLs **alcanzables desde el navegador del usuario**. Eso obliga a exponer 8080/8081 a Internet o usar un balanceador; contradice un poco el modelo “back privado”.

2. **Recomendado para la defensa**  
   Nginx en el **mismo** contenedor del front hace **proxy** a los backends por red privada (como `nginx.stack.conf` + `docker compose` de la raíz). En EC2 sería: un solo host con compose, o ALB + target groups (más avanzado).

Para **dos EC2** (front y back) sin ALB: muchos equipos publican el front y ponen en el build del front las URLs **internas** no alcanzables desde el navegador del profe → falla. Soluciones típicas en el curso:

- **Una EC2** con Docker Compose levantando front + ambos APIs + MySQL (todo en una máquina pública 80), o  
- Front con nginx que proxy a IPs **privadas** solo si el navegador no las usa (no aplica); el navegador necesita **una sola URL pública** (el front) y el proxy resuelve en servidor.

La raíz del repo tiene `docker-compose.yml` de **stack** para desarrollo; en AWS puedes replicar esa idea en **una EC2** con IP pública en el puerto 80.

---

## Parte G — Comprobar que todo vive

1. **ECR**: en la consola, tras el workflow, debe aparecer imagen con tag `latest`.
2. **EC2**: `docker ps` debe mostrar contenedores en marcha.
3. **Navegador**: `http://IP_FRONT` carga la app.
4. **API**: desde la EC2 back, `curl -s http://127.0.0.1:8081/api/v1/despachos` (o el path que tengas) debe responder JSON.

---

## Parte H — Learner Lab: recordatorios

- Cada vez que **inicies sesión** nueva en el lab, **renueva** en GitHub `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` y `AWS_SESSION_TOKEN`.
- Si el lab se **pausa**, las instancias pueden pararse: vuelve a iniciar y revisa IPs (pueden cambiar si no usas Elastic IP y la asignación es nueva).
- Haz **capturas** de consola (EC2, ECR, SG, contenedores) para la presentación.

---

## Resumen del orden sugerido

1. VPC / subred (o default)  
2. Security Groups (`sg-frontend`, `sg-backend`, `sg-mysql` si aplica)  
3. ECR (2 o 3 repos)  
4. EC2 front + EC2 back (o una sola EC2 con compose)  
5. MySQL (Docker en EC2 o RDS)  
6. Instalar Docker + AWS CLI en las EC2  
7. GitHub Secrets + rama `deploy` + push  
8. Pruebas en navegador y `curl`

Si me indicas si usarás **una o dos EC2** y si tendrás **RDS o MySQL en Docker**, puedo dejarte una tabla concreta de valores de `DB_ENDPOINT` y de URLs para `VITE_*` sin contradicciones.
