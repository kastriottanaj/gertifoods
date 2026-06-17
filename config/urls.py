from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.sitemaps.views import sitemap

from config.sitemaps import StaticViewSitemap, AreaSitemap, ProductSitemap

sitemaps = {
    'static': StaticViewSitemap,
    'areas': AreaSitemap,
    'products': ProductSitemap,
}

urlpatterns = [
    # Admin path is configurable (settings.ADMIN_URL) so production can hide it
    # behind a non-guessable URL. Listed first so it resolves before the
    # broader 'api/' includes when mounted under that prefix.
    path(settings.ADMIN_URL, admin.site.urls),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='sitemap'),
    path('api/accounts/', include('accounts.urls')),
    path('api/', include('products.urls')),
    path('api/', include('orders.urls')),
    path('api/leads/', include('leads.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
