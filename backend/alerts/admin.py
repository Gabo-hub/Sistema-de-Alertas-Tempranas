from django.contrib import admin
from .models import Zone, Alert, NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('alert', 'email_simulado', 'zona_nombre', 'enviado_simulado', 'created_at')
    list_filter = ('enviado_simulado',)


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo', 'created_at')

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('tipo_desastre', 'nivel_riesgo', 'zona', 'fecha_hora', 'activa')
    list_filter = ('tipo_desastre', 'nivel_riesgo', 'activa')
