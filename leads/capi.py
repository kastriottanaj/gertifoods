"""Meta Conversions API — the server-side half of every lead conversion.

The browser pixel reports a lead from the visitor's machine, which means it
reports nothing at all when an ad blocker, iOS tracking prevention or a
corporate proxy removes it. For a B2B site that is not a rounding error: the
people being advertised to here are businesses, often on managed devices.

This module sends the same conversion a second time, from the server, where
none of that applies. Both copies carry the same ``event_id``; Meta keeps
whichever arrives first and discards the duplicate, so a lead is never counted
twice no matter how many of the two paths succeed.

The server copy is also the better one. It has the email and phone in plain
text, so it can hash them properly rather than relying on what the browser
managed to collect; it sees the real client IP and user agent; and it reads the
``_fbc`` / ``_fbp`` first-party cookies straight off the request. Those are the
parameters Meta matches on, and better matching is the whole point — an
unmatched conversion teaches the ad account nothing.

Outbound calls use urllib rather than requests, matching recaptcha.py: the
pinned, OSV-audited requirements.txt is not worth growing for one POST.

Sending is best-effort by design, exactly like leads/emails.py. A lead that is
already in the database must never be lost because Meta was slow, and nothing
in here is allowed to raise into the request cycle.
"""

import hashlib
import json
import logging
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

logger = logging.getLogger(__name__)

GRAPH_URL = 'https://graph.facebook.com/{version}/{dataset_id}/events'

# Country codes for the two markets the forms serve. Meta wants a phone number
# as digits including the country code, but buyers type the local form
# ('049 111 150'), so a number without one has to be inferred.
#
# The discriminator is the trunk prefix: Kosovo mobiles are 04X, Albanian
# mobiles are 06X. Guessing wrong yields a hash that matches nobody — never a
# hash that matches the wrong person — so the cost of an error is one unmatched
# lead and the cost of not trying is every locally-typed number.
#
# Kept identical to normalizePhone() in frontend/src/lib/events.js on purpose:
# the two sides must derive the same digest from the same person, or Meta sees
# two different users where there is one.
KOSOVO_CC = '383'
ALBANIA_CC = '355'


def _sha256(value):
    """Meta's required hash: SHA-256 over the normalised value, hex digest."""
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def normalize_email(value):
    """Trimmed and lowercased, or '' when there is nothing matchable."""
    email = str(value or '').strip().lower()
    # Not validation — the serializer already rejected anything unusable. This
    # only avoids hashing a string that cannot correspond to an account.
    return email if '@' in email else ''


def normalize_phone(value):
    """Digits only, country code first."""
    digits = ''.join(ch for ch in str(value or '') if ch.isdigit())
    if not digits:
        return ''

    # '00383…' is the written form of a leading '+'.
    if digits.startswith('00'):
        digits = digits[2:]

    if digits.startswith('0'):
        national = digits[1:]
        cc = ALBANIA_CC if national.startswith('6') else KOSOVO_CC
        digits = cc + national

    # Shorter than any real international number; hashing it would only add an
    # unmatchable parameter to the event.
    return digits if len(digits) >= 8 else ''


def normalize_name(value):
    """Lowercase letters only.

    str.isalpha() rather than a-z: Albanian names carry ë and ç, and stripping
    them would change the name rather than normalise it.
    """
    kept = ''.join(ch for ch in str(value or '') if ch.isalpha() or ch in " '-")
    return ' '.join(kept.lower().split())


def split_name(full_name):
    """('Ardit Hoxha') -> ('ardit', 'hoxha').

    The sample-request form asks for one contact name rather than two fields.
    First token is the given name, the remainder the family name — wrong for a
    few name orders, and still a better match than sending neither.
    """
    parts = normalize_name(full_name).split(' ')
    if not parts or not parts[0]:
        return '', ''
    return parts[0], ' '.join(parts[1:])


