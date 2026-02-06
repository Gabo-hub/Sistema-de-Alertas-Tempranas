"""
URL principal del proyecto - Sistema de Alerta Temprana.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('alerts.urls')),
]
