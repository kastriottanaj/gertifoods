from django.urls import path

from .views import LeadCreateView, SampleRequestCreateView

urlpatterns = [
    path(
        'lead/',
        LeadCreateView.as_view(),
        name='lead-create',
    ),
    path(
        'sample-request/',
        SampleRequestCreateView.as_view(),
        name='sample-request',
    ),
]
