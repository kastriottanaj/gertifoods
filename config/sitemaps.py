from django.contrib.sitemaps import Sitemap

from products.models import Product

# Frontend (React Router) routes that aren't backed by a DB model.
PAGE_ROUTES = {
    '/': {'changefreq': 'weekly', 'priority': 1.0},
    '/products': {'changefreq': 'weekly', 'priority': 0.9},
    '/about': {'changefreq': 'monthly', 'priority': 0.7},
    '/areas': {'changefreq': 'monthly', 'priority': 0.8},
    '/imprint': {'changefreq': 'yearly', 'priority': 0.3},
    '/blog': {'changefreq': 'weekly', 'priority': 0.8},
}

# Areas are defined in the frontend (src/data/areas.js); keep this list in sync.
AREA_SLUGS = ['kosovo', 'albania', 'hungary', 'croatia', 'slovakia', 'germany']

# Published posts are stored in frontend/src/data/blogPosts.js; keep slugs and
# publication dates synchronized until blog content moves to a shared CMS/API.
BLOG_POSTS = {
    'how-half-baked-products-help-businesses': '2026-08-04',
    'choosing-reliable-food-supplier': '2026-07-22',
    'reduce-food-waste-with-bake-on-demand': '2026-07-08',
}


class PageSitemap(Sitemap):
    protocol = 'https'

    def items(self):
        # Django's sitemap paginator slices this collection, so return a list
        # rather than dict_keys (which is iterable but not subscriptable).
        return list(PAGE_ROUTES)

    def location(self, item):
        return item

    def priority(self, item):
        return PAGE_ROUTES[item]['priority']

    def changefreq(self, item):
        return PAGE_ROUTES[item]['changefreq']


class AreaSitemap(Sitemap):
    protocol = 'https'
    changefreq = 'monthly'
    priority = 0.7

    def items(self):
        return AREA_SLUGS

    def location(self, slug):
        return f'/areas/{slug}'


class BlogSitemap(Sitemap):
    protocol = 'https'
    changefreq = 'monthly'
    priority = 0.7

    def items(self):
        return list(BLOG_POSTS)

    def location(self, slug):
        return f'/blog/{slug}'

    def lastmod(self, slug):
        from datetime import date

        return date.fromisoformat(BLOG_POSTS[slug])


class ProductSitemap(Sitemap):
    protocol = 'https'
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return Product.objects.filter(is_available=True)

    def location(self, obj):
        return f'/products/{obj.slug}'

    def lastmod(self, obj):
        return obj.updated_at
