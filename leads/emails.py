import logging
from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMessage

logger = logging.getLogger(__name__)


def _send(subject, body, to, attachments=None):
    """
    Send one email. Best-effort: any failure is logged and swallowed so an
    SMTP problem can never break lead capture — the lead is already saved by
    the time these are called. Returns True on success, False otherwise.
    """
    try:
        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to] if isinstance(to, str) else list(to),
        )
        for path in attachments or []:
            msg.attach_file(str(path))
        msg.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('Email failed: %r -> %s', subject, to)
        return False


# --------------------------------------------------------------------------
# Customer-facing
# --------------------------------------------------------------------------

def send_catalog_email(sample_request):
    """Catalog request: email the PDF to the prospect, then alert sales."""
    sr = sample_request
    catalog_path = Path(settings.CATALOG_PATH)
    greeting = sr.contact_name or sr.company_name

    if catalog_path.exists():
        body = (
            f'Përshëndetje {greeting},\n\n'
            'Faleminderit për interesimin tënd! Bashkëngjitur do të gjesh '
            'katalogun e plotë të produkteve të Gerti Foods.\n\n'
            'Nëse dëshiron mostra falas ose listën e çmimeve me shumicë, '
            'thjesht përgjigju këtij email-i — jemi këtu për ty.\n\n'
            'Gatuar me dashni nga Kosova,\n'
            'Ekipi i Gerti Foods\n'
            'www.gertifoods.com · +383 49 111 150'
        )
        _send('Katalogu i produkteve — Gerti Foods', body, sr.email,
              attachments=[catalog_path])
    else:
        logger.error('Catalog file missing at %s (SampleRequest #%s)',
                     catalog_path, sr.pk)

    notify_sales_sample(sr, label='Kërkesë katalog')


def send_sample_confirmation(sample_request):
    """Free-sample / contact request: thank the prospect, then alert sales."""
    sr = sample_request
    greeting = sr.contact_name or sr.company_name
    body = (
        f'Përshëndetje {greeting},\n\n'
        'Faleminderit për kërkesën tënde! E pranuam dhe ekipi ynë do të të '
        'kontaktojë shumë shpejt.\n\n'
        'Gatuar me dashni nga Kosova,\n'
        'Ekipi i Gerti Foods\n'
        'www.gertifoods.com · +383 49 111 150'
    )
    _send('E pranuam kërkesën tënde — Gerti Foods', body, sr.email)
    notify_sales_sample(sr, label='Kërkesë mostrash')


# --------------------------------------------------------------------------
# Sales-facing notifications
# --------------------------------------------------------------------------

def notify_sales_sample(sample_request, label='Kërkesë e re'):
    """Email the sales team the full details of a SampleRequest."""
    sr = sample_request
    body = (
        f'{label} nga website:\n\n'
        f'Kompania: {sr.company_name}\n'
        f'Kontakti: {sr.contact_name or "—"}\n'
        f'Email: {sr.email}\n'
        f'Telefoni: {sr.phone or "—"}\n'
        f'Qyteti: {sr.city or "—"}\n'
        f'Lloji i biznesit: {sr.get_business_type_display()}\n'
        f'Produktet me interes: {sr.products_interested or "—"}\n'
        f'Mesazhi: {sr.message or "—"}\n'
        f'Burimi: {sr.get_source_display()}\n'
    )
    _send(f'{label} — {sr.company_name}', body, settings.SALES_EMAIL)


def notify_sales_lead(lead):
    """Email the sales team the details of a low-friction Lead."""
    body = (
        f'Lead i ri nga website:\n\n'
        f'Emri: {lead.first_name} {lead.last_name}\n'
        f'Email: {lead.email}\n'
        f'Telefoni: {lead.phone}\n'
        f'Mesazhi: {lead.message or "—"}\n'
        f'Burimi: {lead.get_source_display()}\n'
    )
    _send(f'Lead i ri — {lead.first_name} {lead.last_name}', body,
          settings.SALES_EMAIL)
