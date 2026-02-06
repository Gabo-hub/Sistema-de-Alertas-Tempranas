# Frontend - Sistema de Alerta Temprana

React (Vite) + React Router + Recharts + Leaflet.

## Requisitos

- Node.js 18+

## Instalación

```bash
cd frontend
npm install
```

## Ejecución

Con el backend en `http://localhost:8000`:

```bash
npm run dev
```

Abre `http://localhost:5173`. El proxy de Vite redirige `/api` al backend.

## Build

```bash
npm run build
```

Salida en `dist/`. Para producción, configurar la variable `VITE_API_URL` con la URL base del API.

## Estructura

- `src/components/` — Layout, cabecera, pie
- `src/pages/` — Alertas (listado, detalle), Dashboard, Mapa, Admin (CRUD)
- `src/services/api.js` — Cliente API (alertas, zonas, estadísticas, clima)
