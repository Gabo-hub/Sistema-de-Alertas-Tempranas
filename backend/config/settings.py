"""
Configuración Django - Sistema de Alerta Temprana.
Soporta PostgreSQL+PostGIS. Variables de entorno para producción.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import urllib.parse

# Force psycopg2 to use UTF-8 for error messages to avoid UnicodeDecodeError on Windows/Spanish locales
os.environ['PGCLIENTENCODING'] = 'UTF8'

BASE_DIR = Path(__file__).resolve().parent.parent

# Cargar variables de entorno desde .env
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'alerts',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Base de datos: PostgreSQL estándar (sin PostGIS). No se requiere GDAL/GEOS.
# Variables de entorno: PGDATABASE, PGUSER, PGPASSWORD, PGHOST, PGPORT.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('PGDATABASE'),
        'USER': os.environ.get('PGUSER'),
        'PASSWORD': os.environ.get('PGPASSWORD'),
        'HOST': os.environ.get('PGHOST'),
        'PORT': os.environ.get('PGPORT'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-ve'
TIME_ZONE = 'America/Caracas'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOW_CREDENTIALS = True

# Soporte para túneles / hosts expuestos en desarrollo (ej: devtunnels, ngrok)
TUNNEL_HOST = os.environ.get('TUNNEL_HOST')
CSRF_TRUSTED_ORIGINS = []
if TUNNEL_HOST:
    th = TUNNEL_HOST.rstrip('/')
    parsed = urllib.parse.urlparse(th)
    host_only = parsed.netloc or parsed.path
    if host_only and host_only not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(host_only)
    if th not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(th)
    CSRF_TRUSTED_ORIGINS = [th]
else:
    CSRF_TRUSTED_ORIGINS = []

# Soporte para host público del frontend (dev tunnel)
FRONTEND_HOST = os.environ.get('FRONTEND_HOST')
if FRONTEND_HOST:
    fh = FRONTEND_HOST.rstrip('/')
    parsed_f = urllib.parse.urlparse(fh)
    host_only_f = parsed_f.netloc or parsed_f.path
    if host_only_f and host_only_f not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(host_only_f)
    if fh not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(fh)
    # Añadir al CSRF_TRUSTED_ORIGINS si está vacío o no contiene el frontend
    if fh not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(fh)

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# API Clima (OpenWeatherMap)
OPENWEATHERMAP_API_KEY = os.environ.get('OPENWEATHERMAP_API_KEY', '')

# MailerSend Configuration
MAILERSEND_API_KEY = os.environ.get('MAILERSEND_API_KEY', '')
MAILERSEND_SENDER = os.environ.get('MAILERSEND_SENDER', 'info@trial-z3m5yelyy9oldpyo.mlsender.net')
MAILERSEND_SIMULATE = os.environ.get('MAILERSEND_SIMULATE', 'False').lower() == 'true'
