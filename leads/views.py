import logging
import re
import time

from rest_framework import generics, permissions, status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.throttling import ScopedRateThrottle

from .emails import (
    send_catalog_email,
    send_lead_confirmation,
    send_sample_confirmation,
)
from .capi import build_user_data, send_lead_event
from .geo import get_client_ip, email_lang_for_ip
from .models import Lead, SampleRequest
from .serializers import LeadSerializer, SampleRequestSerializer
from .recaptcha import RecaptchaUnavailable, verify_recaptcha

logger = logging.getLogger(__name__)

# Name of the hidden honeypot field the public forms render. Real visitors
# never see it and spam bots autofill every field, so a non-empty value is a
# strong bot signal, but not a certain one: a browser or password manager can
# fill it for a real visitor.
HONEYPOT_FIELD = 'website'
MAX_LEAD_BODY_BYTES = 64 * 1024


def _meta_cookie(value, *, browser_id=False):
    """Discard malformed identifiers, rather than truncate their identity."""
    suffix = r'[0-9]+' if browser_id else r'[A-Za-z0-9_-]+'
    if len(value) <= 255 and re.fullmatch(r'fb\.[0-9]+\.[0-9]+\.' + suffix, value):
        return value
    return ''


def _save_if_trapped(request, serializer):
    """Save a submission whose honeypot is filled, flagged, and send nothing for it.

    Returns whether it did. Saved rather than discarded because the visitor sees
    the thank-you page either way, so discarding a real enquiry would lose it with
    nobody aware of it. No emails, because the address may not be the sender's,
    and nothing to Meta, because this may not be a lead at all.

    This runs after reCAPTCHA and validation, and the reply is the same as for any
    other submission. A bot posting directly has no token and is turned away before
    anything is saved, and whatever gets this far cannot tell it was caught.
    """
    if not str(request.data.get(HONEYPOT_FIELD, '')).strip():
        return False
    record = serializer.save(is_spam=True)
    logger.warning('Spam trap filled: %s #%s saved as spam, nothing sent', type(record).__name__, record.pk)
    return True


class RecaptchaCreateMixin:
    """Reject automated submissions before validation, saving, or email."""

    recaptcha_action = None

    def create(self, request, *args, **kwargs):
        # Bound the whole payload before parsing or making outbound calls.
        if len(request.body) > MAX_LEAD_BODY_BYTES:
            error = APIException('Submission is too large. Please shorten your message.')
            error.status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            raise error
        try:
            valid = verify_recaptcha(
                request.data.get('recaptcha_token'),
                action=self.recaptcha_action,
                remote_ip=get_client_ip(request),
            )
        except RecaptchaUnavailable as exc:
            error = APIException('Spam protection is temporarily unavailable. Please try again.')
            error.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            raise error from exc
        if not valid:
            raise ValidationError({
                'recaptcha_token': 'Spam protection could not verify this request. Please try again.'
            })
        return super().create(request, *args, **kwargs)


