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
            'recaptcha_token',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data.pop('recaptcha_token', None)
        return super().create(validated_data)
