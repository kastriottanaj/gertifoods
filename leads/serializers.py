from rest_framework import serializers
from .models import Lead, SampleRequest


class LeadSerializer(serializers.ModelSerializer):
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
        ]
        read_only_fields = ['id']


class SampleRequestSerializer(serializers.ModelSerializer):
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
        ]
        read_only_fields = ['id']