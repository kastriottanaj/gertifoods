import time

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.throttling import ScopedRateThrottle

from .emails import (
    send_catalog_email,
    send_sample_confirmation,
    notify_sales_lead,
)
from .capi import build_user_data, send_lead_event
from .geo import get_client_ip, email_lang_for_ip
from .models import Lead, SampleRequest
from .serializers import LeadSerializer, SampleRequestSerializer
from .recaptcha import RecaptchaUnavailable, verify_recaptcha

# Name of the hidden honeypot field the public forms render. Real visitors
# never see it; spam bots autofill every field, so a non-empty value is a
# reliable bot signal.
HONEYPOT_FIELD = 'website'


class HoneypotCreateMixin:
    """Silently drop submissions whose honeypot field is filled.

    Returns a normal-looking 201 without saving anything or sending email, so a
    bot can't distinguish a dropped submission from a real one and won't adapt.
    """

    def create(self, request, *args, **kwargs):
        if str(request.data.get(HONEYPOT_FIELD, '')).strip():
            return Response(status=status.HTTP_201_CREATED)
        return super().create(request, *args, **kwargs)


class RecaptchaCreateMixin:
    """Reject automated submissions before validation, saving, or email."""

    recaptcha_action = None

    def create(self, request, *args, **kwargs):
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

    fbc/fbp come from the request cookies rather than the posted payload. The
    pixel sets them as first-party cookies on this domain, so they arrive with
    the form POST for free — and reading them here means they cannot be forged
    by whatever posted the form.
    """
    fbc = request.COOKIES.get('_fbc', '')
    fbp = request.COOKIES.get('_fbp', '')

    # Rebuild Meta's click parameter from the ad URL when the cookie is absent.
    #
    # The pixel normally writes _fbc on arrival, but it is not loaded until the
    # cookie banner is accepted, and an ad blocker may stop it entirely — so
    # the visitor most worth matching, the one who just clicked an ad, is
    # exactly the one whose cookie may be missing. fbclid survives in the URL
    # either way, and `fb.1.<ms>.<fbclid>` is the format Meta documents for
    # constructing it.
    if not fbc and record.fbclid:
        fbc = 'fb.1.%d.%s' % (int(time.time() * 1000), record.fbclid)

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


class LeadCreateView(HoneypotCreateMixin, RecaptchaCreateMixin, generics.CreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'leads'
    recaptcha_action = 'lead_submit'

    def perform_create(self, serializer):
        lead = serializer.save()
        # Notify sales of every captured lead. Email sending is best-effort —
        # a mail failure can't roll back the lead we just saved — but the
        # outcome is recorded so an undelivered notification is visible in the
        # admin rather than only in the log.
        lead.sales_notified = notify_sales_lead(lead)
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


class SampleRequestCreateView(HoneypotCreateMixin, RecaptchaCreateMixin, generics.CreateAPIView):
    queryset = SampleRequest.objects.all()
    serializer_class = SampleRequestSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'leads'
    recaptcha_action = 'sample_request_submit'

    def perform_create(self, serializer):
        sample_request = serializer.save()
        # Localize the customer email by visitor IP: Kosovo/Albania -> Albanian,
        # Germany -> German, everyone else -> English.
        lang = email_lang_for_ip(get_client_ip(self.request))
        # Catalog requests get the PDF emailed instantly; all other sample/
        # contact requests get a thank-you. Both also alert sales. Best-effort.
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
