from django.urls import path

from .views import SampleRequestCreateView

urlpatterns = [
    path(
        'sample-request/',
        SampleRequestCreateView.as_view(),
        name='sample-request',
    ),
]
