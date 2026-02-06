"""
Filtros para el listado de alertas (fecha, zona, tipo, nivel).
"""
import django_filters
from .models import Alert


class AlertFilter(django_filters.FilterSet):
    desde = django_filters.DateFilter(field_name='fecha_hora', lookup_expr='date__gte')
    hasta = django_filters.DateFilter(field_name='fecha_hora', lookup_expr='date__lte')
    zona = django_filters.NumberFilter(field_name='zona_id')
    tipo_desastre = django_filters.CharFilter(field_name='tipo_desastre')
    nivel_riesgo = django_filters.CharFilter(field_name='nivel_riesgo')
    activas = django_filters.BooleanFilter(field_name='activa')

    class Meta:
        model = Alert
        fields = ['desde', 'hasta', 'zona', 'tipo_desastre', 'nivel_riesgo', 'activas']
