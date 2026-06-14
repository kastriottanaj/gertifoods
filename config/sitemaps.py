from django.contrib.sitemaps import Sitemap

from products.models import Product

# Frontend (React Router) routes that aren't backed by a DB model.
STATIC_ROUTES = ['/', '/products', '/about', '/areas', '/imprint']

# Areas are defined in the frontend (src/data/areas.js); keep this list in sync.
AREA_SLUGS = ['kosovo', 'albania', 'hungary', 'croatia', 'slovakia', 'germany']


class StaticViewSitemap(Sitemap):
    protocol = 'https'
    changefreq = 'weekly'

    def items(self):
        return STATIC_ROUTES

    def location(self, item):
        return item

    def priority(self, item):
        return 1.0 if item == '/' else 0.7


class AreaSitemap(Sitemap):
    protocol = 'https'
    changefreq = 'monthly'
    priority = 0.6

    def items(self):
        return AREA_SLUGS

    def location(self, slug):
        return f'/areas/{slug}'


class ProductSitemap(Sitemap):
    protocol = 'https'
    changefreq = 'monthly'
    priority = 0.8

    def items(self):
        return Product.objects.filter(is_available=True)

    def location(self, obj):
        return f'/products/{obj.slug}'

    def lastmod(self, obj):
        return obj.updated_at
