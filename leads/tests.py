import json
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

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
