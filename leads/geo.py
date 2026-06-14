import logging
import urllib.request

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


def get_client_ip(request):
    """Real visitor IP, accounting for the nginx reverse proxy."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        # Leftmost entry is the originating client.
        return xff.split(',')[0].strip()
    return request.META.get('HTTP_X_REAL_IP') or request.META.get('REMOTE_ADDR')


def email_lang_for_ip(ip):
    """
    Resolve the email language from a visitor IP via geolocation.
    Best-effort: returns DEFAULT_LANG ('en') on any failure or unknown country,
    so a geolocation outage can never break lead capture.
    """
    return COUNTRY_TO_LANG.get(_lookup_country(ip), DEFAULT_LANG)


def _lookup_country(ip):
    if not ip:
        return None
    try:
        req = urllib.request.Request(
            f'https://ipapi.co/{ip}/country/',
            headers={'User-Agent': 'gertifoods.com'},
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            code = resp.read().decode('utf-8').strip().upper()
        if len(code) == 2 and code.isalpha():
            return code
        logger.warning('GeoIP returned unexpected value for %s: %r', ip, code)
    except Exception:
        logger.warning('GeoIP lookup failed for %s', ip, exc_info=True)
    return None
