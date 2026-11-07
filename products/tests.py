import json
import shutil
import tempfile
from decimal import Decimal
from io import StringIO
from pathlib import Path
from unittest import mock

from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings
from django.urls import reverse

from products.management.commands import ping_indexnow
from products.models import Category, Product

PIE = 'products/pie.webp'
FAMILY_PACK = 'products/family-pack-pite.webp'


class SetProductImagesTests(TestCase):
    """
    Covers `manage.py set_product_images`, which maps a product to a catalogue
    photo by looking for a keyword in its name.

    The mapping is order-sensitive — the first keyword found wins — so these
    tests exist mainly to pin that order down. Reordering IMAGE_MAP is a silent
    change: nothing raises, the command still reports success, and the only
    symptom is the wrong photo on a live product page.
    """

    def setUp(self):
        self.category = Category.objects.create(name='Pite', slug='pite')

    def _product(self, name, slug):
        return Product.objects.create(
            category=self.category,
            name=name,
            slug=slug,
            price=Decimal('1.40'),
            unit='piece',
            min_order_quantity=50,
        )

    def _run(self):
        out = StringIO()
        call_command('set_product_images', stdout=out)
        return out.getvalue()

    def test_family_pack_beats_the_broader_pite_keyword(self):
        """
        The regression this suite exists for.

        'Family Pack Pite të Përziera (4 copë)' — the real production name —
        contains both 'family pack' and 'pite'. When 'pite' was checked first
        the only family pack on sale was assigned the generic pie photo, and
        the family-pack photo was unreachable for every live product.
        """
        product = self._product('Family Pack Pite të Përziera (4 copë)', 'family-pack-pite-4')

        self._run()

        product.refresh_from_db()
        self.assertEqual(product.image.name, FAMILY_PACK)

    def test_family_pack_beats_the_broader_byrek_keyword(self):
        """Same precedence, via the other generic term ('byrek' == 'pite')."""
        product = self._product('Family Pack Byrek të Përzier (4 copë)', 'family-pack-byrek-4')

        self._run()

        product.refresh_from_db()
        self.assertEqual(product.image.name, FAMILY_PACK)

    def test_individual_products_get_the_pie_photo(self):
        names = {
            'pite-me-djathe': 'Pite me Djathë',
            'pite-me-mish': 'Pite me Mish',
            'pite-me-spinaq': 'Pite me Spinaq',
            'pite-me-tuna': 'Pite me Tuna',
            'byrek-me-djathe': 'Byrek me Djathë',
        }
        for slug, name in names.items():
            self._product(name, slug)

        self._run()

        for slug in names:
            self.assertEqual(Product.objects.get(slug=slug).image.name, PIE, slug)

    def test_unmatched_products_are_left_alone(self):
        """
        Croissants and pizzas match no keyword. They must keep an empty image
        rather than inherit a pie photo — a wrong photo is worse than none.
        """
        croissant = self._product('Kroasan me Çokollatë', 'kroasan-me-cokollate')
        pizza = self._product('Pizza Margherita Mini', 'pizza-margherita-mini')

        self._run()

        croissant.refresh_from_db()
        pizza.refresh_from_db()
        self.assertEqual(croissant.image.name, '')
        self.assertEqual(pizza.image.name, '')

    def test_only_the_image_field_changes(self):
        product = self._product('Pite me Tuna', 'pite-me-tuna')
        before = Product.objects.filter(pk=product.pk).values().get()

        self._run()

        after = Product.objects.filter(pk=product.pk).values().get()
        changed = {k for k in before if before[k] != after[k]}
        # updated_at is auto_now, so saving necessarily bumps it.
        self.assertEqual(changed, {'image', 'updated_at'})


