import re
from datetime import datetime
from xml.etree import ElementTree

from django.conf import settings
from django.test import SimpleTestCase, TestCase

from config.sitemaps import (
    AREA_SLUGS,
    AREA_SOURCES,
    BLOG_POSTS,
    DEFAULT_LANG,
    PAGE_ROUTES,
    SUPPORTED_LANGS,
    locale_path,
)
from config.source_lastmod import TRANSLATIONS
from products.models import Category, Product

PRIVATE_PATHS = ('/cart', '/orders', '/login', '/register', '/profile')
SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'


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

    def test_every_page_appears_once_per_language(self):
        xml = self.client.get('/sitemap-pages.xml', secure=True).content.decode()

        blocks = re.findall(r'<url>(.*?)</url>', xml, re.S)
        self.assertEqual(len(blocks), len(PAGE_ROUTES) * len(SUPPORTED_LANGS))

    def test_no_url_carries_elements_outside_the_sitemap_namespace(self):
        """
        Guards the reason hreflang lives in the page <head> instead of here: a
        single element in the XHTML namespace turns off Chrome's XML viewer,
        which then renders the whole sitemap as one line of run-together text.
        """
        for section in ('pages', 'areas-we-serve', 'blog'):
            with self.subTest(section=section):
                xml = self.client.get(f'/sitemap-{section}.xml', secure=True).content
                root = ElementTree.fromstring(xml)
                namespaces = {
                    element.tag.partition('}')[0].lstrip('{')
                    for element in root.iter()
                }
                self.assertEqual(namespaces, {SITEMAP_NS})

    def test_pages_and_areas_carry_a_parseable_lastmod(self):
        for section in ('pages', 'areas-we-serve'):
            with self.subTest(section=section):
                xml = self.client.get(f'/sitemap-{section}.xml', secure=True).content
                root = ElementTree.fromstring(xml)
                urls = root.findall(f'{{{SITEMAP_NS}}}url')
                self.assertTrue(urls)
                for url in urls:
                    lastmod = url.find(f'{{{SITEMAP_NS}}}lastmod')
                    loc = url.find(f'{{{SITEMAP_NS}}}loc').text
                    self.assertIsNotNone(lastmod, f'{loc} has no lastmod')
                    # Raises if it isn't a W3C date/datetime Google will accept.
                    datetime.fromisoformat(lastmod.text)

    def test_unknown_sitemap_category_returns_404(self):
        response = self.client.get('/sitemap-news.xml', secure=True)

        self.assertEqual(response.status_code, 404)


class ProductSitemapTests(TestCase):
    def test_available_product_is_listed_in_every_language(self):
        category = Category.objects.create(name='Family Pack', slug='family-pack')
        Product.objects.create(
            category=category,
            name='Family Pack',
            slug='family-pack-pite-4',
            price='5.20',
            unit='pack',
            min_order_quantity=12,
            is_available=True,
        )

        response = self.client.get('/sitemap-products.xml', secure=True)
        self.assertEqual(response.status_code, 200)
        xml = response.content.decode()
        path = '/products/family-pack-pite-4'

        for lang in SUPPORTED_LANGS:
            self.assertIn(f'<loc>https://testserver{locale_path(lang, path)}</loc>', xml)

    def test_unavailable_product_is_not_indexed(self):
        category = Category.objects.create(name='Retired', slug='retired')
        Product.objects.create(
            category=category,
            name='Retired Product',
            slug='retired-product',
            price='1.00',
            is_available=False,
        )

        xml = self.client.get('/sitemap-products.xml', secure=True).content.decode()
        self.assertNotIn('/products/retired-product', xml)


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


class LastmodSourceTests(SimpleTestCase):
    """
    lastmod is only as good as the files it is read from, and a mistyped path
    fails silently — git simply reports nothing and the URL loses its date.
    These tests turn that silence into a failing build.
    """

    def sources(self):
        yield from ((path, route['sources']) for path, route in PAGE_ROUTES.items())
        yield ('/areas/<slug>', AREA_SOURCES)

    def test_every_declared_source_file_exists(self):
        for route, paths in self.sources():
            for path in paths:
                with self.subTest(route=route, path=path):
                    self.assertTrue(
                        (settings.BASE_DIR / path).exists(),
                        f'{route} claims a source that no longer exists: {path}',
                    )

    def test_every_route_owns_translation_keys_under_its_prefix(self):
        """
        The prefixes ('about' -> about_title, about_meta, ...) are what let a
        copy-only edit date the one page it changed. A renamed key block would
        otherwise leave that page frozen at its template's date.
        """
        copy = (settings.BASE_DIR / TRANSLATIONS).read_text(encoding='utf-8')
        prefixes = [route['keys'] for route in PAGE_ROUTES.values()] + AREA_SLUGS

        for prefix in prefixes:
            with self.subTest(prefix=prefix):
                self.assertRegex(
                    copy,
                    re.compile(rf'^\s+{prefix}_\w+:', re.M),
                    f'no {prefix}_* keys in {TRANSLATIONS}',
                )

    def test_pages_still_declare_hreflang_in_their_head(self):
        """
        The sitemap no longer repeats the language alternates, so the <head> is
        the only place Google learns the three editions belong together.
        """
        layout = (
            settings.BASE_DIR / 'frontend' / 'astro' / 'layouts' / 'BaseLayout.astro'
        ).read_text(encoding='utf-8')

        self.assertIn('rel="alternate" hreflang={code}', layout)
        self.assertIn('hreflang="x-default"', layout)
