import logging

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
    """Real visitor IP, accounting for the nginx reverse proxy."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        # Leftmost entry is the originating client.
        return xff.split(',')[0].strip()
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
