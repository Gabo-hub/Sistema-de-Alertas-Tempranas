import os
import sys
import django

# Añadir la carpeta backend al path para que 'config' sea importable
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Inicializar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from alerts.models import Alert
from alerts.views import _send_alert_email

def main():
    a = Alert.objects.first()
    if not a:
        print('NO_ALERTS')
        sys.exit(2)

    try:
        result = _send_alert_email(a, 'gabrielgomezjr1@gmail.com')
        print('SEND_RESULT', result)
    except Exception as e:
        print('EXCEPTION', str(e))
        sys.exit(1)

if __name__ == '__main__':
    main()
