from django.contrib.sitemaps import Sitemap
from django.utils.functional import cached_property

from config.source_lastmod import last_commit
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


ASTRO = 'frontend/astro'


def page_sources(name, view):
    """
    The files that decide what a static route renders: its view, and the two
    thin page templates that mount that view at the unprefixed and the /<lang>
    address. Shared machinery (BaseLayout, i18n.js) is deliberately left out —
    a change there does touch the HTML of every page, but lastmod is meant to
    report a change to *this page's content*, and a sitemap where all dates
    move together tells a crawler nothing.
    """
    return (
        f'{ASTRO}/views/{view}',
        f'{ASTRO}/pages/{name}.astro',
        f'{ASTRO}/pages/[lang]/{name}.astro',
    )


# Frontend (Astro) routes that aren't backed by a DB model. 'keys' is the
# prefix this page's copy carries in frontend/src/i18n/translations.js, so an
# edit to the text alone still dates the page (see config/source_lastmod.py).
PAGE_ROUTES = {
    '/': {
        'changefreq': 'weekly',
        'priority': 1.0,
        'sources': page_sources('index', 'Home.astro'),
        'keys': 'home',
    },
    '/products': {
        'changefreq': 'weekly',
        'priority': 0.9,
        'sources': page_sources('products', 'Products.astro'),
        'keys': 'products',
    },
    # A hand-built landing page, not a catalogue row: the tortilla line has no
    # Product in the database yet (see products/management/commands/
    # populate_products.py), so ProductSitemap below cannot emit this URL and
    # it is declared here instead. Move it to ProductSitemap if the line is
    # ever seeded, so the two don't both claim it.
    '/products/tortilla': {
        'changefreq': 'monthly',
        'priority': 0.8,
        'sources': page_sources('products/tortilla', 'TortillaDetail.astro'),
        'keys': 'tt',
    },
    '/about': {
        'changefreq': 'monthly',
        'priority': 0.7,
        'sources': page_sources('about', 'About.astro'),
        'keys': 'about',
    },
    '/areas': {
        'changefreq': 'monthly',
        'priority': 0.8,
        'sources': page_sources('areas', 'Areas.astro'),
        'keys': 'areas',
    },
    '/imprint': {
        'changefreq': 'yearly',
        'priority': 0.3,
        'sources': page_sources('imprint', 'Imprint.astro'),
        'keys': 'imprint',
    },
    '/blog': {
        'changefreq': 'weekly',
        'priority': 0.8,
        'sources': page_sources('blog', 'Blog.astro'),
        'keys': 'blog',
    },
}

# Areas are defined in the frontend (src/data/areas.js); keep this list in sync.
AREA_SLUGS = ['kosovo', 'albania', 'hungary', 'croatia', 'slovakia', 'germany']

# One template renders all six area pages, so they share these sources and are
# told apart only by their translation keys (kosovo_*, albania_*, ...).
AREA_SOURCES = (
    f'{ASTRO}/views/AreaDetail.astro',
    f'{ASTRO}/pages/areas/[slug].astro',
    f'{ASTRO}/pages/[lang]/areas/[slug].astro',
    'frontend/src/data/areas.js',
)

# Published posts are stored in frontend/src/data/blogPosts.js; keep slugs and
# publication dates synchronized until blog content moves to a shared CMS/API.
BLOG_POSTS = {
    'how-half-baked-products-help-businesses': '2026-08-04',
    'choosing-reliable-food-supplier': '2026-07-22',
    'reduce-food-waste-with-bake-on-demand': '2026-07-08',
}


class LocalizedSitemap(Sitemap):
    """
    Emits one <url> per language edition of a page: /about, /en/about, /de/about.

    The reciprocal hreflang set for those editions is declared once, in each
    page's own <head> (frontend/astro/layouts/BaseLayout.astro). It used to be
    repeated here as xhtml:link alternates, which Google accepts equally, but
    the duplicate cost more than it bought: a sitemap containing elements in
    the XHTML namespace switches off Chrome's XML viewer — the browser assumes
    it may be renderable markup and renders it, collapsing the whole file into
    one unreadable line of text. One declaration in the <head> is the signal;
    this file stays inspectable.

    Django's built-in i18n sitemap support is deliberately not used either. It
    derives URLs by activating a language around reverse(), which assumes
    i18n_patterns. These are static frontend paths, and Albanian is served
    unprefixed at the root, so the addresses are built here instead.
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

    def lastmod(self, item):
        path, _lang = item
        route = PAGE_ROUTES[path]
        return last_commit(route['sources'], route['keys'])


class AreaSitemap(LocalizedSitemap):
    changefreq = 'monthly'
    priority = 0.7

    def paths(self):
        return [f'/areas/{slug}' for slug in AREA_SLUGS]

    def lastmod(self, item):
        path, _lang = item
        return last_commit(AREA_SOURCES, path.rsplit('/', 1)[1])


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


# The section name -> sitemap mapping behind /sitemap.xml. It lives here rather
# than in config/urls.py so `manage.py ping_indexnow` can submit exactly the
# URLs the sitemap advertises without importing the URLConf (and without a
# second copy of this list that would quietly drift out of sync).
SITEMAPS = {
    'pages': PageSitemap,
    'areas-we-serve': AreaSitemap,
    'products': ProductSitemap,
    'blog': BlogSitemap,
}
