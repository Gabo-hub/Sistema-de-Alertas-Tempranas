# Migración inicial sin GDAL/GEOS: coordenadas y polígonos como campos normales

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Zone',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=200)),
                ('codigo', models.CharField(blank=True, max_length=50)),
                ('geometry_json', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                'verbose_name': 'Zona',
                'verbose_name_plural': 'Zonas',
                'ordering': ['nombre'],
            },
        ),
        migrations.CreateModel(
            name='Alert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo_desastre', models.CharField(choices=[('SISMO', 'Sismos'), ('INUNDACION', 'Inundaciones'), ('DESLAVE', 'Deslaves'), ('INCENDIO', 'Incendios'), ('OTROS', 'Otros')], max_length=20)),
                ('nivel_riesgo', models.CharField(choices=[('BAJO', 'Bajo'), ('MEDIO', 'Medio'), ('ALTO', 'Alto'), ('CRITICO', 'Crítico')], max_length=20)),
                ('latitude', models.FloatField(blank=True, help_text='Latitud del evento', null=True)),
                ('longitude', models.FloatField(blank=True, help_text='Longitud del evento', null=True)),
                ('fecha_hora', models.DateTimeField(default=django.utils.timezone.now)),
                ('descripcion', models.TextField(blank=True)),
                ('activa', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('zona', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='alertas', to='alerts.zone')),
            ],
            options={
                'verbose_name': 'Alerta',
                'verbose_name_plural': 'Alertas',
                'ordering': ['-fecha_hora'],
            },
        ),
        migrations.CreateModel(
            name='NotificationLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email_simulado', models.CharField(blank=True, max_length=255)),
                ('zona_nombre', models.CharField(blank=True, max_length=200)),
                ('enviado_simulado', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('alert', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notification_logs', to='alerts.alert')),
            ],
            options={
                'verbose_name': 'Log de notificación',
                'verbose_name_plural': 'Logs de notificaciones',
                'ordering': ['-created_at'],
            },
        ),
    ]
