"""
Modelos para el Sistema de Alerta Temprana.
Coordenadas y polígonos guardados como campos normales (sin GDAL/GEOS).
"""
from django.db import models
from django.utils import timezone


class Zone(models.Model):
    """Zona geográfica (polígono guardado como GeoJSON en JSON)."""
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=50, blank=True)
    geometry_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Zona'
        verbose_name_plural = 'Zonas'

    def __str__(self):
        return self.nombre


# Choices para nivel de riesgo y tipo de desastre
RISK_LEVELS = [
    ('BAJO', 'Bajo'),
    ('MEDIO', 'Medio'),
    ('ALTO', 'Alto'),
    ('CRITICO', 'Crítico'),
]

DISASTER_TYPES = [
    ('SISMO', 'Sismos'),
    ('INUNDACION', 'Inundaciones'),
    ('DESLAVE', 'Deslaves'),
    ('INCENDIO', 'Incendios'),
    ('OTROS', 'Otros'),
]


class Alert(models.Model):
    """Alerta temprana: tipo, nivel, zona y coordenadas (lat/lon)."""
    tipo_desastre = models.CharField(max_length=20, choices=DISASTER_TYPES)
    nivel_riesgo = models.CharField(max_length=20, choices=RISK_LEVELS)
    zona = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='alertas')
    latitude = models.FloatField(null=True, blank=True, help_text='Latitud del evento')
    longitude = models.FloatField(null=True, blank=True, help_text='Longitud del evento')
    radio_impacto = models.FloatField(default=0.0, null=True, blank=True, help_text='Radio de impacto en metros')
    fecha_hora = models.DateTimeField(default=timezone.now)
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_hora']
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'

    def __str__(self):
        return f"{self.get_tipo_desastre_display()} - {self.get_nivel_riesgo_display()} ({self.fecha_hora.date()})"


class NotificationLog(models.Model):
    """Registro de notificaciones simuladas (usuarios en zona de riesgo)."""
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE, related_name='notification_logs')
    email_simulado = models.CharField(max_length=255, blank=True)
    zona_nombre = models.CharField(max_length=200, blank=True)
    enviado_simulado = models.BooleanField(default=True)
    provider = models.CharField(max_length=50, blank=True, help_text='Proveedor usado para el envío (mailersend_api, smtp, simulate)')
    provider_id = models.CharField(max_length=255, blank=True, help_text='ID de mensaje devuelto por el proveedor')
    provider_response = models.TextField(blank=True, help_text='Respuesta cruda del proveedor (JSON o texto)')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Log de notificación'
        verbose_name_plural = 'Logs de notificaciones'

    def __str__(self):
        return f"Notif. alerta {self.alert_id} - {self.created_at}"


class Subscriber(models.Model):
    """Suscriptor global para recibir notificaciones por correo.

    Suscripción global (no ligada a zona) tal como pidió el cliente.
    """
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Suscriptor'
        verbose_name_plural = 'Suscriptores'

    def __str__(self):
        return f"{self.email} ({'activo' if self.active else 'inactivo'})"
