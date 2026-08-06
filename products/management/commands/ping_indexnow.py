"""
Submit URLs to IndexNow so participating search engines recrawl them promptly.

Lives in the products app purely so Django finds it: command discovery walks
INSTALLED_APPS, and `config` is not an app. The command itself is site-wide.

What IndexNow buys us, stated plainly: Bing, Yandex, Seznam and Naver consume
it. **Google does not participate** — nothing here affects Google, which still
discovers changes by crawling the sitemap on its own schedule.

Usage:
    # After editing a specific page or product (the normal case)
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

import json
import urllib.error
import urllib.request
from urllib.parse import urljoin, urlparse

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from config.sitemaps import SITEMAPS

ENDPOINT = 'https://api.indexnow.org/indexnow'

# api.indexnow.org fans a submission out to every participating engine, so one
# request covers all of them.
TIMEOUT = 30

# The published per-request ceiling.
MAX_URLS = 10000

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
            '--dry-run',
            action='store_true',
            help='Print the payload without sending it.',
        )

    def handle(self, *args, **options):
        domain = settings.SITE_DOMAIN
        key = settings.INDEXNOW_KEY
        origin = f'https://{domain}'
        key_location = f'{origin}/{key}.txt'

        urls = options['urls']
        if options['submit_all']:
            if urls:
                raise CommandError('Pass either --all or explicit URLs, not both.')
            urls = self._sitemap_urls(domain)
        elif not urls:
            raise CommandError(
                'Nothing to submit. Pass URLs to submit, or --all for the '
                'whole sitemap.'
            )

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

        if options['dry_run']:
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
