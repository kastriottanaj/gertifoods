from decimal import Decimal
from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from products.models import Category, Product

PIE = 'products/pie.webp'
FAMILY_PACK = 'products/family-pack.webp'


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
        products/family-pack.webp was unreachable for every live product.
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