def build_user_data(
    *,
    email='',
    phone='',
    first_name='',
    last_name='',
    full_name='',
    client_ip='',
    user_agent='',
    fbc='',
    fbp='',
):
    """The ``user_data`` block Meta matches the conversion against.

    em/ph/fn/ln are hashed; the rest must be sent in the clear, which is what
    Meta's schema specifies — they are not identifiers on their own.

    Hashed fields go out as single-element lists, the form Meta's own examples
    use.
    """
    if not first_name and not last_name and full_name:
        first_name, last_name = split_name(full_name)

    hashed = {
        'em': normalize_email(email),
        'ph': normalize_phone(phone),
        'fn': normalize_name(first_name),
        'ln': normalize_name(last_name),
    }

    user_data = {key: [_sha256(value)] for key, value in hashed.items() if value}

    # Unhashed signals. fbc/fbp are the strongest of them: they are Meta's own
    # click and browser identifiers, read from the first-party cookies the
    # pixel set on this domain.
    for key, value in (
        ('client_ip_address', client_ip),
        ('client_user_agent', user_agent),
        ('fbc', fbc),
        ('fbp', fbp),
    ):
        if value:
            user_data[key] = value

    return user_data


def send_event(
    *,
    event_name,
    event_id,
    user_data,
    custom_data=None,
    event_source_url='',
    event_time=None,
):
    """POST one event to the Conversions API.

    Returns True only when Meta acknowledges the event. Never raises: every
    failure path logs and returns False, because the caller is a view that has
    already saved the lead.

    ``event_id`` is what makes this safe to run alongside the browser pixel.
    Meta deduplicates on (event_name, event_id), so the copy that arrives
    second is dropped rather than counted.
    """
    if not settings.META_CAPI_ENABLED:
        return False

    # Meta rejects an event with no matchable parameter, and such an event
    # would be worthless anyway.
    if not user_data:
        logger.warning('Meta CAPI: refusing to send %s with no user data', event_name)
        return False

    event = {
        'event_name': event_name,
        'event_time': int(event_time or time.time()),
        'event_id': event_id,
        # 'website' tells Meta this conversion happened on the site, which is
        # what lets it be attributed to a click on an ad.
        'action_source': 'website',
        'user_data': user_data,
    }
    if event_source_url:
        event['event_source_url'] = event_source_url
    if custom_data:
        event['custom_data'] = custom_data

    payload = {'data': [event]}
    # Routes the event to Events Manager's Test Events tab instead of counting
    # it, so a staging box or a manual check never pollutes the real dataset.
    if settings.META_CAPI_TEST_EVENT_CODE:
        payload['test_event_code'] = settings.META_CAPI_TEST_EVENT_CODE

    url = GRAPH_URL.format(
        version=settings.META_CAPI_API_VERSION,
        dataset_id=settings.META_PIXEL_ID,
    )
    request = Request(
        url,
        data=json.dumps(payload).encode(),
        headers={
            'Content-Type': 'application/json',
            # The token is a bearer credential: it goes in the header, never in
            # the query string, where it would be written to the access log of
            # every proxy between here and Meta.
            'Authorization': f'Bearer {settings.META_CAPI_ACCESS_TOKEN}',
        },
        method='POST',
    )

    try:
        with urlopen(request, timeout=settings.META_CAPI_TIMEOUT) as response:
            result = json.loads(response.read().decode())
    except HTTPError as exc:
        # Meta puts the reason in the body, and it is the only way to tell an
        # expired token from a malformed payload.
        try:
            detail = exc.read().decode()[:500]
        except Exception:
            detail = ''
        logger.error('Meta CAPI %s rejected (%s): %s', event_name, exc.code, detail)
        return False
    except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        logger.error('Meta CAPI %s could not be sent: %s', event_name, exc)
        return False

    received = result.get('events_received')
    if received:
        return True

    logger.error('Meta CAPI %s acknowledged nothing: %s', event_name, result)
    return False


def send_lead_event(*, form_name, source, event_id, user_data, event_source_url=''):
    """The site's one conversion, as Meta names it.

    content_name / content_category carry the same two facts the browser event
    sends, under the names Events Manager breaks a custom conversion down by —
    so 'hero_lead' and 'sample_request' stay separable whichever path delivered
    the event.
    """
    return send_event(
        event_name='Lead',
        event_id=event_id,
        user_data=user_data,
        custom_data={'content_name': form_name, 'content_category': source},
        event_source_url=event_source_url,
    )
