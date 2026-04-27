from django.core.management.base import BaseCommand
from products.models import Product

IMAGE_MAP = {
    'pizza': 'products/pizza.webp',
    'kroasan': 'products/croissant.webp',
    'pite': 'products/pie.webp',
    'family pack': 'products/family-pack.webp',
}


class Command(BaseCommand):
    help = 'Assign images to products based on category'

    def handle(self, *args, **options):
        for product in Product.objects.all():
            name_lower = product.name.lower()
            for keyword, image_path in IMAGE_MAP.items():
                if keyword in name_lower:
                    product.image = image_path
                    product.save()
                    self.stdout.write(f'  {product.name} = {image_path}')
                    break
        self.stdout.write(self.style.SUCCESS('Imazhet u vendosën.'))
