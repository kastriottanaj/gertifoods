"""Serializers for the public lead forms.

`event_id` is the one field here that the browser supplies purely for
analytics: it is minted before the form is posted and shared with the Meta
pixel, so the pixel's copy of the conversion and the one leads/capi.py sends
from the server deduplicate against each other. It identifies an event, not a
person, and a forged one can only collide with another event of the same name.

fbc/fbp are deliberately NOT accepted from the client — leads/views.py reads
them from the request cookies, where they cannot be supplied by hand.
"""

from rest_framework import serializers
from .models import Lead, SampleRequest


# The attribution columns, and the width of each in leads/models.py.
ATTRIBUTION_FIELDS = (
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'fbclid',
    'gclid',
    'landing_page',
    'referrer',
)
MAX_ATTRIBUTION_LENGTH = 255


class TruncatesAttributionMixin:
    """Clips over-long attribution values instead of rejecting the submission.

    A referrer URL has no practical length limit, and ad platforms append
    click ids of their own choosing. Validating these against the column width
    means a 300-character referrer answers 400 and the visitor is told their
    enquiry failed — losing a real lead over a field nobody will ever read in
    full. The frontend already clips to the same length; this is the guard for
    anything that does not, and a truncated referrer is still perfectly usable.
    """

    def to_internal_value(self, data):
        if hasattr(data, 'get'):
            data = data.copy()
            for name in ATTRIBUTION_FIELDS:
                value = data.get(name)
                if isinstance(value, str) and len(value) > MAX_ATTRIBUTION_LENGTH:
                    data[name] = value[:MAX_ATTRIBUTION_LENGTH]
        return super().to_internal_value(data)


class LeadSerializer(TruncatesAttributionMixin, serializers.ModelSerializer):
    recaptcha_token = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Lead
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'phone',
            'message',
            'source',
            'event_id',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_content',
            'utm_term',
            'fbclid',
            'gclid',
            'landing_page',
            'referrer',
            'marketing_consent',
            'recaptcha_token',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data.pop('recaptcha_token', None)
        return super().create(validated_data)


class SampleRequestSerializer(TruncatesAttributionMixin, serializers.ModelSerializer):
    recaptcha_token = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = SampleRequest
        fields = [
            'id',
            'company_name',
            'contact_name',
            'email',
            'phone',
            'city',
            'business_type',
            'products_interested',
            'message',
            'source',
            'event_id',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_content',
            'utm_term',
            'fbclid',
            'gclid',
            'landing_page',
            'referrer',
            'marketing_consent',
            'recaptcha_token',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data.pop('recaptcha_token', None)
        return super().create(validated_data)
