"""
Auth flow tests.

These existed as an empty stub until the Django 5.2 upgrade, which is a poor
place to have no coverage: the credential path runs through DRF and SimpleJWT,
the two dependencies most likely to break on a Django major version, and
nothing here was asserted. They double as the upgrade's evidence and as a guard
on the properties the June security review established — a refresh token that
JavaScript cannot read, and approval that a registrant cannot grant themselves.
"""

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .views import REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH

User = get_user_model()


class AuthTestCase(APITestCase):
    def setUp(self):
        # Throttle counters live in the cache and would otherwise leak between
        # tests — login is scoped to 5/min, which several of these would trip.
        cache.clear()


class RegisterTests(AuthTestCase):
    url = reverse('register')

    payload = {
        'username': 'bakeryco',
        'email': 'owner@bakery.example',
        'password': 'a-sufficiently-long-passphrase',
        'company_name': 'Bakery Co',
    }

    def test_creates_an_account(self):
        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='bakeryco').exists())

    def test_password_is_hashed_and_never_returned(self):
        response = self.client.post(self.url, self.payload, format='json')

        self.assertNotIn('password', response.data)
        user = User.objects.get(username='bakeryco')
        self.assertNotEqual(user.password, self.payload['password'])
        self.assertTrue(user.check_password(self.payload['password']))

    def test_new_accounts_are_not_approved(self):
        # Approval gates ordering, so it must never be self-granted.
        self.client.post(self.url, self.payload, format='json')

        self.assertFalse(User.objects.get(username='bakeryco').is_approved)

    def test_registrant_cannot_grant_themselves_approval_or_staff(self):
        self.client.post(
            self.url,
            {**self.payload, 'is_approved': True, 'is_staff': True, 'is_superuser': True},
            format='json',
        )

        user = User.objects.get(username='bakeryco')
        self.assertFalse(user.is_approved)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_rejects_a_password_the_validators_refuse(self):
        response = self.client.post(
            self.url, {**self.payload, 'password': '123'}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        self.assertFalse(User.objects.filter(username='bakeryco').exists())

    def test_rejects_a_duplicate_email(self):
        self.client.post(self.url, self.payload, format='json')

        response = self.client.post(
            self.url, {**self.payload, 'username': 'other'}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)


class LoginTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            username='bakeryco', email='owner@bakery.example', password='correct-horse-battery'
        )

    def test_returns_an_access_token(self):
        response = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'bakeryco', 'password': 'correct-horse-battery'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_token_is_httponly_and_absent_from_the_body(self):
        # The point of the cookie: XSS must not be able to read the long-lived
        # credential. If it ever reappears in the body this assertion fails.
        response = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'bakeryco', 'password': 'correct-horse-battery'},
            format='json',
        )

        self.assertNotIn('refresh', response.data)
        cookie = response.cookies[REFRESH_COOKIE_NAME]
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['path'], REFRESH_COOKIE_PATH)
        self.assertEqual(cookie['samesite'], 'Lax')

    def test_rejects_a_wrong_password(self):
        response = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'bakeryco', 'password': 'wrong'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn(REFRESH_COOKIE_NAME, response.cookies)


class ProfileTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            username='bakeryco', email='owner@bakery.example', password='correct-horse-battery'
        )

    def test_requires_authentication(self):
        response = self.client.get(reverse('profile'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_the_authenticated_user(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(reverse('profile'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'bakeryco')

    def test_approval_cannot_be_self_granted_through_the_profile(self):
        self.client.force_authenticate(self.user)

        self.client.patch(reverse('profile'), {'is_approved': True}, format='json')

        self.user.refresh_from_db()
        self.assertFalse(self.user.is_approved)


class RefreshAndLogoutTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        User.objects.create_user(
            username='bakeryco', email='owner@bakery.example', password='correct-horse-battery'
        )
        self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'bakeryco', 'password': 'correct-horse-battery'},
            format='json',
        )

    def test_refreshes_from_the_cookie_with_no_request_body(self):
        response = self.client.post(reverse('token_refresh'), {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_without_a_cookie_is_rejected(self):
        self.client.cookies.pop(REFRESH_COOKIE_NAME)

        response = self.client.post(reverse('token_refresh'), {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_revokes_the_refresh_token(self):
        # The navbar's logout was pointing at localhost for a while, so the
        # cookie outlived every "log out". This pins the server side of it.
        logout = self.client.post(reverse('logout'), {}, format='json')
        self.assertEqual(logout.status_code, status.HTTP_205_RESET_CONTENT)

        # Present the revoked token again: rotation blacklisted it.
        self.client.cookies[REFRESH_COOKIE_NAME] = logout.cookies[REFRESH_COOKIE_NAME]
        retry = self.client.post(reverse('token_refresh'), {}, format='json')

        self.assertEqual(retry.status_code, status.HTTP_401_UNAUTHORIZED)
