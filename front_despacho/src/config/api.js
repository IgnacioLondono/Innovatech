const trim = (value) => (value ?? "").replace(/\/$/, "");

/**
 * Base del API de despachos (Springboot-API-REST-DESPACHO, puerto típico 8081).
 * Vacío = rutas relativas (/api/v1/...): Vite proxy en dev y nginx en stack Docker.
 */
export const DESPACHOS_API_BASE = trim(import.meta.env.VITE_API_DESPACHOS_URL);

/**
 * Base del API de ventas (Springboot-API-REST ventas, puerto típico 8080).
 */
export const VENTAS_API_BASE = trim(import.meta.env.VITE_API_VENTAS_URL);

function join(base, path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}

export const urlDespachos = (path) => join(DESPACHOS_API_BASE, path);
export const urlVentas = (path) => join(VENTAS_API_BASE, path);
