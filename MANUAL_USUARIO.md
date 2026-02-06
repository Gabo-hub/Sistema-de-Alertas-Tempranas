# Manual de Usuario - Sistema de Alerta Temprana

Sistema de Alerta Temprana para Notificación y Prevención ante Desastres Naturales. UNEFA Núcleo Aragua - Lenguaje de Programación III.

---

## 1. Acceso a la aplicación

- **URL pública**: abra el frontend (por ejemplo `http://localhost:5173`).
- En la cabecera dispone de: **Alertas**, **Mapa**, **Dashboard** y **Admin**.

---

## 2. Consulta de alertas (uso público)

### 2.1 Listado de alertas

- En **Alertas** se muestran las alertas activas.
- **Filtros**:
  - **Solo activas**: Sí / No.
  - **Desde** / **Hasta**: rango de fechas.
  - **Zona ID**: filtrar por ID de zona.
- Cada fila muestra tipo de desastre, nivel de riesgo, zona (si existe) y fecha/hora. Pulse sobre una fila para ver el detalle.

### 2.2 Detalle de una alerta

- Se muestra tipo, nivel de riesgo, fecha y hora, zona, descripción y estado (activa/inactiva).
- Si la alerta tiene coordenadas, se muestran **datos climáticos** de la zona (temperatura, descripción del tiempo, viento) cuando esté configurada la API de clima en el backend.

---

## 3. Mapa

- En **Mapa** se visualizan:
  - **Zonas** (polígonos) definidas en el sistema.
  - **Alertas** con coordenadas (puntos).
- Puede hacer zoom y desplazamiento. Al hacer clic en un punto o polígono se muestra un popup con la información correspondiente.

---

## 4. Dashboard

- En **Dashboard** se muestran gráficos:
  - **Frecuencia por tipo de desastre** (gráfico de torta).
  - **Frecuencia por nivel de riesgo** (barras).
  - **Zonas más afectadas** (barras horizontales).
  - **Tendencia** de alertas en los últimos 30 días (líneas).
- Los datos provienen del backend (endpoint de estadísticas).

---

## 5. Panel de administración

- En **Admin** se gestionan las alertas (crear, editar, eliminar).  
  **Requisito**: debe estar autenticado en el backend (sesión o token). Si no ha iniciado sesión, las acciones de crear, editar o eliminar fallarán.

### 5.1 Listado de alertas (admin)

- Lista todas las alertas con opciones **Editar** y **Eliminar**.
- **Nueva alerta**: lleva al formulario de creación.
- **Exportar Excel**: descarga un archivo .xlsx con el listado de alertas (respetando filtros si se implementan en la URL). Requiere autenticación.

### 5.2 Crear / editar alerta

- **Tipo de desastre**: Sismos, Inundaciones, Deslaves, Incendios, Otros.
- **Nivel de riesgo**: Bajo, Medio, Alto, Crítico.
- **Zona**: selección de una zona existente (opcional).
- **Latitud y longitud**: coordenadas del evento (opcional). Se usan para el mapa y para datos de clima.
- **Fecha y hora**: cuándo ocurre o se registra la alerta.
- **Descripción**: texto libre.
- **Alerta activa**: marcar si la alerta sigue vigente.
- Al guardar, se crea o actualiza la alerta y se redirige al listado de administración.

---

## 6. Notificaciones (simuladas)

- El backend ofrece un endpoint para **simular** el envío de notificaciones a usuarios en zona de riesgo. No se envía correo real; se registra un log de notificación (para uso por el administrador o desarrollador vía API o panel Django admin).

---

## 7. Exportación a Excel

- Desde el panel Admin, el botón **Exportar Excel** descarga un archivo con columnas: ID, Tipo, Nivel riesgo, Zona, Fecha y hora, Descripción, Activa.  
- Debe estar autenticado en el backend para que la descarga funcione.

---

## 8. Resolución de problemas

- **No se cargan alertas**: compruebe que el backend esté en ejecución y que la URL del API sea la correcta (proxy en desarrollo: `http://localhost:5173` con proxy a `http://localhost:8000`).
- **No aparecen datos en el mapa**: asegúrese de que las alertas tengan coordenadas (punto) y las zonas tengan geometría (polígono).
- **No se muestra el clima**: configure `OPENWEATHERMAP_API_KEY` en el backend y que la alerta tenga coordenadas.
- **No puede crear/editar/eliminar alertas**: inicie sesión en el backend (por ejemplo en `/admin/`) o use autenticación por token.

---

*Documento de referencia para usuarios finales y administradores del Sistema de Alerta Temprana.*
