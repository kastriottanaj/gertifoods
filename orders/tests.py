"""
Order authorisation and pricing tests.

Also an empty stub before the Django 5.2 upgrade. What matters here is that the
price is the server's, not the client's, and that ordering is gated on an
approval flag the customer cannot set — the two properties that make a B2B
wholesale catalogue safe to expose. Neither was asserted anywhere.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Category, Product
from .models import Order

User = get_user_model()


class OrderTestCase(APITestCase):
    def setUp(self):
        cache.clear()
        self.category = Category.objects.create(name='Byrek', slug='pite')
        self.product = Product.objects.create(
            category=self.category,
            name='Byrek me Djathe',
            slug='pite-me-djathe',
            price=Decimal('1.40'),
            unit='piece',
            min_order_quantity=50,
        )
        self.approved = User.objects.create_user(
            username='approved', email='a@example.com', password='pw-long-enough-x', is_approved=True
        )
        self.unapproved = User.objects.create_user(
            username='pending', email='p@example.com', password='pw-long-enough-x'
        )

    def order(self, quantity=50, product=None):
        return {
            'notes': '',
            'items': [{'product': (product or self.product).pk, 'quantity': quantity}],
        }


class OrderPermissionTests(OrderTestCase):
    def test_anonymous_cannot_list_orders(self):
        response = self.client.get(reverse('order-list'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_cannot_place_an_order(self):
        response = self.client.post(reverse('order-list'), self.order(), format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Order.objects.exists())

    def test_unapproved_business_cannot_place_an_order(self):
        self.client.force_authenticate(self.unapproved)

        response = self.client.post(reverse('order-list'), self.order(), format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Order.objects.exists())

    def test_approved_business_can_place_an_order(self):
        self.client.force_authenticate(self.approved)

        response = self.client.post(reverse('order-list'), self.order(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)

    def test_a_customer_sees_only_their_own_orders(self):
        mine = Order.objects.create(user=self.approved)
        Order.objects.create(user=self.unapproved)
        self.client.force_authenticate(self.approved)

        response = self.client.get(reverse('order-list'))

        returned = [row['id'] for row in response.data['results']]
        self.assertEqual(returned, [mine.pk])

    def test_a_customer_cannot_read_another_customers_order(self):
        theirs = Order.objects.create(user=self.unapproved)
        self.client.force_authenticate(self.approved)

        response = self.client.get(reverse('order-detail', args=[theirs.pk]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class OrderPricingTests(OrderTestCase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.approved)

    def test_unit_price_comes_from_the_database_not_the_request(self):
        payload = self.order()
        payload['items'][0]['unit_price'] = '0.01'  # attacker-supplied price

        response = self.client.post(reverse('order-list'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get()
        self.assertEqual(order.items.get().unit_price, Decimal('1.40'))

    def test_total_is_recomputed_server_side(self):
        payload = self.order(quantity=50)
        payload['total'] = '0.01'  # read-only, must be ignored

        self.client.post(reverse('order-list'), payload, format='json')

        self.assertEqual(Order.objects.get().total, Decimal('70.00'))  # 50 x 1.40

    def test_status_cannot_be_chosen_by_the_customer(self):
        payload = self.order()
        payload['status'] = 'delivered'

        self.client.post(reverse('order-list'), payload, format='json')

        self.assertEqual(Order.objects.get().status, 'pending')

    def test_order_is_attributed_to_the_requesting_user(self):
        self.client.post(reverse('order-list'), self.order(), format='json')

        self.assertEqual(Order.objects.get().user, self.approved)


class OrderValidationTests(OrderTestCase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.approved)

    def test_rejects_a_quantity_below_the_minimum(self):
        response = self.client.post(reverse('order-list'), self.order(quantity=49), format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.exists())

    def test_rejects_an_empty_order(self):
        response = self.client.post(
            reverse('order-list'), {'notes': '', 'items': []}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.exists())

    def test_rejects_an_unavailable_product(self):
        retired = Product.objects.create(
            category=self.category, name='Pizza', slug='pizza',
            price=Decimal('2.00'), min_order_quantity=1, is_available=False,
        )

        response = self.client.post(
            reverse('order-list'), self.order(quantity=1, product=retired), format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.exists())

    def test_rejects_an_absurd_quantity(self):
        response = self.client.post(
            reverse('order-list'), self.order(quantity=10_000_000), format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.exists())

    def test_the_whole_order_rolls_back_when_one_line_is_invalid(self):
        payload = {
            'notes': '',
            'items': [
                {'product': self.product.pk, 'quantity': 50},
                {'product': self.product.pk, 'quantity': 1},  # below minimum
            ],
        }

        response = self.client.post(reverse('order-list'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.exists())
