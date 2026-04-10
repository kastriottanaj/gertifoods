from rest_framework import serializers
from .models import SampleRequest


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