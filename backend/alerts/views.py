"""
Vistas API para alertas y zonas.
CRUD protegido para admin; listado público con filtros.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
import io
import requests
import json

from .models import Alert, Zone, NotificationLog
from .serializers import AlertSerializer, ZoneSerializer
from .filters import AlertFilter


def _lat_lon_from_request(data):
    """Extrae (lat, lon) desde payload point GeoJSON o null."""
    point_data = data.get('point')
    if not point_data or not isinstance(point_data, dict) or point_data.get('type') != 'Point':
        return None, None
    coords = point_data.get('coordinates')
    if coords and len(coords) >= 2:
        lon, lat = float(coords[0]), float(coords[1])
        return lat, lon
    return None, None


def _is_point_in_polygon(lat, lon, polygon_geojson):
    """
    Algoritmo de ray-casting estándar (Horizontal Ray Casting).
    Determina si el punto (lat, lon) está dentro del polígono.
    """
    if not polygon_geojson or polygon_geojson.get('type') != 'Polygon':
        return True
    
    try:
        coords = polygon_geojson['coordinates'][0]
        n = len(coords)
        inside = False

        # El algoritmo usa X como Longitud e Y como Latitud
        x, y = lon, lat
        
        for i in range(n):
            p1x, p1y = coords[i]
            p2x, p2y = coords[(i + 1) % n]
            
            # Verificar si el rayo horizontal cruza el segmento
            # p1y > y != p2y > y asegura que el punto Y esté entre p1y y p2y
            if ((p1y > y) != (p2y > y)) and \
               (x < (p2x - p1x) * (y - p1y) / (p2y - p1y) + p1x):
                inside = not inside
                
        return inside
    except Exception:
        return True


class AlertViewSet(viewsets.ModelViewSet):
    """CRUD de alertas. Listado público; create/update/delete requieren autenticación."""
    queryset = Alert.objects.select_related('zona').all()
    serializer_class = AlertSerializer
    filterset_class = AlertFilter
    filter_backends = [DjangoFilterBackend]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list' and self.request.query_params.get('activas') == 'true':
            qs = qs.filter(activa=True)
        return qs

    def _validate_zone_bounds(self, lat, lon, zona_id):
        if not zona_id or zona_id == '':
            return
        try:
            zona = Zone.objects.get(pk=zona_id)
            if zona.geometry_json:
                if not _is_point_in_polygon(lat, lon, zona.geometry_json):
                    raise ValidationError({
                        'non_field_errors': [f"Las coordenadas ({lat}, {lon}) están fuera de los límites de la zona '{zona.nombre}'."]
                    })
        except (Zone.DoesNotExist, ValueError):
            pass

    def perform_create(self, serializer):
        # Extraer lat/lon del request para validación
        lat, lon = _lat_lon_from_request(self.request.data)
        if lat is None: lat = self.request.data.get('latitude')
        if lon is None: lon = self.request.data.get('longitude')
        
        zona_id = self.request.data.get('zona')
        
        # Si se proporcionan coordenadas, validar contra la zona
        if lat is not None and lon is not None:
            try:
                self._validate_zone_bounds(float(lat), float(lon), zona_id)
            except (TypeError, ValueError):
                pass
        
        instance = serializer.save()
        
        # Asegurar que si vino por GeoJSON 'point', se guarden en los campos Float
        if lat is not None and lon is not None:
            instance.latitude = float(lat)
            instance.longitude = float(lon)
            instance.save(update_fields=['latitude', 'longitude'])

    def perform_update(self, serializer):
        # Intentar extraer nuevas coordenadas del request
        lat, lon = _lat_lon_from_request(self.request.data)
        if lat is None: lat = self.request.data.get('latitude')
        if lon is None: lon = self.request.data.get('longitude')
        
        # Si no hay nuevas, usar las actuales del objeto
        if lat is None: lat = serializer.instance.latitude
        if lon is None: lon = serializer.instance.longitude
        
        # Obtener zona (nueva del request o actual)
        zona_id = self.request.data.get('zona', serializer.instance.zona_id)
        
        if lat is not None and lon is not None:
            try:
                self._validate_zone_bounds(float(lat), float(lon), zona_id)
            except (TypeError, ValueError):
                pass

        instance = serializer.save()
        
        # Si se envió un nuevo 'point', actualizar campos Float
        if 'point' in self.request.data or 'latitude' in self.request.data:
            new_lat, new_lon = _lat_lon_from_request(self.request.data)
            if new_lat is None: new_lat = self.request.data.get('latitude')
            if new_lon is None: new_lon = self.request.data.get('longitude')
            
            if new_lat is not None and new_lon is not None:
                instance.latitude = float(new_lat)
                instance.longitude = float(new_lon)
                instance.save(update_fields=['latitude', 'longitude'])


class ZoneViewSet(viewsets.ModelViewSet):
    """CRUD completo de zonas. Solo lectura para anónimos, CRUD para admin."""
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated()]


class AlertExportView(APIView):
    """Exportar alertas a Excel (.xlsx). Público."""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            import pandas as pd
        except ImportError:
            return Response(
                {'error': 'pandas no instalado'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        queryset = Alert.objects.select_related('zona').all().order_by('-fecha_hora')
        # Aplicar filtros opcionales
        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')
        if desde:
            queryset = queryset.filter(fecha_hora__date__gte=desde)
        if hasta:
            queryset = queryset.filter(fecha_hora__date__lte=hasta)
        data = []
        for a in queryset:
            data.append({
                'ID': a.id,
                'Tipo': a.get_tipo_desastre_display(),
                'Nivel riesgo': a.get_nivel_riesgo_display(),
                'Zona': a.zona.nombre if a.zona else '',
                'Fecha y hora': timezone.localtime(a.fecha_hora).replace(tzinfo=None),
                'Descripción': a.descripcion or '',
                'Latitud': a.latitude,
                'Longitud': a.longitude,
                'Radio (m)': a.radio_impacto,
                'Activa': 'Sí' if a.activa else 'No',
            })
        df = pd.DataFrame(data)
        output = io.BytesIO()
        df.to_excel(output, index=False, engine='openpyxl')
        output.seek(0)
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=alertas.xlsx'
        return response


class StatisticsView(APIView):
    """Estadísticas para el dashboard: por tipo, por nivel, por zona, tendencia temporal."""
    permission_classes = [AllowAny]

    def get(self, request):
        base_qs = Alert.objects.all()
        # Filtro opcional por rango de fechas
        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')
        if desde:
            base_qs = base_qs.filter(fecha_hora__date__gte=desde)
        if hasta:
            base_qs = base_qs.filter(fecha_hora__date__lte=hasta)

        por_tipo = list(base_qs.values('tipo_desastre').annotate(total=Count('id')).order_by('-total'))
        por_nivel = list(base_qs.values('nivel_riesgo').annotate(total=Count('id')).order_by('-total'))
        por_zona = list(
            base_qs.filter(zona__isnull=False)
            .values('zona__nombre')
            .annotate(total=Count('id'))
            .order_by('-total')[:10]
        )
        # Tendencias: últimos 30 días por día
        hace_30 = timezone.now() - timedelta(days=30)
        tendencia = list(
            base_qs.filter(fecha_hora__gte=hace_30)
            .annotate(date=TruncDate('fecha_hora'))
            .values('date')
            .annotate(total=Count('id'))
            .order_by('date')
        )
        # Resumen general
        resumen = {
            'total_alertas': base_qs.count(),
            'alertas_activas': base_qs.filter(activa=True).count(),
            'alertas_criticas': base_qs.filter(nivel_riesgo='CRITICO', activa=True).count(),
            'total_zonas': Zone.objects.count()
        }

        # Alertas recientes para el feed
        alertas_recientes = AlertSerializer(base_qs.order_by('-fecha_hora')[:5], many=True).data

        return Response({
            'resumen': resumen,
            'por_tipo': por_tipo,
            'por_nivel': por_nivel,
            'por_zona': por_zona,
            'tendencia': tendencia,
            'alertas_recientes': alertas_recientes
        })


class WeatherProxyView(APIView):
    """Proxy a OpenWeatherMap para datos climáticos (lat, lon)."""
    permission_classes = [AllowAny]

    def get(self, request):
        from django.conf import settings
        api_key = getattr(settings, 'OPENWEATHERMAP_API_KEY', None) or request.query_params.get('api_key')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        if not lat or not lon:
            return Response({'error': 'Parámetros lat y lon requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        if not api_key:
            return Response({'error': 'OPENWEATHERMAP_API_KEY no configurada'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric&lang=es'
        try:
            r = requests.get(url, timeout=10)
            r.raise_for_status()
            return Response(r.json())
        except requests.RequestException as e:
            return Response({'error': str(e)}, status=status.HTTP_525_BAD_GATEWAY)


class SimulateNotificationsView(APIView):
    """Simula el envío de notificaciones para alertas activas: registra en NotificationLog (sin envío real)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        alertas = Alert.objects.filter(activa=True).select_related('zona')
        created = []
        for alert in alertas:
            zona_nombre = alert.zona.nombre if alert.zona else 'Sin zona'
            log = NotificationLog.objects.create(
                alert=alert,
                email_simulado=f"usuario_zona_{alert.id}@simulado.local",
                zona_nombre=zona_nombre,
                enviado_simulado=True,
            )
            created.append({'alert_id': alert.id, 'log_id': log.id, 'zona': zona_nombre})
        return Response({'message': 'Simulación completada', 'notificaciones_registradas': len(created), 'detalle': created})