class PublicCatalogueHidesPricesTests(TestCase):
    """
    /api/products/ is public, and prices are quoted on request only. The
    endpoint used to return every wholesale price to anyone who asked, and
    allowed ?ordering=price, which leaks the price order even without the
    field. Pinned so neither comes back by accident.
    """

    def setUp(self):
        category = Category.objects.create(name='Pite', slug='pite')
        # Name order Alpha, Beta, Gamma; price order Beta, Alpha, Gamma — so
        # an honoured price sort, in either direction, changes the result.
        for name, price in (('Alpha', '5.00'), ('Beta', '1.00'), ('Gamma', '9.00')):
            Product.objects.create(
                category=category, name=name, slug=name.lower(),
                price=Decimal(price), unit='piece', min_order_quantity=50,
            )

    def _names(self, query=''):
        response = self.client.get(reverse('product-list') + query)
        self.assertEqual(response.status_code, 200)
        return [product['name'] for product in response.json()['results']]

    def test_the_list_carries_no_price(self):
        results = self.client.get(reverse('product-list')).json()['results']
        self.assertEqual(len(results), 3)
        for product in results:
            self.assertNotIn('price', product)

    def test_a_product_carries_no_price(self):
        response = self.client.get(reverse('product-detail', args=['alpha']))
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('price', response.json())

    def test_the_catalogue_cannot_be_sorted_by_price(self):
        by_name = self._names()
        self.assertEqual(by_name, ['Alpha', 'Beta', 'Gamma'])
        self.assertEqual(self._names('?ordering=price'), by_name)
        self.assertEqual(self._names('?ordering=-price'), by_name)


def built_page(main='Original text', title='Title', head='', after_main=''):
    """A page shaped like Astro's output, with every kind of build noise it carries."""
    return (
        f'<!DOCTYPE html><html lang="sq"><head><meta charset="UTF-8">'
        f'<title>{title}</title><meta name="description" content="Description">'
        f'<link rel="canonical" href="https://gertifoods.com/about">'
        f'<link rel="alternate" hreflang="en" href="https://gertifoods.com/en/about">'
        f'<link rel="stylesheet" href="/_astro/main.abc123.css">'
        f'<style>.a[data-astro-cid-abc]{{color:red}}</style>'
        f'<script>gtag("js", new Date());</script>{head}</head><body>'
        f'<nav class="navbar"><a href="/about">About</a></nav>'
        f'<main class="main-content" data-astro-cid-abc>'
        f'<img src="/_astro/hero.abc123.webp" alt="Alt text">'
        f'<astro-island uid="abc" props="{{}}" component-url="/_astro/Form.abc123.js">'
        f'<p>{main}</p></astro-island>'
        f'<template data-astro-template>hidden</template>'
        f'<script>window.x = "abc";</script><a href="/products">Products</a>'
        f'</main><footer>2026</footer>{after_main}</body></html>'
    )


