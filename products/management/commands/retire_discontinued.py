from django.core.management.base import BaseCommand
from products.models import Product


# Lines dropped from the catalogue (July 2026): pizza, croissants and Danish
# pastry. Products are marked unavailable rather than deleted so existing
# orders keep pointing at a real row.
DISCONTINUED_CATEGORY_SLUGS = ['pizza', 'kroasane', 'danish']
DISCONTINUED_PRODUCT_SLUGS = ['family-pack-pizza-4', 'family-pack-kroasane-6']


class Command(BaseCommand):
    help = 'Mark discontinued product lines (pizza, croissants, Danish) as unavailable'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Actually write the change. Without it the command only reports.',
        )

    def handle(self, *args, **options):
        qs = Product.objects.filter(is_available=True).filter(
            category__slug__in=DISCONTINUED_CATEGORY_SLUGS
        ) | Product.objects.filter(
            is_available=True, slug__in=DISCONTINUED_PRODUCT_SLUGS
        )
        qs = qs.distinct()

        for product in qs:
            self.stdout.write(f'  - {product.category.slug} / {product.name}')

        count = qs.count()
        if not options['apply']:
            self.stdout.write(
                self.style.WARNING(f'\nDry run: {count} products would be retired. Re-run with --apply.')
            )
            return

        qs.update(is_available=False)
        self.stdout.write(self.style.SUCCESS(f'\nRetired {count} products.'))
