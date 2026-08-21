import json
from unittest.mock import patch

from django.conf import settings
from django.core import mail
from django.core.cache import cache
from django.test import RequestFactory, SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.throttling import SimpleRateThrottle

from .emails import _header_safe
from .geo import get_client_ip
from .models import Lead
from .recaptcha import RecaptchaUnavailable, verify_recaptcha


class _GoogleResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None

    def read(self):
        return json.dumps(self.payload).encode()


@override_settings(
    RECAPTCHA_ENABLED=True,
    RECAPTCHA_SECRET_KEY='test-secret',
    RECAPTCHA_MIN_SCORE=0.5,
    RECAPTCHA_TIMEOUT=5,
    RECAPTCHA_ALLOWED_HOSTNAMES=['gertifoods.com'],
)
class RecaptchaTests(SimpleTestCase):
    def verify(self, payload, action='lead_submit'):
        with patch('leads.recaptcha.urlopen', return_value=_GoogleResponse(payload)):
            return verify_recaptcha('token', action=action, remote_ip='203.0.113.4')

    def test_accepts_matching_high_score_token(self):
        self.assertTrue(self.verify({
            'success': True,
            'score': 0.9,
            'action': 'lead_submit',
            'hostname': 'gertifoods.com',
        }))

    def test_rejects_low_score_token(self):
        self.assertFalse(self.verify({
            'success': True,
            'score': 0.2,
            'action': 'lead_submit',
            'hostname': 'gertifoods.com',
        }))

    def test_rejects_token_replay_for_another_action(self):
        self.assertFalse(self.verify({
            'success': True,
            'score': 0.9,
            'action': 'sample_request_submit',
            'hostname': 'gertifoods.com',
        }))

    def test_rejects_token_from_another_hostname(self):
        self.assertFalse(self.verify({
            'success': True,
            'score': 0.9,
            'action': 'lead_submit',
            'hostname': 'attacker.example',
        }))

    def test_missing_token_is_rejected(self):
        self.assertFalse(verify_recaptcha('', action='lead_submit'))

    @patch('leads.recaptcha.urlopen', side_effect=TimeoutError)
    def test_google_failure_is_reported_as_unavailable(self, _urlopen):
        with self.assertRaises(RecaptchaUnavailable):
            verify_recaptcha('token', action='lead_submit')

    @override_settings(RECAPTCHA_ENABLED=False)
    def test_disabled_in_local_development(self):
        self.assertTrue(verify_recaptcha('', action='lead_submit'))


class ClientIpTests(SimpleTestCase):
    """
    get_client_ip must not be steerable by the caller.

    nginx builds X-Forwarded-For with $proxy_add_x_forwarded_for, appending the
    connecting address to whatever arrived. Every entry except the last is
    therefore attacker supplied, and the value feeds reCAPTCHA's remoteip risk
    signal and the GeoIP language choice.
    """

    def request(self, **meta):
        return RequestFactory().post('/api/leads/lead/', **meta)

    def test_uses_the_entry_nginx_appended_not_the_client_supplied_one(self):
        request = self.request(HTTP_X_FORWARDED_FOR='1.2.3.4, 203.0.113.9')
        self.assertEqual(get_client_ip(request), '203.0.113.9')

    def test_a_forged_chain_cannot_hide_the_real_address(self):
        # Several fake hops do not push the real client out of the last slot.
        request = self.request(
            HTTP_X_FORWARDED_FOR='9.9.9.9, 8.8.8.8, 7.7.7.7, 203.0.113.9'
        )
        self.assertEqual(get_client_ip(request), '203.0.113.9')

    def test_single_entry_is_used_as_is(self):
        request = self.request(HTTP_X_FORWARDED_FOR='203.0.113.9')
        self.assertEqual(get_client_ip(request), '203.0.113.9')

    def test_matches_what_drf_throttling_derives(self):
        # The two must agree: they describe the same deployment topology, and a
        # disagreement means throttling and spam signals key off different IPs.
        xff = '1.2.3.4, 203.0.113.9'
        request = self.request(HTTP_X_FORWARDED_FOR=xff, REMOTE_ADDR='10.0.0.1')
        throttle = SimpleRateThrottle.__new__(SimpleRateThrottle)
        self.assertEqual(get_client_ip(request), throttle.get_ident(request))

    def test_falls_back_to_real_ip_header_when_no_forwarded_for(self):
        request = self.request(HTTP_X_REAL_IP='203.0.113.9', REMOTE_ADDR='10.0.0.1')
        self.assertEqual(get_client_ip(request), '203.0.113.9')

    def test_falls_back_to_remote_addr_when_unproxied(self):
        request = self.request(REMOTE_ADDR='203.0.113.9')
        self.assertEqual(get_client_ip(request), '203.0.113.9')

    def test_ignores_a_blank_forwarded_for(self):
        request = self.request(HTTP_X_FORWARDED_FOR='', REMOTE_ADDR='203.0.113.9')
        self.assertEqual(get_client_ip(request), '203.0.113.9')


