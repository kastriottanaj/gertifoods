from django.core.management.base import BaseCommand
from products.models import Category, Product


PRODUCTS = [
    {
        'category': {'name': 'Pizza', 'slug': 'pizza', 'description': 'Half-baked pizzas, ready in 15-20 minutes'},
        'items': [
            {'name': 'Pizza Margherita Family', 'slug': 'pizza-margherita-family', 'description': 'Classic tomato and mozzarella pizza. Family size. Half-baked, ready in 15-20 min.', 'price': '3.50', 'unit': 'piece', 'min_order_quantity': 24},
            {'name': 'Pizza Margherita Mini', 'slug': 'pizza-margherita-mini', 'description': 'Classic tomato and mozzarella pizza. Mini size. Half-baked, ready in 15-20 min.', 'price': '1.80', 'unit': 'piece', 'min_order_quantity': 48},
            {'name': 'Pizza Pepperoni Family', 'slug': 'pizza-pepperoni-family', 'description': 'Tomato, mozzarella and pepperoni. Family size. Half-baked, ready in 15-20 min.', 'price': '3.90', 'unit': 'piece', 'min_order_quantity': 24},
            {'name': 'Pizza Pepperoni Mini', 'slug': 'pizza-pepperoni-mini', 'description': 'Tomato, mozzarella and pepperoni. Mini size. Half-baked, ready in 15-20 min.', 'price': '2.00', 'unit': 'piece', 'min_order_quantity': 48},
            {'name': 'Pizza 4 Djathëra Family', 'slug': 'pizza-4-djathera-family', 'description': 'Four cheese blend pizza. Family size. Half-baked, ready in 15-20 min.', 'price': '4.10', 'unit': 'piece', 'min_order_quantity': 24},
            {'name': 'Pizza Vegjetariane Family', 'slug': 'pizza-vegjetariane-family', 'description': 'Seasonal vegetables, tomato and mozzarella. Family size.', 'price': '3.70', 'unit': 'piece', 'min_order_quantity': 24},
            {'name': 'Pizza Tuna Family', 'slug': 'pizza-tuna-family', 'description': 'Tuna, olives, tomato and mozzarella. Family size. Half-baked.', 'price': '3.90', 'unit': 'piece', 'min_order_quantity': 24},
        ]
    },
    {
        'category': {'name': 'Kroasanë', 'slug': 'kroasane', 'description': 'Buttery croissants — plain, chocolate and cream filled'},
        'items': [
            {'name': 'Kroasan i Thjeshtë', 'slug': 'kroasan-i-thjesht', 'description': 'Classic butter croissant. Light and flaky. Half-baked, ready in 15-20 min. Up to 6,000 pcs/day.', 'price': '0.60', 'unit': 'piece', 'min_order_quantity': 100},
            {'name': 'Kroasan me Çokollatë', 'slug': 'kroasan-me-cokollate', 'description': 'Butter croissant filled with premium chocolate cream. Half-baked.', 'price': '0.75', 'unit': 'piece', 'min_order_quantity': 100},
            {'name': 'Kroasan me Krem', 'slug': 'kroasan-me-krem', 'description': 'Butter croissant filled with vanilla cream. Half-baked.', 'price': '0.75', 'unit': 'piece', 'min_order_quantity': 100},
        ]
    },
    {
        'category': {'name': 'Pite', 'slug': 'pite', 'description': 'Traditional Balkan pies — cheese, spinach, meat and tuna'},
        'items': [
            {'name': 'Pite me Djathë', 'slug': 'pite-me-djathe', 'description': 'Traditional flaky pastry filled with white cheese. Half-baked.', 'price': '1.40', 'unit': 'piece', 'min_order_quantity': 50},
            {'name': 'Pite me Spinaq', 'slug': 'pite-me-spinaq', 'description': 'Traditional flaky pastry filled with spinach and cheese. Half-baked.', 'price': '1.40', 'unit': 'piece', 'min_order_quantity': 50},
            {'name': 'Pite me Mish', 'slug': 'pite-me-mish', 'description': 'Traditional flaky pastry filled with seasoned minced meat. Half-baked.', 'price': '1.60', 'unit': 'piece', 'min_order_quantity': 50},
            {'name': 'Pite me Tuna', 'slug': 'pite-me-tuna', 'description': 'Traditional flaky pastry filled with tuna. Half-baked.', 'price': '1.60', 'unit': 'piece', 'min_order_quantity': 50},
        ]
    },
    {
        'category': {'name': 'Family Pack', 'slug': 'family-pack', 'description': 'Retail-ready family pack formats with shelf-appeal packaging'},
        'items': [
            {'name': 'Family Pack Pizza (4 copë)', 'slug': 'family-pack-pizza-4', 'description': '4 mini pizzas in retail-ready packaging. Shelf-appeal design. Half-baked.', 'price': '5.50', 'unit': 'pack', 'min_order_quantity': 12},
            {'name': 'Family Pack Kroasanë (6 copë)', 'slug': 'family-pack-kroasane-6', 'description': '6 assorted croissants in retail-ready packaging. Half-baked.', 'price': '4.20', 'unit': 'pack', 'min_order_quantity': 12},
            {'name': 'Family Pack Pite të Përziera (4 copë)', 'slug': 'family-pack-pite-4', 'description': '4 mixed pies (cheese, spinach, meat, tuna) in retail-ready packaging.', 'price': '5.20', 'unit': 'pack', 'min_order_quantity': 12},
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
