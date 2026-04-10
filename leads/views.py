from rest_framework import generics, permissions

from .models import SampleRequest
from .serializers import SampleRequestSerializer


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
