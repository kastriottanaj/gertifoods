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


class _MetaResponse:
    """Stands in for Meta's Graph API response to a Conversions API POST."""

    def __init__(self, payload, request=None):
        self.payload = payload
        self.request = request

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None

    def read(self):
        return json.dumps(self.payload).encode()


@override_settings(
    META_CAPI_ENABLED=True,
    META_CAPI_ACCESS_TOKEN='test-token',
    META_PIXEL_ID='1396559496012591',
    META_CAPI_API_VERSION='v24.0',
    META_CAPI_TIMEOUT=3,
    META_CAPI_TEST_EVENT_CODE='',
    RECAPTCHA_ENABLED=False,
)
class ConversionsApiTests(APITestCase):
    """The server-side copy of a lead conversion.

    What matters here is not that Meta is called, but that calling it can never
    cost a lead, and that the two copies of one conversion stay recognisable as
    one event.
    """

    url = reverse('lead-create')
    payload = {
        'first_name': 'Arben',
        'last_name': 'Krasniqi',
        'email': 'Arben@Byrektore-ABC.com',
        'phone': '049 111 150',
        'source': 'home_hero',
        'event_id': 'evt-abc-123',
        'marketing_consent': True,
    }

    def setUp(self):
        cache.clear()
        mail.outbox = []
        self.sent = []

    def _capture(self, request, timeout=None):
        self.sent.append(json.loads(request.data.decode()))
        return _MetaResponse({'events_received': 1})

    def post(self, payload=None, **extra):
        with patch('leads.capi.urlopen', side_effect=self._capture):
            return self.client.post(self.url, payload or self.payload, format='json', **extra)

    def test_sends_the_conversion_and_records_it(self):
        response = self.post()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(self.sent), 1)
        self.assertTrue(Lead.objects.get().capi_sent)

    def test_shares_the_event_id_with_the_pixel(self):
        """Deduplication is the whole reason both copies may be sent."""
        self.post()

        event = self.sent[0]['data'][0]
        self.assertEqual(event['event_id'], 'evt-abc-123')
        self.assertEqual(event['event_name'], 'Lead')
        self.assertEqual(event['action_source'], 'website')
        self.assertEqual(Lead.objects.get().event_id, 'evt-abc-123')

    def test_sends_no_plaintext_pii(self):
        self.post()

        body = json.dumps(self.sent[0])
        self.assertNotIn('Arben@', body)
        self.assertNotIn('Byrektore-ABC', body)
        self.assertNotIn('049 111 150', body)
        self.assertNotIn('Krasniqi', body)

    def test_hashes_match_the_browsers_normalisation(self):
        """Server and browser must derive one digest for one person."""
        import hashlib

        self.post()
        user_data = self.sent[0]['data'][0]['user_data']
        sha = lambda v: hashlib.sha256(v.encode()).hexdigest()

        self.assertEqual(user_data['em'], [sha('arben@byrektore-abc.com')])
        # 049… is a Kosovo mobile, so it gains the 383 country code.
        self.assertEqual(user_data['ph'], [sha('38349111150')])
        self.assertEqual(user_data['fn'], [sha('arben')])
        self.assertEqual(user_data['ln'], [sha('krasniqi')])

    def test_forwards_the_meta_cookies_for_matching(self):
        self.client.cookies['_fbc'] = 'fb.1.1700000000.IwAR123'
        self.client.cookies['_fbp'] = 'fb.1.1700000000.987654321'

        self.post(**{'HTTP_USER_AGENT': 'Mozilla/5.0 Test', 'HTTP_REFERER': 'https://gertifoods.com/furnizim/byrektore'})

        event = self.sent[0]['data'][0]
        self.assertEqual(event['user_data']['fbc'], 'fb.1.1700000000.IwAR123')
        self.assertEqual(event['user_data']['fbp'], 'fb.1.1700000000.987654321')
        self.assertEqual(event['user_data']['client_user_agent'], 'Mozilla/5.0 Test')
        self.assertEqual(event['event_source_url'], 'https://gertifoods.com/furnizim/byrektore')
        # Stored too, because the offline "became a customer" event will need
        # them long after this request is gone.
        lead = Lead.objects.get()
        self.assertEqual(lead.fbc, 'fb.1.1700000000.IwAR123')
        self.assertEqual(lead.fbp, 'fb.1.1700000000.987654321')

    def test_labels_the_form_the_way_the_pixel_does(self):
        self.post()

        custom = self.sent[0]['data'][0]['custom_data']
        self.assertEqual(custom['content_name'], 'hero_lead')
        self.assertEqual(custom['content_category'], 'home_hero')

    def test_a_meta_outage_does_not_cost_the_lead(self):
        """The single most important property in this module."""
        from urllib.error import URLError

        with patch('leads.capi.urlopen', side_effect=URLError('meta is down')):
            response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lead = Lead.objects.get()
        self.assertEqual(lead.email, 'Arben@Byrektore-ABC.com')
        self.assertFalse(lead.capi_sent)

    def test_a_rejected_token_does_not_cost_the_lead(self):
        from urllib.error import HTTPError

        error = HTTPError('url', 401, 'Unauthorized', {}, None)
        with patch('leads.capi.urlopen', side_effect=error):
            response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(Lead.objects.get().capi_sent)

    def test_without_an_event_id_nothing_is_sent(self):
        """An unpaired copy could be counted a second time by Meta."""
        payload = {k: v for k, v in self.payload.items() if k != 'event_id'}
        self.client.cookies['_fbc'] = 'fb.1.1700000000.IwAR123'

        response = self.post(payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.sent, [])
        lead = Lead.objects.get()
        self.assertFalse(lead.capi_sent)
        # The attribution is still worth keeping: it is what will later say
        # this customer came from an ad, whether or not the event went out.
        self.assertEqual(lead.fbc, 'fb.1.1700000000.IwAR123')

    @override_settings(META_CAPI_ENABLED=False)
    def test_disabled_by_default_without_a_token(self):
        response = self.post()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.sent, [])

    @override_settings(META_CAPI_TEST_EVENT_CODE='TEST12345')
    def test_test_event_code_keeps_checks_out_of_the_real_dataset(self):
        self.post()

        self.assertEqual(self.sent[0]['test_event_code'], 'TEST12345')

    def test_token_travels_in_the_header_not_the_url(self):
        """A token in the query string lands in every proxy's access log."""
        captured = {}

        def capture(request, timeout=None):
            captured['url'] = request.full_url
            captured['auth'] = request.get_header('Authorization')
            return _MetaResponse({'events_received': 1})

        with patch('leads.capi.urlopen', side_effect=capture):
            self.client.post(self.url, self.payload, format='json')

        self.assertNotIn('test-token', captured['url'])
        self.assertIn('1396559496012591', captured['url'])
        self.assertIn('v24.0', captured['url'])
        self.assertEqual(captured['auth'], 'Bearer test-token')


