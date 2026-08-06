from django.core.management.base import BaseCommand
from products.models import Product

# Order matters: the first keyword found in the product name wins, so the
# specific terms must precede the broader ones. "Family Pack Pite të Përziera"
# contains both 'family pack' and 'pite'; with 'pite' first it silently took the
# generic pie photo and the family-pack image was unreachable for the only
# family pack actually on sale.
IMAGE_MAP = {
    'family pack': 'products/family-pack.webp',
    'pite': 'products/pie.webp',
    'byrek': 'products/pie.webp',
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
