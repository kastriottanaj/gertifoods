from django.core.management.base import BaseCommand
from products.models import Category, Product


PRODUCTS = [
    {
        'category': {'name': 'Byrek', 'slug': 'pite', 'description': 'Traditional Balkan byrek — cheese, spinach, meat and tuna'},
        'items': [
            {'name': 'Byrek me Djathë', 'slug': 'pite-me-djathe', 'description': 'Traditional flaky pastry filled with white cheese. Half-baked.', 'price': '1.40', 'unit': 'piece', 'min_order_quantity': 50},
            {'name': 'Byrek me Spinaq', 'slug': 'pite-me-spinaq', 'description': 'Traditional flaky pastry filled with spinach and cheese. Half-baked.', 'price': '1.40', 'unit': 'piece', 'min_order_quantity': 50},
            {'name': 'Byrek me Mish', 'slug': 'pite-me-mish', 'description': 'Traditional flaky pastry filled with seasoned minced meat. Half-baked.', 'price': '1.60', 'unit': 'piece', 'min_order_quantity': 50},
            {'name': 'Byrek me Tuna', 'slug': 'pite-me-tuna', 'description': 'Traditional flaky pastry filled with tuna. Half-baked.', 'price': '1.60', 'unit': 'piece', 'min_order_quantity': 50},
        ]
    },
    # TODO: Tortilla line — waiting on the variant list (plain / vegetable /
    # fruit / cinnamon?), wholesale prices and MOQs from sales before seeding.
    # The homepage already shows a Tortilla category card.
    {
        'category': {'name': 'Family Pack', 'slug': 'family-pack', 'description': 'Retail-ready family pack formats with shelf-appeal packaging'},
        'items': [
            {'name': 'Family Pack Byrek të Përzier (4 copë)', 'slug': 'family-pack-pite-4', 'description': '4 mixed byrek (cheese, spinach, meat, tuna) in retail-ready packaging.', 'price': '5.20', 'unit': 'pack', 'min_order_quantity': 12},
        ]
    },
]


class Command(BaseCommand):
    help = 'Populate database with Gerti Foods product catalog'

    def handle(self, *args, **options):
        created_count = 0
        for group in PRODUCTS:
            cat_data = group['category']
            category, _ = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={'name': cat_data['name'], 'description': cat_data['description']}
            )
            for item in group['items']:
                _, created = Product.objects.get_or_create(
                    slug=item['slug'],
                    defaults={
                        'category': category,
                        'name': item['name'],
                        'description': item['description'],
                        'price': item['price'],
                        'unit': item['unit'],
                        'min_order_quantity': item['min_order_quantity'],
                        'is_available': True,
                    }
                )
                if created:
                    created_count += 1
                    self.stdout.write(f'  + {item["name"]}')

        self.stdout.write(self.style.SUCCESS(f'\nU shtuan {created_count} produkte.'))