def _report_conversion(request, record, *, form_name, source, email, phone, **names):
    """Send the server-side copy of this conversion to Meta.

    Best-effort, like the notification emails: the lead is already saved, and
    no analytics failure is worth turning a captured lead into a 500. capi.py
    swallows its own errors; the result is recorded so a broken access token is
    visible in the admin rather than only in the log.

    `source` is passed in rather than read from the record because the two do
    not always agree: the catalog form is stored with source='catalog_request'
    but reports itself to the pixel as 'catalog_modal'. Both copies of one
    conversion must describe themselves identically, or Events Manager shows
    the same form under two names depending on which copy arrived first.

    fbc/fbp arrive as first-party cookies, but are still untrusted client input.
    Validate their format and storage length before forwarding or saving them.
    """
    fbc = _meta_cookie(request.COOKIES.get('_fbc', ''))
    fbp = _meta_cookie(request.COOKIES.get('_fbp', ''), browser_id=True)

    # Rebuild Meta's click parameter from the ad URL when the cookie is absent.
    #
    # The pixel normally writes _fbc on arrival, but it is not loaded until the
    # cookie banner is accepted, and an ad blocker may stop it entirely — so
    # the visitor most worth matching, the one who just clicked an ad, is
    # exactly the one whose cookie may be missing. fbclid survives in the URL
    # either way, and `fb.1.<ms>.<fbclid>` is the format Meta documents for
    # constructing it.
    if not fbc and record.fbclid:
        fbc = _meta_cookie('fb.1.%d.%s' % (int(time.time() * 1000), record.fbclid))

    # Recorded whatever happens to the send. fbc in particular is the only
    # durable record that this lead came from a Meta ad, and it is needed long
    # after this request to report back whether the lead became a customer.
    record.fbc = fbc
    record.fbp = fbp

    # Consent. The browser pixel is not even loaded until the banner is
    # accepted; sending the same conversion from the server regardless would
    # defeat that entirely — same personal data, same recipient, different
    # door. The attribution above is still recorded, because that is our own
    # note about our own enquiry and goes nowhere.
    if not record.marketing_consent:
        record.save(update_fields=['fbc', 'fbp'])
        return

    if not record.event_id:
        # No id means the browser never minted one — an old cached bundle, or a
        # client that is not our form. Sending anyway would risk Meta counting
        # this conversion twice, once per path, with nothing tying them
        # together, so keep the attribution and skip the send.
        record.save(update_fields=['fbc', 'fbp'])
        return

    user_data = build_user_data(
        email=email,
        phone=phone,
        client_ip=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        fbc=fbc,
        fbp=fbp,
        **names,
    )
    record.capi_sent = send_lead_event(
        form_name=form_name,
        source=source,
        event_id=record.event_id,
        user_data=user_data,
        # The page the form was submitted from. Meta uses it for attribution,
        # and the Referer is the only server-side witness to it.
        event_source_url=request.META.get('HTTP_REFERER', ''),
    )
    record.save(update_fields=['fbc', 'fbp', 'capi_sent'])


class LeadCreateView(RecaptchaCreateMixin, generics.CreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'leads'
    recaptcha_action = 'lead_submit'

    def perform_create(self, serializer):
        if _save_if_trapped(self.request, serializer):
            return
        lead = serializer.save()
        # Confirm to the visitor — in their language by IP, like the sample
        # form, and subject to the same limits (leads/emails.py) — then notify
        # sales of every captured lead. Email sending is best-effort — a mail
        # failure can't roll back the lead we just saved — but the outcome is
        # recorded so an undelivered notification is visible in the admin
        # rather than only in the log.
        lang = email_lang_for_ip(get_client_ip(self.request))
        lead.sales_notified = send_lead_confirmation(lead, lang=lang)
        lead.save(update_fields=['sales_notified'])
        # 'hero_lead' matches the formName the pixel sends for this form, so
        # both copies of the conversion describe themselves identically.
        _report_conversion(
            self.request,
            lead,
            form_name='hero_lead',
            source=lead.source,
            email=lead.email,
            phone=lead.phone,
            first_name=lead.first_name,
            last_name=lead.last_name,
        )


class SampleRequestCreateView(RecaptchaCreateMixin, generics.CreateAPIView):
    queryset = SampleRequest.objects.all()
    serializer_class = SampleRequestSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'leads'
    recaptcha_action = 'sample_request_submit'

    def perform_create(self, serializer):
        if _save_if_trapped(self.request, serializer):
            return
        sample_request = serializer.save()
        # Localize the customer email by visitor IP: Kosovo/Albania -> Albanian,
        # Germany -> German, everyone else -> English.
        lang = email_lang_for_ip(get_client_ip(self.request))
        # Catalog requests get the PDF emailed instantly; all other sample/
        # contact requests get a thank-you — unless a repeat or the daily limit
        # holds it back (leads/emails.py). Both always alert sales, saying
        # whether the visitor's email went out. Best-effort.
        if sample_request.source == 'catalog_request':
            notified = send_catalog_email(sample_request, lang=lang)
        else:
            notified = send_sample_confirmation(sample_request, lang=lang)
        sample_request.sales_notified = bool(notified)
        sample_request.save(update_fields=['sales_notified'])
        _report_conversion(
            self.request,
            sample_request,
            form_name=(
                'catalog_request'
                if sample_request.source == 'catalog_request'
                else 'sample_request'
            ),
            source=(
                'catalog_modal'
                if sample_request.source == 'catalog_request'
                else sample_request.source
            ),
            email=sample_request.email,
            phone=sample_request.phone,
            full_name=sample_request.contact_name,
        )
