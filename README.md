# Proyecto semestral — Innovatech (DevOps EP2)

Monorepo con **frontend** (`front_despacho`), **API ventas** y **API despachos**. Para la evaluación parcial 2 se prioriza el par **front + API despachos**; el API de ventas sigue siendo necesaria para las pantallas que listan compras.

## Arranque rápido (stack completo en Docker)

Desde esta carpeta raíz:

```bash
docker compose up -d --build
```

Luego abre en el navegador: `http://localhost` (puerto configurable con `FRONT_PORT`).

Esto levanta:

- **MySQL 8** con volumen nombrado `mysql_data` (persistencia de datos entre reinicios del contenedor de base de datos).
- **ventas-api** (puerto interno 8080) y **despacho-api** (8081).
- **frontend** con nginx que enruta `/api/v1/ventas` y `/api/v1/despachos` hacia esos servicios.

Detener sin borrar datos:

```bash
docker compose down
```

Borrar también el volumen de MySQL (destructivo):

```bash
docker compose down -v
```

## Repositorios separados (entrega AVA)

Si entregas **dos** repositorios Git como pide el encargo:

1. Copia `front_despacho/` a un repo y ajusta el workflow (quita `paths`, `context: .`).
2. Copia `back-Despachos_SpringBoot/Springboot-API-REST-DESPACHO/` a otro repo y haz lo mismo.
3. Mantén el API de ventas accesible desde el front (otro contenedor, otra EC2 o misma red privada) según tu diseño en AWS.

## Documentación por componente

- `front_despacho/README.md`
- `back-Despachos_SpringBoot/Springboot-API-REST-DESPACHO/README.md`
