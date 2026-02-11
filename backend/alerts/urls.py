"""
URLs de la API de alertas.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
router.register(r'alerts', views.AlertViewSet, basename='alert')
router.register(r'zones', views.ZoneViewSet, basename='zone')
router.register(r'subscribers', views.SubscriberViewSet, basename='subscriber')

urlpatterns = [
    path('alerts/export/', views.AlertExportView.as_view(), name='alerts-export'),
    path('alerts/import/', views.AlertImportView.as_view(), name='alerts-import'),
    path('statistics/', views.StatisticsView.as_view(), name='statistics'),
    path('weather/', views.WeatherProxyView.as_view(), name='weather'),
    path('notifications/simulate/', views.SimulateNotificationsView.as_view(), name='notifications-simulate'),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('', include(router.urls)),
]
