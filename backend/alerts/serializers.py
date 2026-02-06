"""
Serializers para la API de alertas y zonas.
GeoJSON construido desde lat/lon y JSON (sin GDAL/GEOS).
"""
from rest_framework import serializers
from .models import Alert, Zone


class ZoneSerializer(serializers.ModelSerializer):
    """Zona con geometría en GeoJSON (desde geometry_json)."""
    geometry_geojson = serializers.SerializerMethodField()

    class Meta:
        model = Zone
        fields = ['id', 'nombre', 'codigo', 'geometry_json', 'geometry_geojson', 'created_at']
        extra_kwargs = {
            'geometry_json': {'write_only': True}
        }

    def get_geometry_geojson(self, obj):
        return obj.geometry_json


class AlertSerializer(serializers.ModelSerializer):
    """Alerta con punto en GeoJSON (desde latitude/longitude)."""
    zona_nombre = serializers.CharField(source='zona.nombre', read_only=True)
    point_geojson = serializers.SerializerMethodField()
    tipo_desastre_display = serializers.CharField(source='get_tipo_desastre_display', read_only=True)
    nivel_riesgo_display = serializers.CharField(source='get_nivel_riesgo_display', read_only=True)

    class Meta:
        model = Alert
        fields = [
            'id', 'tipo_desastre', 'tipo_desastre_display',
            'nivel_riesgo', 'nivel_riesgo_display',
            'zona', 'zona_nombre', 'latitude', 'longitude', 'radio_impacto', 'point_geojson',
            'fecha_hora', 'descripcion', 'activa',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_point_geojson(self, obj):
        if obj.latitude is not None and obj.longitude is not None:
            return {'type': 'Point', 'coordinates': [obj.longitude, obj.latitude]}
        return None
