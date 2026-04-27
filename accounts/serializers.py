from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password',
            'company_name', 'business_id', 'phone', 'address', 'city', 'country',
        ]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'company_name',
            'business_id', 'phone', 'address', 'city', 'country',
            'is_approved', 'created_at',
        ]
        read_only_fields = ['is_approved', 'created_at']
