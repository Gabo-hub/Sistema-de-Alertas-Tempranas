# Backend - Sistema de Alerta Temprana

Django + Django REST Framework. Base de datos **PostgreSQL** (estándar, sin PostGIS).

**Sin GDAL/GEOS:** Las coordenadas se guardan como `latitude`/`longitude` (FloatField) y los polígonos de zona como JSON. No hace falta instalar PostGIS ni las librerías GDAL/GEOS que suelen fallar en Windows.

## Requisitos

- Python 3.10+
- PostgreSQL 12+ (no es necesaria la extensión PostGIS)

## Instalación

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
```

## Base de datos

1. Crear base de datos (sin extensión PostGIS):

```sql
CREATE DATABASE alerta_temprana;
```

2. Variables de entorno (opcional):

- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`
- `OPENWEATHERMAP_API_KEY` para el endpoint de clima

3. Migraciones:

```bash
python manage.py migrate
python manage.py createsuperuser
```

## Ejecución

```bash
python manage.py runserver
```

API disponible en `http://localhost:8000/api/`.

## Endpoints principales

- `GET/POST /api/alerts/` — Listar / crear alertas (POST requiere autenticación)
- `GET/PATCH/DELETE /api/alerts/<id>/` — Detalle / editar / eliminar
- `GET /api/zones/` — Listar zonas
- `GET /api/statistics/` — Estadísticas para dashboard
- `GET /api/alerts/export/` — Exportar Excel (autenticado)
- `GET /api/weather/?lat=...&lon=...` — Clima (OpenWeatherMap)
- `POST /api/notifications/simulate/` — Simular notificaciones (autenticado)

## Autenticación

Para crear/editar/eliminar alertas y exportar Excel, use autenticación por token o sesión:

- **Token**: Header `Authorization: Token <token>` (obtener token desde Django admin o endpoint de auth).
- **Sesión**: Iniciar sesión en `/admin/` y usar la misma sesión en el frontend (credentials: include).
