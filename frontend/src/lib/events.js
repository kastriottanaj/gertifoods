// The events manager: every analytics event this site sends, in one place.
//
// Until now there was exactly one event — GA4's generate_lead, fired from
// conversion.js — and the Meta Pixel in BaseLayout.astro sent nothing but
// PageView. Events Manager therefore saw traffic and no conversions, which is
// the reason no Custom Audience could be built on "this company asked us for
// something", no campaign could optimise for leads, and remarketing had
// nothing to exclude converters with.
//
// Each event goes to both platforms from a single call. The alternative — a
// gtag line here and an fbq line there — is how two ad platforms end up
// quietly measuring different things, and it is impossible to notice after the
// fact because neither one reports what the other missed.
//
// This module imports nothing, deliberately, for the same reason
// conversion.js documents: it is pulled in by the React lead-form islands AND
// by BaseLayout's site-wide script, so anything it imported would be shipped
// to every page of the site.

/**
 * Our event names, and what each platform calls the same thing.
 *
 * GA4 and Meta disagree on naming for every event we send, so the mapping has
 * to live somewhere; keeping it in one table means a call site names the
 * business event ('lead') and cannot accidentally send Meta's name to GA4.
 *
 * `ga4: null` means the event is Meta-only on purpose — see view_content.
 */
const EVENTS = {
  // The site's one real conversion: a company has handed over its details.
  lead: { ga4: 'generate_lead', meta: 'Lead' },

  // Buying interest short of a submission — a product page or a buyer-segment
  // landing page. Meta-only: GA4 already records a page_view for these URLs,
  // and sending a second event for the same visit would double-count the
  // interest in every GA4 report that counts events.
  view_content: { ga4: null, meta: 'ViewContent' },

  // A WhatsApp, phone or email click. For a wholesale bakery this is not a
  // soft signal: most buyers would rather ask about pallet prices than fill in
  // a form, so these clicks are where a large share of real enquiries start.
  contact: { ga4: 'contact', meta: 'Contact' },
};

/** window.gtag, or null when an ad blocker removed the tag. */
function getGtag() {
  if (typeof window === 'undefined') return null;
  return typeof window.gtag === 'function' ? window.gtag : null;
}

/**
 * window.fbq, or null when an ad blocker removed the pixel.
 *
 * Defined synchronously by the loader stub in BaseLayout's head, well before
 * fbevents.js arrives, so this is a function almost immediately on every page
 * — calls made before the library loads are queued rather than lost.
 */
function getFbq() {
  if (typeof window === 'undefined') return null;
  return typeof window.fbq === 'function' ? window.fbq : null;
}

/**
 * Sends one business event to both platforms.
 *
 * Neither platform's absence is an error: an ad blocker removes one or both on
 * a meaningful share of visits, and the lead itself is already safe in the
 * database by the time anything here runs.
 *
 * @param {keyof typeof EVENTS} name
 * @param {{ga4?: object, meta?: object, eventID?: string}} params
 *   Per-platform parameters, because the two use different key names for the
 *   same facts, and `eventID` for Meta's deduplication.
 * @returns {boolean} whether at least one platform accepted the event.
 */
export function track(name, { ga4 = {}, meta = {}, eventID } = {}) {
  const spec = EVENTS[name];
  // A typo in an event name would otherwise send a silent nothing, which is
  // the single hardest analytics bug to spot.
  if (!spec) return false;

  let sent = false;

  const gtag = getGtag();
  if (gtag && spec.ga4) {
    gtag('event', spec.ga4, ga4);
    sent = true;
  }

  const fbq = getFbq();
  if (fbq && spec.meta) {
    // fbq's fourth argument is the options bag. eventID is what would let a
    // future Conversions API send of the same conversion be recognised as the
    // same event rather than counted twice. It costs nothing today and cannot
    // be backfilled later, so every event carries one from the start.
    if (eventID) fbq('track', spec.meta, meta, { eventID });
    else fbq('track', spec.meta, meta);
    sent = true;
  }

  return sent;
}

/**
 * A fresh id for one conversion, used to deduplicate a browser event against
 * the same event sent server-side.
 */
