# 🌋 Sistema de Alertas Tempranas (SAT)

Un sistema integral diseñado para la detección, gestión y visualización de desastres naturales y emergencias civiles. Este proyecto permite a las autoridades administrar zonas de riesgo y alertar a la ciudadanía mediante mapas interactivos y detección de proximidad real.

## 🚀 Características Principales

*   **🛡️ Centro de Inteligencia**: Dashboard con estadísticas en tiempo real, tendencias de desastres y métricas críticas.
*   **🗺️ Mapa Vivo**: Visualización cartográfica de zonas de riesgo (GeoJSON) y alertas activas con radios de impacto dinámicos.
*   **🛰️ Geo-Detección**: El sistema detecta la ubicación del usuario y emite alertas sonoras/visuales si se encuentra en un área de peligro.
*   **📋 Gestión de Protocolos**: CRUD avanzado para administradores con validación geográfica integrada.
*   **📊 Exportación de Datos**: Generación de reportes detallados en Excel.

---

## 🛠️ Estructura del Proyecto

El repositorio está dividido en dos partes principales:

1.  **/backend**: API desarrollada en **Django REST Framework** con base de datos **PostgreSQL**.
2.  **/frontend**: Aplicación de una sola página (SPA) construida con **React, Vite y TailwindCSS**.

---

## 📦 Instalación y Configuración

### 1. Requisitos Previos
*   Python 3.10+
*   Node.js 18+
*   PostgreSQL

### 2. Configuración del Backend
```bash
cd backend
# Crear entorno virtual
python -m venv env
source env/bin/activate  # En Windows: env\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env  # Y edita tus credenciales de DB

# Correr migraciones y servidor
python manage.py migrate
python manage.py runserver
```

### 3. Configuración del Frontend
```bash
cd frontend
# Instalar dependencias
npm install

# Configurar variables
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

---

## 🎨 Tecnologías Utilizadas

*   **Frontend**: React.js, TailwindCSS (Design System), Recharts (Gráficos), React-Leaflet (Mapas).
*   **Backend**: Django, DRF, PostgreSQL, Pandas (Reportes).
*   **Estilo**: Glassmorphism & High-Contrast Emergency UI.

---

## 🛡️ Notas de Seguridad
El sistema utiliza **Token Authentication** para el panel administrativo. Asegúrese de cambiar la `DJANGO_SECRET_KEY` en producción y configurar correctamente los permisos de geolocalización en el navegador.

---
*Desarrollado para el proyecto de Fin de Ciclo - Ingeniería de Sistemas.*
