import json
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase, override_settings
from rest_framework.throttling import SimpleRateThrottle

from .geo import get_client_ip

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