export function newEventId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `gf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Advanced matching
//
// Meta can only tie a conversion to an account if the event carries something
// identifying. Without it a Lead is an anonymous browser, which is close to
// useless for a lookalike audience and worth very little for remarketing.
//
// Everything below is hashed with SHA-256 before it leaves this module, so no
// plaintext email or phone number is ever written to sessionStorage or put on
// the wire. Meta documents hashed values as accepted for these fields and
// hashes plaintext itself when given it — doing it here rather than letting
// the pixel do it means the plaintext never exists outside the form state.
// ---------------------------------------------------------------------------

// Country codes for the two markets the forms actually serve. Meta wants a
// phone number as digits including the country code, but buyers type the local
// form ('049 111 150'), so a number without one has to be guessed at.
//
// The discriminator is the trunk prefix: Kosovo mobiles are 04X, Albanian
// mobiles are 06X. Guessing wrong produces a hash that matches nobody, never a
// hash that matches the wrong person — so the cost of an error here is one
// unmatched lead, and the cost of not trying is every locally-typed number.
const KOSOVO_CC = '383';
const ALBANIA_CC = '355';

/** SHA-256 hex digest, or null where the browser will not do it. */
async function sha256Hex(value) {
  try {
    // Absent on plain http: crypto.subtle is restricted to secure contexts.
    // Production is https and localhost counts as secure, so this is really
    // only a guard against an odd preview environment.
    const subtle = typeof crypto !== 'undefined' ? crypto.subtle : undefined;
    if (!subtle || typeof TextEncoder === 'undefined') return null;

    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

/** Meta's normalisation for an email: trimmed and lowercased. */
function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  // Not validation — the server already rejected anything unusable. This only
  // avoids hashing a string that obviously cannot match an account.
  return email.includes('@') ? email : '';
}

/** Meta's normalisation for a phone number: digits only, country code first. */
function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D+/g, '');
  if (!digits) return '';

  // '00383…' — the written form of a leading '+'.
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith('0')) {
    const national = digits.slice(1);
    const cc = national.startsWith('6') ? ALBANIA_CC : KOSOVO_CC;
    digits = cc + national;
  }

  // Shorter than any real international number; hashing it would only add an
  // unmatchable parameter to the event.
  return digits.length >= 8 ? digits : '';
}

/**
 * Meta's normalisation for a name: lowercase letters only.
 *
 * The \p{L} class rather than a-z is deliberate — Albanian names carry ë and ç,
 * and stripping them would change the name rather than normalise it.
 */
function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\s'-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Hashed advanced-matching parameters for one lead.
 *
 * Returns null when there is nothing usable to send, so callers can treat
 * "no match data" and "this browser cannot hash" identically.
 *
 * Never throws: a failure here must not be able to stop a form from
 * completing, which is why every caller can ignore the result.
 *
 * @param {{email?: string, phone?: string, firstName?: string,
 *          lastName?: string, fullName?: string}} pii
 * @returns {Promise<object|null>} Meta's em/ph/fn/ln keys, SHA-256 hashed.
 */
export async function advancedMatching(pii) {
  if (!pii) return null;

  try {
    let { firstName, lastName } = pii;

    // The sample-request form asks for one "contact name" rather than two
    // fields, so split it here instead of making each form invent its own
    // handling. First token is the given name, the rest the family name —
    // wrong for a few name orders, and still a better match than sending
    // neither.
    if (!firstName && !lastName && pii.fullName) {
      const parts = normalizeName(pii.fullName).split(' ');
      firstName = parts[0];
      if (parts.length > 1) lastName = parts.slice(1).join(' ');
    }

    const fields = {
      em: normalizeEmail(pii.email),
      ph: normalizePhone(pii.phone),
      fn: normalizeName(firstName),
      ln: normalizeName(lastName),
    };

    const hashed = {};
    for (const [key, value] of Object.entries(fields)) {
      if (!value) continue;
      const digest = await sha256Hex(value);
      if (digest) hashed[key] = digest;
    }

    return Object.keys(hashed).length ? hashed : null;
  } catch {
    return null;
  }
}

/**
 * Whether the visitor accepted the cookie banner.
 *
 * Read by the lead forms and sent to Django with the submission. The server
 * cannot work it out for itself — the choice is kept in localStorage, which
 * never reaches it — and it needs to know, because the Conversions API send is
 * a transmission of personal data to Meta for advertising and is therefore
 * exactly what the banner asks about. Without this, declining the banner would
 * stop the pixel and change nothing about the server.
 *
 * Defaults to false: an unanswered banner is not consent.
 */
export function hasMarketingConsent() {
  try {
    return localStorage.getItem('gf_cookie_consent') === 'granted';
  } catch {
    return false;
  }
}

/**
 * Attaches advanced-matching data to the pixel for events fired from here on.
 *
 * Meta only treats user data as manual advanced matching when it arrives in
 * the `fbq('init', …)` call itself — `fbq('set', …)` is ignored for this — so
 * the only way to add it after the page has loaded is to re-initialise the
 * pixel. That is Meta's own documented approach for apps that learn who the
 * visitor is mid-session, and the helper doing it lives in BaseLayout so the
 * pixel ID stays defined in exactly one place.
 *
 * Used only by the form that stays on the page. The two that redirect have
 * their digests read by BaseLayout before its single init call instead, which
 * needs no re-initialisation at all.
 */
export function applyPixelUserData(userData) {
  if (!userData || typeof window === 'undefined') return false;
  const apply = window.gfPixelUserData;
  if (typeof apply !== 'function') return false;
  apply(userData);
  return true;
}
