# Informe técnico — EP2 DevOps (Innovatech)

**Asignatura:** ISY1101 — Introducción a Herramientas DevOps  
**Evaluación:** Parcial 2 (contenedorización + AWS + CI/CD)  
**Integrantes:** [Nombre 1], [Nombre 2]  
**Fecha:** [DD/MM/AAAA]  
**Repositorio:** https://github.com/IgnacioLondono/Innovatech  

---

> **Cómo usar esta plantilla:** Cópiala a Word o Google Docs. Borra las líneas entre corchetes y las notas *en cursiva*. Sustituye por tus capturas y datos reales. Entrega en PDF si el docente lo pide.

---

## 1. Resumen ejecutivo

[4–8 líneas: qué hace el sistema, qué se dockerizó, dónde se despliega en AWS y qué automatiza el pipeline.]

---

## 2. Introducción

### 2.1 Contexto

[Caso Innovatech, etapa 2: despliegue de la aplicación sobre infraestructura del EP1.]

### 2.2 Objetivos del informe

- Documentar la arquitectura contenerizada y el despliegue en AWS.  
- Justificar decisiones técnicas (Dockerfile, compose, volúmenes, CI/CD, seguridad).  
- Demostrar cumplimiento de los requisitos del encargo.

### 2.3 Alcance

[Qué incluye: front, API despachos, API ventas, MySQL/RDS, EC2, ECR, GitHub Actions. Qué queda fuera si aplica.]

---

## 3. Arquitectura de la solución

### 3.1 Diagrama lógico

[Inserta imagen: navegador → EC2 front → (opcional) APIs en misma EC2 o en otra / subred privada → MySQL o RDS.]

*Herramientas sugeridas:* draw.io, Excalidraw, PowerPoint.

### 3.2 Componentes

| Componente | Tecnología | Rol |
|------------|------------|-----|
| Frontend | React + Vite + nginx (Docker) | UI y punto de entrada HTTP |
| API Despachos | Spring Boot (Docker), puerto 8081 | CRUD despachos |
| API Ventas | Spring Boot (Docker), puerto 8080 | CRUD ventas |
| Base de datos | MySQL (Docker en EC2 o RDS) | Persistencia relacional |
| Registro de imágenes | Amazon ECR | Almacén de imágenes Docker |
| Automatización | GitHub Actions | Build, push, deploy al push en `deploy` |

### 3.3 Flujo de datos (Front ↔ Back)

[Describe cómo el front llama a `/api/v1/ventas` y `/api/v1/despachos`: URLs relativas + proxy nginx en stack, o URLs absolutas en standalone.]

---

## 4. Contenedorización (IE1 / IE6)

### 4.1 Frontend

- **Multi-stage:** [etapa build Node / etapa runtime nginx unprivileged].  
- **Usuario no root:** [imagen base nginx unprivileged].  
- **Optimización:** [capas, `npm ci`, solo `dist` en imagen final].

### 4.2 Backend (despacho y/o ventas)

- **Multi-stage:** Maven → JRE Alpine.  
- **Usuario no root:** usuario `spring`.  
- **Puertos:** despacho 8081, ventas 8080.

### 4.3 Decisiones y trade-offs

[Seguridad vs simplicidad en el lab, tamaño de imagen, tiempo de build.]

---

## 5. Docker Compose (IE2)

### 5.1 Descripción del stack

[Raíz del repo: `docker-compose.yml` con mysql + ventas-api + despacho-api + frontend, o compose por servicio si entregaste repos separados.]

### 5.2 Servicios, redes y dependencias

- Servicios: [listar].  
- `depends_on` / healthcheck de MySQL: [explicar].  
- Puertos publicados en host vs solo red interna: [tabla].

### 5.3 Variables de entorno

[Tabla: `DB_*`, `MYSQL_*`, `VITE_*`, etc., sin pegar contraseñas reales; usar `***` o “ver `.env` local”.]

---

## 6. Persistencia de datos (IE3)

### 6.1 Volúmenes utilizados

- **Named volume** `mysql_data` en [archivo/ruta].  
- **Justificación:** [por qué named volume y no bind mount para datos de BD — portable, gestionado por Docker].  
- **Bind mount** (si lo usaste en dev): [para qué y por qué].

### 6.2 Comportamiento ante reinicios

[Qué pasa con `docker compose down` vs `docker compose down -v`. Cómo se protegen los datos críticos.]

---

## 7. Pipeline CI/CD — GitHub Actions (IE3 / IE7)

### 7.1 Disparador

- Rama: **`deploy`**.  
- Archivos: `.github/workflows/deploy-frontend.yml` y `deploy-backend-despacho.yml`.

### 7.2 Etapas del pipeline

1. Checkout del código.  
2. Credenciales AWS (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, [`AWS_SESSION_TOKEN` si Learner Lab]).  
3. Login ECR, build Docker, push (`:latest` y `:SHA`).  
4. SSH a EC2: `docker login`, `docker pull`, `docker run` con variables de BD.

### 7.3 Gestión de secretos

[Qué va en GitHub Secrets y qué nunca se versiona. Renovación de credenciales temporales del lab.]

### 7.4 Elección ECR vs Docker Hub

[Por qué ECR si todo está en AWS / mismo laboratorio.]

---

## 8. Despliegue en AWS (IE4 / IE5 / IE9)

### 8.1 Cuenta y laboratorio

[AWS Academy Learner Lab: región usada, limitaciones conocidas.]

### 8.2 Recursos creados

| Recurso | Nombre / ID | Notas |
|---------|---------------|--------|
| EC2 Front | [i-… / IP] | SG, puerto 80 |
| EC2 Back(s) | … | Puertos 8080/8081 |
| ECR | nombres de repos | |
| RDS o MySQL Docker | … | Endpoint o contenedor |

### 8.3 Security Groups (resumen)

[Tabla reglas: quién puede entrar a 22, 80, 8080, 8081, 3306.]

### 8.4 Pruebas realizadas

- Front accesible por navegador: [URL o IP].  
- APIs respondiendo: [curl o captura Swagger].  
- Persistencia: [reinicio de contenedor y verificación de datos].  
- Pipeline: [captura pestaña Actions en verde].

**Capturas sugeridas:** consola EC2, ECR con imagen, Security Group, Actions, navegador con la app, `docker ps` en SSH.

---

## 9. Principios DevOps (IE8)

[Un párrafo por práctica: contenedorización, IaC ligera con compose, CI/CD, control de versiones (Git), observabilidad básica (logs Docker). Relación con escalabilidad y mantenibilidad.]

---

## 10. Problemas encontrados y soluciones

| Problema | Causa probable | Solución aplicada |
|----------|----------------|-------------------|
| […] | […] | […] |

---

## 11. Conclusiones

[3–5 líneas: qué se logró, qué mejorarías (HTTPS, ALB, OIDC en GitHub, RDS, monitoreo).]

---

## 12. Referencias y anexos

- Documentación Docker, Spring Boot, GitHub Actions, AWS ECR/EC2.  
- Repositorio: [enlace].  
- Anexo A: fragmentos relevantes de `docker-compose.yml` (sin secretos).  
- Anexo B: diagrama de pipeline.

---

## Checklist antes de entregar

- [ ] Sin contraseñas ni keys en texto plano.  
- [ ] Capturas legibles (nombres de archivo claros).  
- [ ] Coherencia entre lo escrito y lo que muestra el repo / la demo.  
- [ ] Mención explícita de rama `deploy` y de volúmenes (IE3).  
- [ ] Formato y ortografía revisados.
