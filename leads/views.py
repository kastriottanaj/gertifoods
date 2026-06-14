from rest_framework import generics, permissions
from rest_framework.throttling import ScopedRateThrottle

from .emails import send_catalog_email
from .models import Lead, SampleRequest
from .serializers import LeadSerializer, SampleRequestSerializer


class LeadCreateView(generics.CreateAPIView):
    """
    Public endpoint for the inline hero lead form. 5-field minimum-friction
    capture (first name, last name, email, phone, message). Feeds into the
    Straight Line funnel ahead of the richer SampleRequest form.
    """

    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'leads'


class SampleRequestCreateView(generics.CreateAPIView):
    """
    Public endpoint for the Straight Line "opt-in bribe":
    anonymous prospects submit this form to request free product samples
    and the wholesale price list. No auth required — this sits at the top
    of the funnel, before account creation and approval.
    """

    queryset = SampleRequest.objects.all()
    serializer_class = SampleRequestSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'leads'

    def perform_create(self, serializer):
        sample_request = serializer.save()
        # Catalog-download requests get the PDF emailed instantly. Email
        # sending is best-effort: send_catalog_email never raises, so a mail
        # failure can't roll back the lead we just captured.
        if sample_request.source == 'catalog_request':
            send_catalog_email(sample_request)
