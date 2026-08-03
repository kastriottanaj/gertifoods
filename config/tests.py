from unittest.mock import patch

from django.test import SimpleTestCase

from config.sitemaps import AREA_SLUGS, PAGE_ROUTES, ProductSitemap


class SitemapTests(SimpleTestCase):
    @patch.object(ProductSitemap, 'get_latest_lastmod', return_value=None)
    def test_sitemap_index_splits_public_content_by_category(self, _latest):
        response = self.client.get('/sitemap.xml', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/xml')
        xml = response.content.decode()
        self.assertIn('<sitemapindex', xml)
        self.assertIn('https://testserver/sitemap-pages.xml', xml)
        self.assertIn('https://testserver/sitemap-products.xml', xml)
        self.assertIn('https://testserver/sitemap-areas-we-serve.xml', xml)

    def test_pages_sitemap_contains_only_indexable_pages(self):
        response = self.client.get('/sitemap-pages.xml', secure=True)

        self.assertEqual(response.status_code, 200)
        xml = response.content.decode()
        for path in PAGE_ROUTES:
            self.assertIn(f'<loc>https://testserver{path}</loc>', xml)
        for private_path in ('/cart', '/orders', '/login', '/register', '/profile'):
            self.assertNotIn(f'<loc>https://testserver{private_path}</loc>', xml)

    def test_areas_sitemap_contains_every_supported_area(self):
        response = self.client.get('/sitemap-areas-we-serve.xml', secure=True)

        self.assertEqual(response.status_code, 200)
        xml = response.content.decode()
        for slug in AREA_SLUGS:
            self.assertIn(f'<loc>https://testserver/areas/{slug}</loc>', xml)

    def test_unknown_sitemap_category_returns_404(self):
        response = self.client.get('/sitemap-blog.xml', secure=True)

        self.assertEqual(response.status_code, 404)
