import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings


VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'


class RecaptchaUnavailable(Exception):
    """Google could not be reached or returned an unusable response."""


def verify_recaptcha(token, *, action, remote_ip=None):
    """Verify a reCAPTCHA v3 token and its request-specific risk signals."""
    if not settings.RECAPTCHA_ENABLED:
        return True
    if not token:
        return False

    payload = {
        'secret': settings.RECAPTCHA_SECRET_KEY,
        'response': token,
    }
    if remote_ip:
        payload['remoteip'] = remote_ip

    request = Request(
        VERIFY_URL,
        data=urlencode(payload).encode(),
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
        method='POST',
    )
    try:
        with urlopen(request, timeout=settings.RECAPTCHA_TIMEOUT) as response:
            result = json.loads(response.read().decode())
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RecaptchaUnavailable from exc

    if not result.get('success') or result.get('action') != action:
        return False
    try:
        score = float(result.get('score', 0))
    except (TypeError, ValueError):
        return False
    if score < settings.RECAPTCHA_MIN_SCORE:
        return False

    allowed_hostnames = settings.RECAPTCHA_ALLOWED_HOSTNAMES
    return not allowed_hostnames or result.get('hostname') in allowed_hostnames
