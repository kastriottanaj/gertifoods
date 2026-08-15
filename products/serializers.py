from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_width = serializers.SerializerMethodField()
    image_height = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'unit',
            'min_order_quantity', 'image', 'image_width', 'image_height',
            'is_available', 'category', 'category_name',
        ]

    # The frontend puts these on the <img> as width/height so the browser can
    # reserve the right box before the image arrives — without them the product
    # grid reflows as each one loads (Cumulative Layout Shift). They are the
    # image's native pixel size, not the size it is displayed at; CSS still
    # decides that.
    #
    # Pillow reads them off the file, so both failure modes have to be handled:
    # a product with no image at all raises ValueError, and one whose row points
    # at a file that is not on disk raises OSError. Neither should break the
    # catalogue — the frontend omits the attributes when these come back null.
    def _dimension(self, product, attribute):
        try:
            return getattr(product.image, attribute)
        except (ValueError, OSError):
            return None

    def get_image_width(self, product):
        return self._dimension(product, 'width')

    def get_image_height(self, product):
        return self._dimension(product, 'height')
