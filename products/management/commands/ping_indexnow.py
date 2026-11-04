"""
Submit URLs to IndexNow so participating search engines recrawl them promptly.

Lives in the products app purely so Django finds it: command discovery walks
INSTALLED_APPS, and `config` is not an app. The command itself is site-wide.

What IndexNow buys us, stated plainly: Bing, Yandex, Seznam and Naver consume
it. **Google does not participate** — nothing here affects Google, which still
discovers changes by crawling the sitemap on its own schedule.

Usage:
    # Every page whose indexable content changed since the last submission.
    # Runs by itself as the last step of `npm run build` when
    # INDEXNOW_AUTO_SUBMIT is on, so normally nobody types it.
    manage.py ping_indexnow --changed

    # One specific page or product, by hand
    manage.py ping_indexnow /products/pite-me-tuna /en/products/pite-me-tuna

    # Everything the sitemap advertises — for the first submission, or after a
    # change that touched the whole site
    manage.py ping_indexnow --all

    # Show what would be sent, contact nobody
    manage.py ping_indexnow --all --dry-run

Submit URLs that actually changed. Re-submitting the entire site on every
deploy is what the 429 "potential spam" response exists to punish, and it
teaches the engines to trust our signals less.
"""

import hashlib
import json
import os
import urllib.error
import urllib.request
from html.parser import HTMLParser
from urllib.parse import unquote, urljoin, urlparse

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from config.sitemaps import SITEMAPS

ENDPOINT = 'https://api.indexnow.org/indexnow'

# api.indexnow.org fans a submission out to every participating engine, so one
# request covers all of them.
TIMEOUT = 30

# The published per-request ceiling.
MAX_URLS = 10000

DIST_DIR = settings.BASE_DIR / 'frontend' / 'dist'

# What --changed compares each build against. It stays outside dist/ because
# `astro build` empties that directory and nginx serves it.
STATE_FILE = settings.BASE_DIR / '.indexnow-fingerprints.json'

# Bump when page_fingerprint() changes meaning. Every stored hash then stops
# matching, and a new version records a fresh baseline instead of reporting the
# whole site as changed.
FINGERPRINT_VERSION = 1

# Response codes from https://www.indexnow.org/documentation, mapped to what
# the operator should actually do about each.
RESPONSE_MEANING = {
    200: 'URLs submitted successfully.',
    202: 'Accepted — URLs received, key validation still pending.',
    400: 'Bad request: the payload was malformed.',
    403: (
        'Forbidden: the key was rejected. Check that '
        '{key_location} is reachable and contains exactly the key.'
    ),
    422: (
        'Unprocessable: a URL does not belong to this host, or the key does '
        'not match the schema in the protocol.'
    ),
    429: 'Too many requests — treated as spam. Submit only changed URLs.',
}


class _IndexedContent(HTMLParser):
    """Collects the parts of a built page that a search engine indexes."""

    SKIPPED_IN_MAIN = {'script', 'style', 'template'}

    def __init__(self):
        super().__init__()
        self.parts = []
        self._main_depth = 0
        self._skip_depth = 0
        self._capturing = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title' or (
            tag == 'script' and attrs.get('type') == 'application/ld+json'
        ):
            self._capturing = tag
        elif tag == 'meta' and attrs.get('name') in ('description', 'robots'):
            self.parts.append(f'{attrs["name"]}={attrs.get("content")}')
        elif tag == 'link' and attrs.get('rel') in ('canonical', 'alternate'):
            self.parts.append(
                f'{attrs["rel"]}={attrs.get("hreflang")}={attrs.get("href")}'
            )
        elif tag == 'main':
            self._main_depth += 1
        elif self._main_depth:
            if tag in self.SKIPPED_IN_MAIN:
                self._skip_depth += 1
            elif self._skip_depth:
                pass
            elif tag == 'img':
                self.parts.append(f'alt={attrs.get("alt")}')
            elif tag == 'a' and not (attrs.get('href') or '').startswith('/_astro/'):
                self.parts.append(f'href={attrs.get("href")}')

    def handle_endtag(self, tag):
        if tag == self._capturing:
            self._capturing = None
        elif tag == 'main':
            self._main_depth -= 1
        elif self._main_depth and tag in self.SKIPPED_IN_MAIN:
            self._skip_depth = max(self._skip_depth - 1, 0)

    def handle_data(self, data):
        if self._capturing or (self._main_depth and not self._skip_depth):
            self.parts.append(data)


