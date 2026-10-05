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


class LeadSerializer(serializers.ModelSerializer):
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
            'recaptcha_token',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data.pop('recaptcha_token', None)
        return super().create(validated_data)


class SampleRequestSerializer(serializers.ModelSerializer):
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
            'recaptcha_token',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data.pop('recaptcha_token', None)
        return super().create(validated_data)
