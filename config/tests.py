import re

from django.conf import settings
from django.test import SimpleTestCase, TestCase

from config.sitemaps import (
    AREA_SLUGS,
    BLOG_POSTS,
    DEFAULT_LANG,
    PAGE_ROUTES,
    SUPPORTED_LANGS,
    locale_path,
)

PRIVATE_PATHS = ('/cart', '/orders', '/login', '/register', '/profile')


def locs(xml):
    return re.findall(r'<loc>([^<]*)</loc>', xml)


class SitemapIndexTests(TestCase):
    """
    Needs the database: the index view reads site.paginator.num_pages for every
    section, which counts the product queryset.
    """

    def test_sitemap_index_splits_public_content_by_category(self):
        response = self.client.get('/sitemap.xml', secure=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/xml')
        xml = response.content.decode()
        self.assertIn('<sitemapindex', xml)
        for section in ('pages', 'products', 'areas-we-serve', 'blog'):
            self.assertIn(f'https://testserver/sitemap-{section}.xml', xml)


class SitemapTests(SimpleTestCase):
    def test_pages_sitemap_lists_every_page_in_every_language(self):
        xml = self.client.get('/sitemap-pages.xml', secure=True).content.decode()

        for path in PAGE_ROUTES:
            for lang in SUPPORTED_LANGS:
                self.assertIn(
                    f'<loc>https://testserver{locale_path(lang, path)}</loc>', xml
                )

    def test_pages_sitemap_excludes_account_pages(self):
        xml = self.client.get('/sitemap-pages.xml', secure=True).content.decode()

        for path in PRIVATE_PATHS:
            for lang in SUPPORTED_LANGS:
                self.assertNotIn(
                    f'<loc>https://testserver{locale_path(lang, path)}</loc>', xml
                )

    def test_areas_sitemap_lists_every_area_in_every_language(self):
        xml = self.client.get('/sitemap-areas-we-serve.xml', secure=True).content.decode()

        for slug in AREA_SLUGS:
            for lang in SUPPORTED_LANGS:
                self.assertIn(
                    f'<loc>https://testserver{locale_path(lang, f"/areas/{slug}")}</loc>',
                    xml,
                )

    def test_blog_sitemap_lists_every_post_in_every_language(self):
        xml = self.client.get('/sitemap-blog.xml', secure=True).content.decode()

        for slug in BLOG_POSTS:
            for lang in SUPPORTED_LANGS:
                self.assertIn(
                    f'<loc>https://testserver{locale_path(lang, f"/blog/{slug}")}</loc>',
                    xml,
                )

    def test_default_language_urls_are_unprefixed(self):
        """Albanian is served at the root, so no /sq/ URL may ever be emitted."""
        xml = self.client.get('/sitemap-pages.xml', secure=True).content.decode()

        self.assertNotIn('/sq/', xml)
        self.assertIn('<loc>https://testserver/</loc>', xml)

    def test_every_url_declares_all_language_alternates(self):
        """
        Each entry must list all three editions plus x-default. Without the
        reciprocal set, Google treats the editions as competing duplicates
        rather than alternates.
        """
        xml = self.client.get('/sitemap-pages.xml', secure=True).content.decode()

        blocks = re.findall(r'<url>(.*?)</url>', xml, re.S)
        self.assertEqual(len(blocks), len(PAGE_ROUTES) * len(SUPPORTED_LANGS))
        for block in blocks:
            hreflangs = re.findall(r'hreflang="([a-z-]+)"', block)
            self.assertCountEqual(hreflangs, [*SUPPORTED_LANGS, 'x-default'])

    def test_x_default_points_at_the_default_language(self):
        xml = self.client.get('/sitemap-pages.xml', secure=True).content.decode()

        block = re.search(r'<url>(.*?)</url>', xml, re.S).group(1)
        x_default = re.search(r'hreflang="x-default" href="([^"]+)"', block).group(1)
        sq = re.search(r'hreflang="sq" href="([^"]+)"', block).group(1)
        self.assertEqual(x_default, sq)

    def test_unknown_sitemap_category_returns_404(self):
        response = self.client.get('/sitemap-news.xml', secure=True)

        self.assertEqual(response.status_code, 404)


class SitemapSourceDriftTests(SimpleTestCase):
    """
    The area and blog slugs are duplicated: the frontend builds pages from
    src/data/*.js, and this sitemap lists them from hardcoded constants. Nothing
    enforces that at build time, so a post added to the frontend would quietly
    ship a page no sitemap points at. These tests are that enforcement.
    """

    DATA_DIR = settings.BASE_DIR / 'frontend' / 'src' / 'data'

    def slugs_in(self, filename):
        source = (self.DATA_DIR / filename).read_text(encoding='utf-8')
        return set(re.findall(r"slug:\s*'([^']+)'", source))

    def test_area_slugs_match_the_frontend_data(self):
        self.assertEqual(
            set(AREA_SLUGS),
            self.slugs_in('areas.js'),
            'config/sitemaps.py AREA_SLUGS has drifted from frontend/src/data/areas.js',
        )

    def test_blog_slugs_match_the_frontend_data(self):
        self.assertEqual(
            set(BLOG_POSTS),
            self.slugs_in('blogPosts.js'),
            'config/sitemaps.py BLOG_POSTS has drifted from '
            'frontend/src/data/blogPosts.js',
        )

    def test_default_lang_is_in_supported_langs(self):
        self.assertIn(DEFAULT_LANG, SUPPORTED_LANGS)
