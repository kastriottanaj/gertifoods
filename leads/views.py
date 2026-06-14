from rest_framework import generics, permissions
from rest_framework.throttling import ScopedRateThrottle

from .emails import (
    send_catalog_email,
    send_sample_confirmation,
    notify_sales_lead,
)
from .geo import get_client_ip, email_lang_for_ip
from .models import Lead, SampleRequest
from .serializers import LeadSerializer, SampleRequestSerializer


class LeadCreateView(generics.CreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'leads'

    def perform_create(self, serializer):
        lead = serializer.save()
        # Notify sales of every captured lead. Email sending is best-effort —
        # a mail failure can't roll back the lead we just saved.
        notify_sales_lead(lead)


class SampleRequestCreateView(generics.CreateAPIView):
    queryset = SampleRequest.objects.all()
    serializer_class = SampleRequestSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'leads'

    def perform_create(self, serializer):
        sample_request = serializer.save()
        # Localize the customer email by visitor IP: Kosovo/Albania -> Albanian,
        # Germany -> German, everyone else -> English.
        lang = email_lang_for_ip(get_client_ip(self.request))
        # Catalog requests get the PDF emailed instantly; all other sample/
        # contact requests get a thank-you. Both also alert sales. Best-effort.
        if sample_request.source == 'catalog_request':
            send_catalog_email(sample_request, lang=lang)
        else:
            send_sample_confirmation(sample_request, lang=lang)
