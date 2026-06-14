from django.db import transaction
from rest_framework import serializers
from products.models import Product
from .models import Order, OrderItem

MAX_ITEM_QUANTITY = 100_000


class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_available=True)
    )
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_ITEM_QUANTITY)
    product_name = serializers.CharField(source='product.name', read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'line_total']
        read_only_fields = ['unit_price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user_company = serializers.CharField(source='user.company_name', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'status', 'notes', 'total', 'items', 'user_company', 'created_at', 'updated_at']
        read_only_fields = ['status', 'total', 'created_at', 'updated_at']

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError('Order must contain at least one item.')
        for item in items:
            product = item['product']
            if item['quantity'] < product.min_order_quantity:
                raise serializers.ValidationError(
                    f'Minimum order quantity for {product.name} is '
                    f'{product.min_order_quantity} {product.unit}.'
                )
        return items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            product = item_data['product']
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item_data['quantity'],
                unit_price=product.price,
            )
        order.calculate_total()
        return order
