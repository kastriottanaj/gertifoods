from rest_framework import viewsets, permissions, filters
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    # Only surface categories that still have something to sell, so a
    # discontinued line disappears from the filters as soon as its products
    # are marked unavailable.
    queryset = Category.objects.filter(products__is_available=True).distinct()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_available=True).select_related('category')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category__name']
    # Not 'price': sorting by it would leak the price order even though the
    # field itself is no longer served. DRF ignores unlisted orderings.
    ordering_fields = ['name', 'created_at']
