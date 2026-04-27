from rest_framework import generics, permissions

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