@override_settings(
    META_CAPI_ENABLED=True,
    META_CAPI_ACCESS_TOKEN='test-token',
    META_PIXEL_ID='1396559496012591',
    META_CAPI_TEST_EVENT_CODE='',
    RECAPTCHA_ENABLED=False,
)
class AttributionTests(APITestCase):
    """Which campaign paid for a lead, and whether Meta may be told about it.

    The attribution columns exist to join two systems that could not see each
    other: the campaign, which lives in Meta, and 'this company now buys from
    us', which is a status field in the admin.
    """

    url = reverse('lead-create')
    base = {
        'first_name': 'Arben',
        'last_name': 'Krasniqi',
        'email': 'arben@byrektore.example',
        'phone': '049111150',
        'source': 'home_hero',
        'event_id': 'evt-1',
    }

    def setUp(self):
        cache.clear()
        mail.outbox = []
        self.sent = []

    def _capture(self, request, timeout=None):
        self.sent.append(json.loads(request.data.decode()))
        return _MetaResponse({'events_received': 1})

    def post(self, **extra_payload):
        payload = {**self.base, **extra_payload}
        with patch('leads.capi.urlopen', side_effect=self._capture):
            return self.client.post(self.url, payload, format='json')

    def test_records_the_campaign_that_produced_the_lead(self):
        self.post(
            marketing_consent=True,
            utm_source='facebook', utm_medium='paid_social',
            utm_campaign='byrektore-oct', utm_content='video-a',
            landing_page='/furnizim/byrektore', referrer='https://l.facebook.com/',
        )

        lead = Lead.objects.get()
        self.assertEqual(lead.utm_campaign, 'byrektore-oct')
        self.assertEqual(lead.utm_source, 'facebook')
        self.assertEqual(lead.utm_content, 'video-a')
        self.assertEqual(lead.landing_page, '/furnizim/byrektore')
        self.assertEqual(lead.referrer, 'https://l.facebook.com/')

    def test_campaign_survives_to_the_converted_customer(self):
        """The whole point: cost per customer, not cost per lead."""
        self.post(marketing_consent=True, utm_campaign='byrektore-oct')

        lead = Lead.objects.get()
        lead.status = 'converted'
        lead.save()

        converted = Lead.objects.filter(status='converted', utm_campaign='byrektore-oct')
        self.assertEqual(converted.count(), 1)

    # --- consent --------------------------------------------------------
    def test_without_consent_nothing_is_sent_to_meta(self):
        """The pixel is not even loaded without consent; the server must match."""
        self.post(marketing_consent=False, utm_campaign='byrektore-oct')

        self.assertEqual(self.sent, [])
        lead = Lead.objects.get()
        self.assertFalse(lead.capi_sent)
        self.assertFalse(lead.marketing_consent)

    def test_consent_is_not_assumed_when_the_field_is_absent(self):
        """An old cached bundle posts no consent field. That is not a yes."""
        self.post()

        self.assertEqual(self.sent, [])
        self.assertFalse(Lead.objects.get().marketing_consent)

    def test_the_lead_is_still_captured_without_consent(self):
        """Declining marketing cookies is not declining to be a customer."""
        self.post(marketing_consent=False, utm_campaign='byrektore-oct')

        lead = Lead.objects.get()
        self.assertEqual(lead.email, 'arben@byrektore.example')
        self.assertEqual(lead.utm_campaign, 'byrektore-oct')
        self.assertEqual(len(mail.outbox), 1)  # sales still hears about it

    def test_with_consent_the_conversion_goes_out(self):
        self.post(marketing_consent=True, utm_campaign='byrektore-oct')

        self.assertEqual(len(self.sent), 1)
        self.assertTrue(Lead.objects.get().capi_sent)

    # --- fbc reconstruction ---------------------------------------------
    def test_rebuilds_fbc_from_fbclid_when_the_cookie_is_missing(self):
        """The ad clicker is exactly who the blocked pixel loses."""
        self.post(marketing_consent=True, fbclid='IwAR0abcdef')

        fbc = self.sent[0]['data'][0]['user_data']['fbc']
        self.assertTrue(fbc.startswith('fb.1.'), fbc)
        self.assertTrue(fbc.endswith('.IwAR0abcdef'), fbc)
        self.assertEqual(Lead.objects.get().fbclid, 'IwAR0abcdef')

    def test_the_real_cookie_wins_over_the_reconstruction(self):
        self.client.cookies['_fbc'] = 'fb.1.1700000000.REALCOOKIE'

        self.post(marketing_consent=True, fbclid='IwAR0abcdef')

        self.assertEqual(self.sent[0]['data'][0]['user_data']['fbc'], 'fb.1.1700000000.REALCOOKIE')

    def test_no_fbclid_and_no_cookie_means_no_fbc(self):
        self.post(marketing_consent=True)

        self.assertNotIn('fbc', self.sent[0]['data'][0]['user_data'])

    def test_overlong_values_are_truncated_not_rejected(self):
        """A referrer has no length limit; losing a real lead over one is absurd."""
        response = self.post(marketing_consent=True, referrer='https://x.example/' + 'a' * 400)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lead = Lead.objects.get()
        self.assertEqual(len(lead.referrer), 255)
        self.assertTrue(lead.referrer.startswith('https://x.example/'))
        # And the lead itself is intact, which is the part that matters.
        self.assertEqual(lead.email, 'arben@byrektore.example')

    def test_overlong_campaign_also_truncates(self):
        response = self.post(marketing_consent=True, utm_campaign='c' * 400)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(Lead.objects.get().utm_campaign), 255)
