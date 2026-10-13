import logging
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone

from .models import SampleRequest

logger = logging.getLogger(__name__)


# Customer-facing email copy per language. Sales-team notifications stay in
# Albanian (internal).
#
# The greeting names nobody, on purpose. These go to whatever address the form
# was given, and the name used to come from the same form — text of the
# visitor's choosing, sent to an address of their choosing, from our own
# mailbox. That made the catalog form a way to put any message in front of
# anyone under the Gerti Foods name.
EMAIL_COPY = {
    'sq': {
        'catalog_subject': 'Katalogu i produkteve — Gerti Foods',
        'catalog_body': (
            'Përshëndetje,\n\n'
            'Faleminderit për interesimin tënd! Bashkëngjitur do të gjesh '
            'katalogun e plotë të produkteve të Gerti Foods.\n\n'
            'Nëse dëshiron mostra falas ose listën e çmimeve me shumicë, '
            'thjesht përgjigju këtij email-i — jemi këtu për ty.\n\n'
            'Gatuar me dashni nga Kosova,\n'
            'Ekipi i Gerti Foods\n'
            'www.gertifoods.com · +383 49 111 150'
        ),
        'sample_subject': 'E pranuam kërkesën tënde — Gerti Foods',
        'sample_body': (
            'Përshëndetje,\n\n'
            'Faleminderit për kërkesën tënde! E pranuam dhe ekipi ynë do të të '
            'kontaktojë shumë shpejt.\n\n'
            'Gatuar me dashni nga Kosova,\n'
            'Ekipi i Gerti Foods\n'
            'www.gertifoods.com · +383 49 111 150'
        ),
    },
    'en': {
        'catalog_subject': 'Product catalog — Gerti Foods',
        'catalog_body': (
            'Hello,\n\n'
            "Thank you for your interest! Attached you'll find the complete "
            'Gerti Foods product catalog.\n\n'
            "If you'd like free samples or our wholesale price list, simply "
            "reply to this email — we're here to help.\n\n"
            'Baked with love in Kosovo,\n'
            'The Gerti Foods Team\n'
            'www.gertifoods.com · +383 49 111 150'
        ),
        'sample_subject': 'We received your request — Gerti Foods',
        'sample_body': (
            'Hello,\n\n'
            "Thank you for your request! We've received it and our team will "
            'be in touch very soon.\n\n'
            'Baked with love in Kosovo,\n'
            'The Gerti Foods Team\n'
            'www.gertifoods.com · +383 49 111 150'
        ),
    },
    'de': {
        'catalog_subject': 'Produktkatalog — Gerti Foods',
        'catalog_body': (
            'Hallo,\n\n'
            'vielen Dank für Ihr Interesse! Im Anhang finden Sie den '
            'vollständigen Produktkatalog von Gerti Foods.\n\n'
            'Wenn Sie kostenlose Muster oder unsere Großhandelspreisliste '
            'wünschen, antworten Sie einfach auf diese E-Mail — wir sind '
            'für Sie da.\n\n'
            'Mit Liebe gebacken im Kosovo,\n'
            'Ihr Gerti Foods Team\n'
            'www.gertifoods.com · +383 49 111 150'
        ),
        'sample_subject': 'Wir haben Ihre Anfrage erhalten — Gerti Foods',
        'sample_body': (
            'Hallo,\n\n'
            'vielen Dank für Ihre Anfrage! Wir haben sie erhalten und unser '
            'Team meldet sich in Kürze bei Ihnen.\n\n'
            'Mit Liebe gebacken im Kosovo,\n'
            'Ihr Gerti Foods Team\n'
            'www.gertifoods.com · +383 49 111 150'
        ),
    },
}


def _copy(lang, key):
    """Look up email copy for a language, falling back to English."""
    return EMAIL_COPY.get(lang, EMAIL_COPY['en'])[key]


def _header_safe(value):
    """Collapse anything that would make Django reject an email header.

    Django refuses a subject containing a newline — correctly, since that is
    how header injection works — by raising BadHeaderError. But _send swallows
    every exception, so a lead whose name contained a line break saved fine and
    then vanished from the sales inbox with no visible error. Someone
    submitting deliberately shaped names could keep their submissions out of
    view that way.

    Collapsing the whitespace keeps the header valid and the notification
    delivered, rather than trading one silent loss for another.
    """
    return ' '.join(str(value).split())


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
# Customer-facing (localized by visitor IP -> lang)
# --------------------------------------------------------------------------

