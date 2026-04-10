from rest_framework import viewsets, permissions
from .models import Order
from .serializers import OrderSerializer


class IsApprovedBusiness(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_approved


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsApprovedBusiness]
    http_method_names = ['get', 'post', 'head']

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