@override_settings(
    RECAPTCHA_ENABLED=False,
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
class SalesNotificationTests(APITestCase):
    """
    A notification that never left the server must not look like one that did.

    Sending is best-effort — leads/emails.py swallows failures so a mail
    problem cannot roll back a lead already saved — and that hid a real outage:
    every notification this site ever produced failed SMTP authentication, with
    the only evidence a line in journalctl. These pin both halves of the fix:
    the outcome is recorded on the row, and a name containing a newline no
    longer costs the notification entirely.
    """

    url = reverse('lead-create')
    payload = {
        'first_name': 'Kastriot',
        'last_name': 'Tanaj',
        'email': 'buyer@bakery.example',
        'phone': '+38349111150',
        'source': 'home_hero',
    }

    def setUp(self):
        cache.clear()
        mail.outbox = []

    def test_records_that_the_notification_was_sent(self):
        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertTrue(Lead.objects.get().sales_notified)

    def test_records_a_failure_without_losing_the_lead(self):
        with patch('leads.emails.EmailMessage.send', side_effect=Exception('SMTP down')):
            response = self.client.post(self.url, self.payload, format='json')

        # The lead still saves — that is the whole point of best-effort sending.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lead = Lead.objects.get()
        self.assertEqual(lead.email, 'buyer@bakery.example')
        # ...but the failure is now visible instead of silent.
        self.assertFalse(lead.sales_notified)

    def test_a_newline_in_a_name_no_longer_costs_the_notification(self):
        # Django rejects a subject containing a newline and _send swallows the
        # error, so this used to save the lead and drop the alert entirely.
        hostile = {**self.payload, 'first_name': 'Kastriot\nBcc: attacker@evil.example'}

        response = self.client.post(self.url, hostile, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertTrue(Lead.objects.get().sales_notified)

    def test_the_subject_carries_no_injected_header(self):
        hostile = {**self.payload, 'first_name': 'Kastriot\nBcc: attacker@evil.example'}

        self.client.post(self.url, hostile, format='json')

        subject = mail.outbox[0].subject
        self.assertNotIn('\n', subject)
        self.assertNotIn('\r', subject)
        self.assertEqual(mail.outbox[0].to, [settings.SALES_EMAIL])


class HeaderSafeTests(SimpleTestCase):
    def test_collapses_newlines_and_carriage_returns(self):
        self.assertEqual(_header_safe('Kastriot\nBcc: x@y.z'), 'Kastriot Bcc: x@y.z')
        self.assertEqual(_header_safe('a\r\nb'), 'a b')

    def test_leaves_ordinary_text_alone(self):
        self.assertEqual(_header_safe('Gerti Foods'), 'Gerti Foods')

    def test_collapses_runs_of_whitespace(self):
        self.assertEqual(_header_safe('  a   b  '), 'a b')
