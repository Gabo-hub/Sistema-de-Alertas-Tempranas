from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Alert, Subscriber, NotificationLog
from .views import _send_alert_email


@receiver(post_save, sender=Alert)
def alert_post_save(sender, instance, created, **kwargs):
    """Cuando se crea una Alert activa, notificar a suscriptores globales.

    Este handler envía correos de forma síncrona. En producción recomendamos usar
    una cola (Celery/RQ) para offload.
    """
    # Solo al crear y si está activa
    if not created or not instance.activa:
        return

    # Recolectar destinatarios activos
    recipients = list(Subscriber.objects.filter(active=True).values_list('email', flat=True))
    if not recipients:
        return

    zona_nombre = instance.zona.nombre if instance.zona else 'Sin zona'

    for recipient in recipients:
        result = _send_alert_email(instance, recipient)

        # Normalize
        if isinstance(result, dict):
            ok = bool(result.get('ok'))
            provider = result.get('provider') or ''
            provider_id = result.get('provider_id') or ''
            provider_response = result.get('response') or ''
        else:
            ok = bool(result)
            provider = ''
            provider_id = ''
            provider_response = str(result)

        NotificationLog.objects.create(
            alert=instance,
            email_simulado=recipient,
            zona_nombre=zona_nombre,
            enviado_simulado=ok,
            provider=provider,
            provider_id=provider_id,
            provider_response=provider_response
        )