def page_fingerprint(html):
    """
    Hash what a search engine reads from a built page, and nothing else.

    That means the title, description, robots, canonical, hreflang, JSON-LD, and
    the text, image alts and links inside <main>. Hashing the whole file would
    report every page on every build: it also holds inlined critical CSS,
    content-hashed asset names, Astro's scoped ids, the props of React islands,
    and a footer that prints the current year. A navbar or footer edit is left
    out on purpose too, since it changes nothing a page ranks for, and image
    filenames because re-encoding after an Astro upgrade would change them all.
    """
    parser = _IndexedContent()
    parser.feed(html)
    parser.close()
    content = ' '.join(' '.join(parser.parts).split())
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


class Command(BaseCommand):
    help = 'Submit changed URLs to IndexNow (Bing, Yandex, Seznam, Naver).'

    def add_arguments(self, parser):
        parser.add_argument(
            'urls',
            nargs='*',
            help='URLs or site-relative paths to submit, e.g. /products/pite-me-tuna',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            dest='submit_all',
            help='Submit every URL in the sitemaps instead of named ones.',
        )
        parser.add_argument(
            '--changed',
            action='store_true',
            help=(
                'Submit the pages whose indexable content differs from the last '
                'submission. Does nothing unless INDEXNOW_AUTO_SUBMIT is on.'
            ),
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print the payload without sending it or recording anything.',
        )

    def handle(self, *args, **options):
        urls = options['urls']
        if options['changed']:
            if urls or options['submit_all']:
                raise CommandError('Pass only one of --changed, --all or explicit URLs.')
            self._submit_changed(options['dry_run'])
            return

        if options['submit_all']:
            if urls:
                raise CommandError('Pass either --all or explicit URLs, not both.')
            urls = self._sitemap_urls(settings.SITE_DOMAIN)
        elif not urls:
            raise CommandError(
                'Nothing to submit. Pass URLs to submit, --changed for what the '
                'last build changed, or --all for the whole sitemap.'
            )

        self._submit(urls, options['dry_run'])

    def _submit_changed(self, dry_run):
        """Submit what this build changed, then remember it as the new baseline."""
        # dry-run contacts nobody and records nothing, so it stays available
        # where the switch is off, which is how to inspect this locally.
        if not settings.INDEXNOW_AUTO_SUBMIT and not dry_run:
            self.stdout.write('IndexNow: INDEXNOW_AUTO_SUBMIT is off, nothing submitted.')
            return

        current = self._built_fingerprints(settings.SITE_DOMAIN)
        # Without this, a build that went missing would look like every known
        # page being deleted, and the whole site would be submitted.
        if not current:
            raise CommandError(f'No sitemap page was found in {DIST_DIR}. Build first.')

        previous = self._load_state()
        if previous is None:
            # Nothing to compare with, and "changed" cannot be told from "new to
            # this file", so reporting all of it would be the very spam the
            # module docstring warns about.
            if dry_run:
                self.stdout.write(
                    f'IndexNow: no baseline yet, {len(current)} page(s) would be recorded.'
                )
                return
            self._save_state(current)
            self.stdout.write(
                f'IndexNow: baseline recorded for {len(current)} page(s), nothing submitted.'
            )
            return

        changed = [path for path, value in current.items() if previous.get(path) != value]
        # Engines recrawl these too and learn the page is gone (or noindexed).
        removed = [path for path in previous if path not in current]

        if not changed and not removed:
            self.stdout.write('IndexNow: no indexable content changed, nothing submitted.')
            return

        for label, paths in (('changed', changed), ('removed', removed)):
            for path in paths:
                self.stdout.write(f'  {label}: {path}')

        # _submit raises on any refusal, which leaves the old baseline in place
        # so the next build reports these pages again instead of losing them.
        self._submit(changed + removed, dry_run)
        if not dry_run:
            self._save_state(current)

    def _built_fingerprints(self, domain):
        """
        Fingerprint each sitemap page in the build, keyed by path.

        Going through the sitemap rather than walking dist/ keeps out the 404 and
        thank-you pages, which must never be submitted. build.format is 'file' in
        astro.config.mjs, so /en/about is dist/en/about.html.
        """
        fingerprints = {}
        for url in self._sitemap_urls(domain):
            path = urlparse(url).path
            name = unquote(path).strip('/')
            page = DIST_DIR / (f'{name}.html' if name else 'index.html')
            if page.is_file():
                fingerprints[path] = page_fingerprint(page.read_text(encoding='utf-8'))
        return fingerprints

    def _load_state(self):
        """The fingerprints last submitted, or None if there is no usable baseline."""
        try:
            state = json.loads(STATE_FILE.read_text(encoding='utf-8'))
        except (FileNotFoundError, ValueError):
            return None
        return state['pages'] if state.get('version') == FINGERPRINT_VERSION else None

    def _save_state(self, pages):
        temporary = STATE_FILE.with_suffix('.tmp')
        temporary.write_text(
            json.dumps({'version': FINGERPRINT_VERSION, 'pages': pages}, indent=1),
            encoding='utf-8',
        )
        os.replace(temporary, STATE_FILE)

    def _submit(self, urls, dry_run):
        domain = settings.SITE_DOMAIN
        key = settings.INDEXNOW_KEY
        origin = f'https://{domain}'
        key_location = f'{origin}/{key}.txt'

        urls = self._normalize(urls, origin, domain)

        if len(urls) > MAX_URLS:
            raise CommandError(
                f'{len(urls)} URLs exceeds the {MAX_URLS}-per-request limit.'
            )

        payload = {
            'host': domain,
            'key': key,
            'keyLocation': key_location,
            'urlList': urls,
        }

        if dry_run:
            self.stdout.write(json.dumps(payload, indent=2))
            self.stdout.write(
                self.style.WARNING(f'\nDry run — {len(urls)} URL(s) not submitted.')
            )
            return

        # Fail on an unreachable key file rather than on the 403 it causes: the
        # cause is far easier to read here than at the far end. The frontend
        # must be rebuilt and deployed after the key file is added, and
        # forgetting that step is the likeliest reason this command ever fails.
        self._verify_key_file(key_location, key)

        self.stdout.write(f'Submitting {len(urls)} URL(s) to IndexNow...')
        status = self._post(payload)

        meaning = RESPONSE_MEANING.get(status, 'Unrecognised response.')
        meaning = meaning.format(key_location=key_location)

        if status in (200, 202):
            self.stdout.write(self.style.SUCCESS(f'HTTP {status}: {meaning}'))
            self.stdout.write(
                'Verify receipt at https://www.bing.com/webmasters (IndexNow section).'
            )
        else:
            raise CommandError(f'HTTP {status}: {meaning}')

    def _sitemap_urls(self, domain):
        """Every absolute URL the sitemap advertises, across all languages."""
        urls = []
        for sitemap_class in SITEMAPS.values():
            sitemap = sitemap_class()
            # Sitemaps paginate at 50,000 URLs. The catalogue is far smaller,
            # but reading only page 1 would silently truncate if it ever grows.
            for page in sitemap.paginator.page_range:
                for entry in sitemap.get_urls(
                    page=page, site=_Site(domain), protocol='https'
                ):
                    urls.append(entry['location'])
        return urls

    def _normalize(self, urls, origin, domain):
        """Accept paths or absolute URLs; return absolute, de-duplicated, on-host."""
        seen = {}
        for raw in urls:
            url = urljoin(origin, raw.strip())
            host = urlparse(url).netloc
            if host != domain:
                raise CommandError(
                    f'{url} is not on {domain}. IndexNow rejects (422) any '
                    f'submission containing a URL from another host.'
                )
            # dict preserves insertion order, so output stays readable.
            seen[url] = None
        return list(seen)

    def _verify_key_file(self, key_location, key):
        try:
            with urllib.request.urlopen(key_location, timeout=TIMEOUT) as response:
                body = response.read().decode('utf-8').strip()
        except urllib.error.HTTPError as exc:
            raise CommandError(
                f'Key file {key_location} returned HTTP {exc.code}. It must be '
                f'served publicly before IndexNow will accept submissions — '
                f'check that frontend/public/{key}.txt was built and deployed.'
            )
        except OSError as exc:
            raise CommandError(f'Could not fetch {key_location}: {exc}')

        if body != key:
            raise CommandError(
                f'Key file {key_location} contains "{body}", expected "{key}". '
                f'settings.INDEXNOW_KEY and the filename must agree.'
            )

    def _post(self, payload):
        request = urllib.request.Request(
            ENDPOINT,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json; charset=utf-8'},
            method='POST',
        )
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                return response.status
        except urllib.error.HTTPError as exc:
            # IndexNow signals every failure through the status code, so an
            # HTTPError is a result to report, not an exception to propagate.
            return exc.code
        except OSError as exc:
            raise CommandError(f'Could not reach {ENDPOINT}: {exc}')


class _Site:
    """
    Stands in for django.contrib.sites.models.Site, which is not installed.

    Sitemap.get_urls() only ever reads `.domain`, and the sitemap *views* get it
    from the request host. A management command has no request, so it supplies
    the domain from settings instead.
    """

    def __init__(self, domain):
        self.domain = domain
