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
from rest_framework.parsers import MultiPartParser
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
from .serializers import AlertSerializer, ZoneSerializer, SubscriberSerializer
from .models import Subscriber
from .filters import AlertFilter
from django.conf import settings
from mailersend import MailerSendClient, EmailBuilder
import smtplib
from email.message import EmailMessage
import os

def _send_alert_email(alert, recipient_email):
    """Envía un correo real usando MailerSend."""
    api_key = getattr(settings, 'MAILERSEND_API_KEY', None)
    sender_email = getattr(settings, 'MAILERSEND_SENDER', 'info@trial-z3m5yelyy9oldpyo.mlsender.net')
    
    if not api_key:
        return False
    subject = f"⚠️ ALERTA: {alert.get_tipo_desastre_display()} - {alert.get_nivel_riesgo_display()}"

    html_content = f"""
    <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #e11d48;">Aviso de Emergencia</h2>
        <p>Se ha detectado un evento de <strong>{alert.get_tipo_desastre_display()}</strong> en su zona.</p>
        <p><strong>Nivel de Riesgo:</strong> {alert.get_nivel_riesgo_display()}</p>
        <p><strong>Descripción:</strong> {alert.descripcion or 'Sin descripción disponible'}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Por favor, siga los protocolos de defensa civil y manténgase a resguardo.</p>
    </div>
    """

    text_content = f"ALERTA: {alert.get_tipo_desastre_display()} - {alert.get_nivel_riesgo_display()}\n\n{alert.descripcion or ''}"

    # Support simulation mode
    try:
        if getattr(settings, 'MAILERSEND_SIMULATE', False):
            # Simulate sending
            info = {
                'ok': True,
                'provider': 'simulate',
                'provider_id': None,
                'response': 'simulated'
            }
            return info

        ms = MailerSendClient(api_key)
        email = (
            EmailBuilder()
            .from_email(sender_email, "SAT - Alerta Temprana")
            .to_many([{"email": recipient_email, "name": "Usuario de Riesgo"}])
            .subject(subject)
            .html(html_content)
            .text(text_content)
            .build()
        )
        resp = ms.emails.send(email)
        # Try to extract an id if present
        provider_id = None
        try:
            if isinstance(resp, dict):
                provider_id = resp.get('data') or resp.get('message_id') or resp.get('id')
        except Exception:
            provider_id = None

        return {'ok': True, 'provider': 'mailersend_api', 'provider_id': provider_id, 'response': str(resp)}
    except Exception as e:
        err_str = str(e)
        print(f"Error enviando correo via API MailerSend: {err_str}")

        # Fallback: intentar envío por SMTP si hay credenciales en env
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = int(os.environ.get('SMTP_PORT', '587')) if os.environ.get('SMTP_PORT') else None
        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')

        if smtp_host and smtp_user and smtp_password:
            try:
                msg = EmailMessage()
                msg['Subject'] = subject
                msg['From'] = sender_email
                msg['To'] = recipient_email
                msg.set_content(text_content)
                msg.add_alternative(html_content, subtype='html')

                # Conexión TLS
                smtp_port = smtp_port or 587
                with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_password)
                    server.send_message(msg)
                return {'ok': True, 'provider': 'smtp', 'provider_id': None, 'response': 'smtp_ok'}
            except Exception as se:
                print(f"Error enviando correo via SMTP fallback: {se}")
                return {'ok': False, 'provider': 'smtp', 'provider_id': None, 'response': str(se)}

        return {'ok': False, 'provider': 'mailersend_api', 'provider_id': None, 'response': err_str}


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


class SubscriberViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar suscriptores globales.

    - `create` está abierto (AllowAny) para que el frontend publique el formulario.
    - `list`/`retrieve`/`destroy` requieren autenticación (admin).
    """
    queryset = Subscriber.objects.all()
    serializer_class = SubscriberSerializer

    def get_permissions(self):
        if self.action in ('create',):
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def unsubscribe(self, request):
        """Desactiva la suscripción por email.

        Body JSON: { "email": "user@example.com" }
        """
        email = request.data.get('email')
        if not email:
            return Response({'error': 'email requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            sub = Subscriber.objects.get(email__iexact=email)
            sub.active = False
            sub.save(update_fields=['active'])
            return Response({'message': 'suscripción desactivada'})
        except Subscriber.DoesNotExist:
            return Response({'error': 'suscriptor no encontrado'}, status=status.HTTP_404_NOT_FOUND)


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

        # Usar API 2.5 Standard (Más compatible con keys gratuitas estándar)
        url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric&lang=es'
        try:
            r = requests.get(url, timeout=5)
            r.raise_for_status()
            return Response(r.json())
        except requests.RequestException as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class SimulateNotificationsView(APIView):
    """Simula el envío de notificaciones para alertas activas: registra en NotificationLog (sin envío real)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        alertas = Alert.objects.filter(activa=True).select_related('zona')
        created = []

        # Recolectar suscriptores activos (suscripción global)
        subscribers = list(Subscriber.objects.filter(active=True).values('email', 'name'))

        # Si se pasó un email en el request, también lo incluimos (pero no duplicar)
        request_email = request.data.get('email')

        # Construir la lista de destinatarios (deduplicada)
        recipients = []
        for s in subscribers:
            recipients.append(s['email'])
        if request_email:
            recipients.append(request_email)
        # Deduplicar manteniendo orden
        seen = set()
        recipients = [r for r in recipients if not (r in seen or seen.add(r))]

        if not recipients:
            # Fallback a un correo de ejemplo si no hay suscriptores ni email
            recipients = ['tu_correo@ejemplo.com']

        for alert in alertas:
            zona_nombre = alert.zona.nombre if alert.zona else 'Sin zona'

            for recipient in recipients:
                enviado = _send_alert_email(alert, recipient)

                # Normalize result: puede ser bool (antiguo) o dict (nuevo)
                if isinstance(enviado, dict):
                    ok = bool(enviado.get('ok'))
                    provider = enviado.get('provider')
                    provider_id = enviado.get('provider_id')
                    provider_response = enviado.get('response')
                else:
                    ok = bool(enviado)
                    provider = None
                    provider_id = None
                    provider_response = str(enviado)

                log = NotificationLog.objects.create(
                    alert=alert,
                    email_simulado=recipient,
                    zona_nombre=zona_nombre,
                    enviado_simulado=ok,
                    provider=provider or '',
                    provider_id=provider_id or '',
                    provider_response=provider_response or ''
                )
                created.append({
                    'alert_id': alert.id,
                    'log_id': log.id,
                    'zona': zona_nombre,
                    'email': recipient,
                    'estado_envio': 'Exitoso' if ok else f'Fallido ({provider or "error"})'
                })

        return Response({
            'message': 'Proceso de notificación finalizado',
            'detalles': created
        })


class AlertImportView(APIView):
    """Importar alertas desde archivo Excel (.xlsx). Autenticado (Admin)."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
             return Response({'error': 'No se proporcionó ningún archivo'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            import pandas as pd
            df = pd.read_excel(file)
            
            # Validar columnas mínimas
            required_cols = ['Tipo', 'Nivel', 'Descripcion', 'Latitud', 'Longitud']
            if not all(col in df.columns for col in required_cols):
                return Response(
                    {'error': f'Formato inválido. Columnas requeridas: {", ".join(required_cols)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            created_count = 0
            errors = []
            
            # Mapeo de valores de display a claves del modelo (ej "INUNDACION" -> "INUNDACION")
            # Asumimos que el Excel trae las claves en mayúsculas (INUNDACION, INCENDIO, etc.) o display
            # Para simplificar, intentaremos mapear exacto o default a OTROS
            
            for index, row in df.iterrows():
                try:
                    # Parsear datos básicos
                    tipo = str(row['Tipo']).upper()
                    nivel = str(row['Nivel']).upper()
                    
                    # Validar opciones (simplificado)
                    valid_types = [c[0] for c in Alert.TIPO_DESASTRE_CHOICES]
                    if tipo not in valid_types:
                        tipo = 'OTROS'
                        
                    valid_levels = [c[0] for c in Alert.NIVEL_RIESGO_CHOICES]
                    if nivel not in valid_levels:
                        nivel = 'BAJO'

                    Alert.objects.create(
                        tipo_desastre=tipo,
                        nivel_riesgo=nivel,
                        descripcion=row['Descripcion'],
                        latitude=float(row['Latitud']),
                        longitude=float(row['Longitud']),
                        radio_impacto=float(row.get('Radio', 1000)), # Default 1km
                        activa=True, # Por defecto activas al importar
                        # Zona opcional: para hacerlo robusto habría que buscar la zona por nombre o coordenadas
                        # Por ahora dejamos zona en null o buscamos por intersección automática si existiera esa lógica
                    )
                    created_count += 1
                except Exception as e:
                    errors.append(f"Fila {index + 2}: {str(e)}")
            
            return Response({
                'message': f'Proceso completado. {created_count} alertas creadas.',
                'created': created_count, 
                'errors': errors
            })
            
        except ImportError:
            return Response({'error': 'Librería pandas no instalada en el servidor'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
             return Response({'error': f'Error procesando archivo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