@override_settings(INDEXNOW_AUTO_SUBMIT=True)
class PingIndexNowChangedTests(TestCase):
    """
    `--changed` is what runs unattended on every production build, and getting it
    wrong either submits the whole site each time or quietly submits nothing.
    """

    PAGES = ['index', 'about', 'en/about']

    def setUp(self):
        self.root = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.root)
        self.dist = self.root / 'dist'
        self.state = self.root / 'state.json'
        for name in self.PAGES:
            self.write(name, built_page())

        for target, attribute, value in (
            (ping_indexnow, 'DIST_DIR', self.dist),
            (ping_indexnow, 'STATE_FILE', self.state),
            (ping_indexnow.Command, '_verify_key_file', mock.DEFAULT),
        ):
            patcher = mock.patch.object(target, attribute, value)
            patcher.start()
            self.addCleanup(patcher.stop)

        patcher = mock.patch.object(ping_indexnow.Command, '_post', return_value=200)
        self.post = patcher.start()
        self.addCleanup(patcher.stop)

    def write(self, name, html):
        page = self.dist / f'{name}.html'
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(html, encoding='utf-8')

    def run_command(self, *args):
        out = StringIO()
        call_command('ping_indexnow', '--changed', *args, stdout=out)
        return out.getvalue()

    def submitted(self):
        """The URLs in the one POST made since the last call, or [] if none was."""
        urls = [call.args[0]['urlList'] for call in self.post.call_args_list]
        self.post.reset_mock()
        self.assertLessEqual(len(urls), 1)
        return urls[0] if urls else []

    def baseline(self):
        self.run_command()
        self.post.reset_mock()

    def test_switched_off_contacts_nobody_and_records_nothing(self):
        with override_settings(INDEXNOW_AUTO_SUBMIT=False):
            output = self.run_command()
        self.assertIn('off', output)
        self.post.assert_not_called()
        self.assertFalse(self.state.exists())

    def test_first_run_records_a_baseline_without_submitting(self):
        output = self.run_command()
        self.post.assert_not_called()
        self.assertIn('baseline', output)
        self.assertEqual(
            sorted(json.loads(self.state.read_text())['pages']),
            ['/', '/about', '/en/about'],
        )

    def test_rebuilding_unchanged_content_submits_nothing(self):
        self.baseline()
        self.run_command()
        self.post.assert_not_called()

    def test_changed_text_submits_only_that_page(self):
        self.baseline()
        self.write('about', built_page(main='New text'))
        self.run_command()
        self.assertEqual(self.submitted(), ['https://gertifoods.com/about'])

    def test_a_submitted_change_is_not_reported_twice(self):
        self.baseline()
        self.write('about', built_page(main='New text'))
        self.run_command()
        self.post.reset_mock()
        self.run_command()
        self.post.assert_not_called()

    def test_build_noise_is_not_a_change(self):
        self.baseline()
        noisy = (
            built_page()
            .replace('abc123', 'xyz789')
            .replace('data-astro-cid-abc', 'data-astro-cid-xyz')
            .replace('color:red', 'color:blue')
            .replace('props="{}"', 'props="{&quot;a&quot;:1}"')
            .replace('window.x = "abc"', 'window.x = "xyz"')
            .replace('<footer>2026</footer>', '<footer>2027</footer>')
            .replace('>About</a></nav>', '>Rreth nesh</a></nav>')
        )
        self.write('about', noisy)
        self.run_command()
        self.post.assert_not_called()

    def test_everything_a_search_engine_reads_is_a_change(self):
        changes = {
            'title': built_page(title='New title'),
            'description': built_page().replace('"Description"', '"New"'),
            'canonical': built_page().replace('gertifoods.com/about"', 'gertifoods.com/x"'),
            'hreflang': built_page().replace('/en/about"', '/en/x"'),
            'json-ld': built_page(
                head='<script type="application/ld+json">{"name":"x"}</script>'
            ),
            'image alt': built_page().replace('Alt text', 'New alt'),
            'link': built_page().replace('href="/products"', 'href="/blog"'),
            'noindex': built_page(head='<meta name="robots" content="noindex">'),
        }
        for name, html in changes.items():
            with self.subTest(name):
                self.write('about', built_page())
                self.state.unlink(missing_ok=True)
                self.baseline()
                self.write('about', html)
                self.run_command()
                self.assertEqual(self.submitted(), ['https://gertifoods.com/about'])

    def test_removed_page_is_submitted_so_engines_learn_it_is_gone(self):
        self.baseline()
        (self.dist / 'about.html').unlink()
        self.run_command()
        self.assertEqual(self.submitted(), ['https://gertifoods.com/about'])
        self.assertNotIn('/about', json.loads(self.state.read_text())['pages'])

    def test_new_page_is_submitted(self):
        self.baseline()
        self.write('blog', built_page())
        self.run_command()
        self.assertEqual(self.submitted(), ['https://gertifoods.com/blog'])

    def test_pages_outside_the_sitemap_are_never_submitted(self):
        self.baseline()
        self.write('404', built_page(main='Not found'))
        self.write('faleminderit', built_page(main='Thanks'))
        self.run_command()
        self.post.assert_not_called()

    def test_refused_submission_is_retried_by_the_next_build(self):
        self.baseline()
        self.write('about', built_page(main='New text'))
        self.post.return_value = 429
        with self.assertRaises(CommandError):
            self.run_command()
        self.post.reset_mock()

        self.post.return_value = 200
        self.run_command()
        self.assertEqual(self.submitted(), ['https://gertifoods.com/about'])

    def test_dry_run_contacts_nobody_and_records_nothing(self):
        self.baseline()
        before = self.state.read_text()
        self.write('about', built_page(main='New text'))
        with override_settings(INDEXNOW_AUTO_SUBMIT=False):
            output = self.run_command('--dry-run')
        self.post.assert_not_called()
        self.assertIn('https://gertifoods.com/about', output)
        self.assertEqual(self.state.read_text(), before)

    def test_a_missing_build_is_an_error_not_a_mass_removal(self):
        self.baseline()
        shutil.rmtree(self.dist)
        with self.assertRaises(CommandError):
            self.run_command()
        self.post.assert_not_called()

    def test_a_new_fingerprint_version_records_a_baseline_instead_of_submitting(self):
        self.baseline()
        self.write('about', built_page(main='New text'))
        with mock.patch.object(ping_indexnow, 'FINGERPRINT_VERSION', 2):
            output = self.run_command()
        self.post.assert_not_called()
        self.assertIn('baseline', output)

    def test_changed_cannot_be_combined_with_other_selections(self):
        for args in (['/about'], ['--all']):
            with self.subTest(args), self.assertRaises(CommandError):
                self.run_command(*args)
