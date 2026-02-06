
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from alerts.models import Zone, Alert, NotificationLog
from django.utils import timezone
import random
from datetime import timedelta

class Command(BaseCommand):
    help = 'Semilla de datos iniciales para el Sistema de Alerta Temprana'

    def handle(self, *args, **kwargs):
        self.stdout.write('Iniciando carga de datos de prueba...')

        # 1. Crear Superusuario (Admin)
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', '12345678')
            self.stdout.write(self.style.SUCCESS('Admin user created (admin/12345678)'))
        else:
            self.stdout.write('Admin user already exists')

        # 2. Crear Zonas
        zones_data = [
            {
                'nombre': 'Zona Norte - Costera',
                'codigo': 'ZN-01',
                'geometry_json': {
                    "type": "Polygon",
                    "coordinates": [[
                        [-67.60, 10.20], [-67.55, 10.20], [-67.55, 10.25], [-67.60, 10.25], [-67.60, 10.20]
                    ]]
                }
            },
            {
                'nombre': 'Zona Sur - Montañosa',
                'codigo': 'ZS-02',
                'geometry_json': {
                    "type": "Polygon",
                    "coordinates": [[
                        [-67.65, 10.10], [-67.60, 10.10], [-67.60, 10.15], [-67.65, 10.15], [-67.65, 10.10]
                    ]]
                }
            },
            {
                'nombre': 'Centro Urbano',
                'codigo': 'ZC-03',
                'geometry_json': {
                    "type": "Polygon",
                    "coordinates": [[
                        [-67.62, 10.18], [-67.58, 10.18], [-67.58, 10.22], [-67.62, 10.22], [-67.62, 10.18]
                    ]]
                }
            }
        ]

        zones_objs = []
        for z in zones_data:
            obj, created = Zone.objects.get_or_create(
                nombre=z['nombre'],
                defaults={'codigo': z['codigo'], 'geometry_json': z['geometry_json']}
            )
            zones_objs.append(obj)
            if created:
                self.stdout.write(f"Zona creada: {obj.nombre}")

        # 3. Crear Alertas (Históricas y Activas)
        tipos = ['SISMO', 'INUNDACION', 'DESLAVE', 'INCENDIO', 'OTROS']
        niveles = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO']
        
        # Limpiar alertas viejas si se desea o solo agregar nuevas
        # Alert.objects.all().delete() 

        for i in range(10):
            tipo = random.choice(tipos)
            nivel = random.choice(niveles)
            zona = random.choice(zones_objs)
            
            # Generar coord aleatoria cerca de la zona (simulado)
            base_lat = 10.20
            base_lon = -67.60
            lat = base_lat + random.uniform(-0.05, 0.05)
            lon = base_lon + random.uniform(-0.05, 0.05)
            
            is_active = i < 3 # Las últimas 3 son activas
            days_ago = 0 if is_active else random.randint(1, 60)
            fecha = timezone.now() - timedelta(days=days_ago)

            alert = Alert.objects.create(
                tipo_desastre=tipo,
                nivel_riesgo=nivel,
                zona=zona,
                latitude=lat,
                longitude=lon,
                fecha_hora=fecha,
                descripcion=f"Alerta de prueba simulada de {tipo} en {zona.nombre}. Se reportan condiciones de nivel {nivel}.",
                activa=is_active
            )
            self.stdout.write(f"Alerta creada: {alert} (Activa: {is_active})")
            
            # Simular logs de notificación
            if is_active:
                NotificationLog.objects.create(
                    alert=alert,
                    email_simulado=f"ciudadano1@zona{zona.id}.com",
                    zona_nombre=zona.nombre,
                    enviado_simulado=True
                )

        self.stdout.write(self.style.SUCCESS('Carga de datos completada exitosamente.'))
