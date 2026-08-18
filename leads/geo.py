import logging

from django.conf import settings
from geoip2fast import GeoIP2Fast

logger = logging.getLogger(__name__)

# Visitor country (ISO 3166-1 alpha-2) -> email language.
# Kosovo (XK) + Albania (AL) -> Albanian; Germany -> German; everyone else
# (incl. the other areas we serve: Hungary, Croatia, Slovakia) -> English.
COUNTRY_TO_LANG = {
    'XK': 'sq',  # Kosovo
    'AL': 'sq',  # Albania
    'DE': 'de',  # Germany
}
DEFAULT_LANG = 'en'

# Load the bundled, offline country database once per worker process. No
# external calls, no rate limits, no visitor IPs leaving the server.
try:
    _geoip = GeoIP2Fast()
except Exception:
    logger.exception('Failed to load GeoIP2Fast database')
    _geoip = None


def get_client_ip(request):
    """Real visitor IP, accounting for the nginx reverse proxy.

    Reads the *rightmost* X-Forwarded-For entry, not the leftmost.

    nginx sets the header with `$proxy_add_x_forwarded_for`, which appends the
    connecting address to whatever the client already sent. So on a request
    forged with `X-Forwarded-For: 1.2.3.4` the header arrives as
    "1.2.3.4, <real client>": everything except the last entry is attacker
    controlled. Taking the leftmost entry, as this used to, handed a caller full
    control of the IP — which fed reCAPTCHA's `remoteip` risk signal and the
    GeoIP language choice.

    This is the same rule DRF applies for throttling (see NUM_PROXIES in
    config/settings.py), and it reads the count from that setting rather than
    repeating it, so the two cannot drift apart — they must agree, because they
    describe the same deployment topology.
    """
    num_proxies = settings.REST_FRAMEWORK.get('NUM_PROXIES')
    xff = request.META.get('HTTP_X_FORWARDED_FOR')

    if xff and num_proxies:
        addrs = [addr.strip() for addr in xff.split(',') if addr.strip()]
        if addrs:
            # Mirrors rest_framework.throttling.SimpleRateThrottle.get_ident:
            # count in from the right, clamped to what is actually present.
            return addrs[-min(num_proxies, len(addrs))]

    # X-Real-IP is set by nginx from $remote_addr, so it overwrites anything the
    # client sent and is safe to trust ahead of the raw REMOTE_ADDR.
    return request.META.get('HTTP_X_REAL_IP') or request.META.get('REMOTE_ADDR')


def email_lang_for_ip(ip):
    """
    Resolve the email language from a visitor IP.
    Best-effort: returns DEFAULT_LANG ('en') for unknown/private IPs or any
    failure, so geolocation can never break lead capture.
    """
    return COUNTRY_TO_LANG.get(_country_for_ip(ip), DEFAULT_LANG)


def _country_for_ip(ip):
    if not ip or _geoip is None:
        return None
    try:
        code = _geoip.lookup(ip).country_code
        return code.upper() if code else None
    except Exception:
        logger.warning('GeoIP lookup failed for %s', ip, exc_info=True)
        return None
