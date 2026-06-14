import logging
from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMessage

logger = logging.getLogger(__name__)


def send_catalog_email(sample_request):
    """
    Email the product catalog PDF to a prospect who requested it.

    Called synchronously after a catalog SampleRequest is saved. Any failure
    is logged and swallowed so a mail/SMTP problem never breaks the lead
    capture — the request is already persisted by the time we get here.

    Returns True if the catalog was sent, False otherwise.
    """
    catalog_path = Path(settings.CATALOG_PATH)
    if not catalog_path.exists():
        logger.error(
            'Catalog file missing at %s — cannot email SampleRequest #%s',
            catalog_path,
            sample_request.pk,
        )
        return False

    greeting_name = sample_request.contact_name or sample_request.company_name

    subject = 'Katalogu i produkteve — Gerti Foods'
    body = (
        f'Përshëndetje {greeting_name},\n\n'
        'Faleminderit për interesimin tend! Bashkëngjitur do të gjesh '
        'katalogun e plotë të produkteve të Gerti Foods.\n\n'
        'Nëse dëshiron mostra falas ose listën e çmimeve me shumicë, '
        'thjesht përgjigju këtij email-i — jemi këtu për ty.\n\n'
        'Gatuar me dashni nga Kosova,\n'
        'Ekipi i Gerti Foods\n'
        'www.gertifoods.com · +383 49 111 150'
    )

    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[sample_request.email],
    )
    email.attach_file(str(catalog_path))

    try:
        email.send(fail_silently=False)
    except Exception:
        logger.exception(
            'Failed to email catalog to %s (SampleRequest #%s)',
            sample_request.email,
            sample_request.pk,
        )
        return False

    logger.info(
        'Catalog emailed to %s (SampleRequest #%s)',
        sample_request.email,
        sample_request.pk,
    )

    _notify_sales(sample_request)
    return True


def _notify_sales(sample_request):
    """
    Send the sales team a heads-up about a new catalog request. Best-effort:
    any failure is logged and swallowed so it never affects the customer-facing
    catalog delivery or the captured lead.
    """
    try:
        EmailMessage(
            subject=f'Kërkesë e re katalog — {sample_request.company_name}',
            body=(
                'Kërkesë e re për katalog:\n\n'
                f'Kompania: {sample_request.company_name}\n'
                f'Kontakti: {sample_request.contact_name or "—"}\n'
                f'Email: {sample_request.email}\n'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.SALES_EMAIL],
        ).send(fail_silently=False)
    except Exception:
        logger.exception(
            'Failed to notify sales of catalog request (SampleRequest #%s)',
            sample_request.pk,
        )
