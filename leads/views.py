from rest_framework import generics, permissions
from rest_framework.throttling import ScopedRateThrottle

from .emails import send_catalog_email
from .models import Lead, SampleRequest
from .serializers import LeadSerializer, SampleRequestSerializer


class LeadCreateView(generics.CreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'leads'


class SampleRequestCreateView(generics.CreateAPIView):
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
