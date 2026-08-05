from django.contrib.sitemaps import Sitemap
from django.utils.functional import cached_property

from products.models import Product

# Languages the frontend is built in. Albanian is the default edition and stays
# unprefixed, so every URL that existed before the Astro migration keeps its
# exact address; English and German live under /en/ and /de/.
#
# Keep in sync with frontend/astro/lib/i18n.js.
SUPPORTED_LANGS = ['sq', 'en', 'de']
DEFAULT_LANG = 'sq'


def locale_path(lang, path):
    """Mirror of localePath() in frontend/astro/lib/i18n.js."""
    if lang == DEFAULT_LANG:
        return path
    return f'/{lang}' if path == '/' else f'/{lang}{path}'


# Frontend (Astro) routes that aren't backed by a DB model.
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


class LocalizedSitemap(Sitemap):
    """
    Emits one <url> per language edition of a page, each carrying reciprocal
    xhtml:link alternates plus x-default — the same relationships the pages
    declare in their own <head> (see frontend/astro/layouts/BaseLayout.astro).

    Django's built-in i18n sitemap support is deliberately not used. It derives
    URLs by activating a language around reverse(), which assumes i18n_patterns,
    and its x-default handling assumes the default language is prefixed too
    (it rewrites "/<lang>/" to "/"). Neither holds here: these are static
    frontend paths, and Albanian is served unprefixed at the root. Building the
    alternates explicitly is shorter than bending that machinery, and keeps the
    XML and the HTML saying exactly the same thing.
    """

    protocol = 'https'

    def paths(self):
        """Language-neutral paths, e.g. ['/about']. Subclasses provide these."""
        raise NotImplementedError

    def items(self):
        return [(path, lang) for path in self.paths() for lang in SUPPORTED_LANGS]

    def location(self, item):
        path, lang = item
        return locale_path(lang, path)

    def _urls(self, page, protocol, domain):
        urls = super()._urls(page, protocol, domain)
        for url_info in urls:
            path, _lang = url_info['item']
            alternates = [
                {
                    'lang_code': lang,
                    'location': f'{protocol}://{domain}{locale_path(lang, path)}',
                }
                for lang in SUPPORTED_LANGS
            ]
            alternates.append(
                {
                    'lang_code': 'x-default',
                    'location': f'{protocol}://{domain}{locale_path(DEFAULT_LANG, path)}',
                }
            )
            url_info['alternates'] = alternates
        return urls


class PageSitemap(LocalizedSitemap):
    def paths(self):
        # Django's sitemap paginator slices this collection, so return a list
        # rather than dict_keys (which is iterable but not subscriptable).
        return list(PAGE_ROUTES)

    def priority(self, item):
        path, _lang = item
        return PAGE_ROUTES[path]['priority']

    def changefreq(self, item):
        path, _lang = item
        return PAGE_ROUTES[path]['changefreq']


class AreaSitemap(LocalizedSitemap):
    changefreq = 'monthly'
    priority = 0.7

    def paths(self):
        return [f'/areas/{slug}' for slug in AREA_SLUGS]


class BlogSitemap(LocalizedSitemap):
    changefreq = 'monthly'
    priority = 0.7

    def paths(self):
        return [f'/blog/{slug}' for slug in BLOG_POSTS]

    def lastmod(self, item):
        from datetime import date

        path, _lang = item
        return date.fromisoformat(BLOG_POSTS[path.rsplit('/', 1)[1]])


class ProductSitemap(LocalizedSitemap):
    changefreq = 'weekly'
    priority = 0.8

    @cached_property
    def _products(self):
        # Cached per instance so expanding each product across three languages
        # doesn't re-query per URL, but lazy rather than done in __init__: the
        # sitemap index view instantiates every sitemap class just to read
        # get_latest_lastmod(), and querying from a constructor would make
        # merely building the index hit the database.
        return {
            f'/products/{product.slug}': product
            for product in Product.objects.filter(is_available=True)
        }

    def paths(self):
        return list(self._products)

    def lastmod(self, item):
        path, _lang = item
        return self._products[path].updated_at