# What became of the visitor's own email, as the sales notification reports
# it. A held-back or failed email is only worth knowing about where someone can
# act on it, which is the sales inbox rather than the log.
CUSTOMER_EMAIL_STATUS = {
    'sent': 'u dërgua',
    'repeat': 'nuk u dërgua: e njëjta adresë bëri të njëjtën kërkesë në 24 orët e fundit',
    'daily_limit': (
        'NUK u dërgua: u arrit kufiri ditor i email-eve automatike. '
        'Dërgoje manualisht.'
    ),
    'no_catalog': 'NUK u dërgua: skedari i katalogut mungon në server. Dërgoje manualisht.',
    'failed': 'NUK u dërgua: dërgimi dështoi. Dërgoje manualisht.',
}


def _hold_back_reason(sample_request):
    """Why the visitor's own email must not go out, or None if it may.

    The address is whatever the form was given, so without limits the form
    sends our mail wherever it is told to. Two of them:

    - One email of each kind per address per 24 hours. Repeats to one address
      are what turn the form into a way to flood someone's inbox, and a real
      prospect has no use for a second copy the same day. Per kind, so asking
      for samples and then for the catalog still gets both.
    - CUSTOMER_EMAIL_DAILY_LIMIT across the whole site, so that traffic which
      gets past reCAPTCHA and the per-IP throttle from many addresses still
      cannot turn the sales mailbox into a bulk sender.

    Both count saved requests rather than sent mail, so a request that was held
    back still counts — repeating it keeps it held back.
    """
    sr = sample_request
    recent = SampleRequest.objects.filter(
        created_at__gte=timezone.now() - timedelta(hours=24),
    ).exclude(pk=sr.pk)
    same_kind = (
        recent.filter(source='catalog_request')
        if sr.source == 'catalog_request'
        else recent.exclude(source='catalog_request')
    )
    if same_kind.filter(email__iexact=sr.email).exists():
        return 'repeat'
    if recent.count() >= settings.CUSTOMER_EMAIL_DAILY_LIMIT:
        return 'daily_limit'
    return None


def _email_customer(sample_request, subject, body, attachments=None):
    """Send the visitor's own email unless a limit holds it back.

    Returns a CUSTOMER_EMAIL_STATUS key for the sales notification.
    """
    reason = _hold_back_reason(sample_request)
    if reason:
        logger.warning(
            'Customer email held back (%s): SampleRequest #%s', reason, sample_request.pk
        )
        return reason
    sent = _send(subject, body, sample_request.email, attachments=attachments)
    return 'sent' if sent else 'failed'


def send_catalog_email(sample_request, lang='en'):
    """Catalog request: email the PDF to the prospect, then alert sales."""
    sr = sample_request
    catalog_path = Path(settings.CATALOG_PATH)

    if catalog_path.exists():
        status = _email_customer(
            sr,
            _copy(lang, 'catalog_subject'),
            _copy(lang, 'catalog_body'),
            attachments=[catalog_path],
        )
    else:
        logger.error('Catalog file missing at %s (SampleRequest #%s)',
                     catalog_path, sr.pk)
        status = 'no_catalog'

    return notify_sales_sample(sr, label='Kërkesë katalog', customer_email=status)


def send_sample_confirmation(sample_request, lang='en'):
    """Free-sample / contact request: thank the prospect, then alert sales."""
    sr = sample_request
    status = _email_customer(sr, _copy(lang, 'sample_subject'), _copy(lang, 'sample_body'))
    return notify_sales_sample(sr, label='Kërkesë mostrash', customer_email=status)


# --------------------------------------------------------------------------
# Sales-facing notifications (always Albanian — internal team)
# --------------------------------------------------------------------------

def notify_sales_sample(sample_request, label='Kërkesë e re', customer_email=None):
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
    if customer_email:
        body += f'Email-i për klientin: {CUSTOMER_EMAIL_STATUS[customer_email]}\n'
    return _send(
        _header_safe(f'{label} — {sr.company_name}'), body, settings.SALES_EMAIL
    )


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
    return _send(
        _header_safe(f'Lead i ri — {lead.first_name} {lead.last_name}'),
        body,
        settings.SALES_EMAIL,
    )
