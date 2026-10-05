// Lead conversion: the analytics events and the thank-you redirect that every
// successful lead submission runs through.
//
// The event fan-out itself lives in events.js — this module is the lead path
// specifically: what a submitted form is worth telling the ad platforms, and
// the ordering problem of firing an event on a page that is about to navigate.
//
// events.js is the only thing imported here, and it imports nothing in turn.
// That restraint is deliberate and worth keeping: the three lead forms are
// React islands, so anything reachable from this module ships to the browser —
// reaching into astro/lib/i18n.js for the paths would drag the 107 KB
// translation table back into every bundle that islandMessages.js was written
// to keep it out of. The Astro side re-exports THANK_YOU_PATHS from here
// instead, so the URLs still have exactly one definition.
import { track, advancedMatching, applyPixelUserData, newEventId } from './events.js';

/**
 * Where each language's thank-you page lives.
 *
 * The slug is translated, not merely prefixed: a German visitor lands on
 * /de/danke, not /de/thank-you. Albanian is the default locale and stays
 * unprefixed, matching every other route on the site.
 *
 * Keep in sync with the three route files under frontend/astro/pages/
 * (faleminderit.astro, en/thank-you.astro, de/danke.astro). Those files are
 * what actually create the URLs; this table only points at them.
 */
export const THANK_YOU_PATHS = {
  sq: '/faleminderit',
  en: '/en/thank-you',
  de: '/de/danke',
};

const DEFAULT_LANG = 'sq';

/** The thank-you URL for `lang`, falling back to the default edition. */
export function thankYouPath(lang) {
  return THANK_YOU_PATHS[lang] ?? THANK_YOU_PATHS[DEFAULT_LANG];
}

/**
 * Sends the lead conversion to GA4 (generate_lead) and Meta (Lead).
 *
 * Safe to call only from a page that is going to stay open — see
 * completeLead() for why, and use that instead when a redirect follows.
 *
 * `form_source` rather than `source`: GA4 already uses `source` for traffic
 * acquisition, so sending our own would collide with a dimension that means
 * something else entirely. All three GA4 params need registering as custom
 * dimensions in GA4 admin before they show up in reports.
 *
 * Meta gets the same two facts under the names its reporting understands:
 * content_name and content_category are the fields Events Manager breaks a
 * custom conversion down by, so 'hero_lead' vs 'sample_request' can be
 * optimised for separately without defining two events.
 *
 * @param {{formName: string, source: string, lang: string, eventID?: string}} details
 */
export function trackLead({ formName, source, lang, eventID }) {
  return track('lead', {
    ga4: {
      form_name: formName,
      form_source: source,
      form_language: lang,
    },
    meta: {
      content_name: formName,
      content_category: source,
    },
    eventID,
  });
}

// The key the exit-intent watcher in BaseLayout.astro checks before arming.
// Named for the sample request because that is the only form that used to set
// it; it now means "this visitor has already converted this session".
const SUBMITTED_KEY = 'sample_request_submitted';

/**
 * Where completeLead() parks the conversion for flushPendingLead() to pick up
 * on the next page.
 *
 * sessionStorage, not a query parameter: it keeps the thank-you URL clean (one
 * page_location per language in GA4 rather than a scatter of ?form=… variants)
 * and it cannot be forged by sharing a link.
 *
 * Exported because BaseLayout.astro reads the record too — its pixel init
 * needs the hashed advanced-matching digests before it can call fbq('init'),
 * and an inline <script> in the document head cannot import a module. Passing
 * this constant in with define:vars keeps the key from being spelled twice.
 */
export const PENDING_LEAD_KEY = 'gf_pending_lead';

/**
 * Records the lead and sends the visitor to the thank-you page in their
 * language. The analytics events are fired on arrival, by flushPendingLead().
 *
 * Firing them here instead — before the redirect — is the obvious approach and
 * it does not work. gtag.js does not transmit an event when it is called: it
 * batches, and the hit only leaves the browser about four to five seconds
 * later. `event_callback` is no help, because it acknowledges in ~6ms, long
 * before anything is on the wire. Verified in headless Chrome by wrapping
 * fetch/sendBeacon: navigating on that acknowledgement discarded the queued
 * batch and GA received nothing at all. Waiting out the batch instead would
 * mean sitting on a submitted form for five seconds.
 *
 * Deferring the events to the page that is not about to unload avoids the race
 * entirely, and lets the redirect happen immediately. The Meta Pixel is less
 * prone to it than gtag, but it rides along on the same mechanism rather than
 * being fired twice from two places.
 *
 * async because the advanced-matching digests are hashed before anything is
 * written down. Callers need not await it — it performs the navigation itself —
 * and the hashing adds well under a millisecond.
 *
 * assign() rather than replace(): Back should return to the page they
 * submitted from, which is the ordinary expectation after a form post.
 *
 * `eventID` is minted by the caller, not here, because it has to travel to
 * Django with the form POST as well — the server sends its own copy of this
 * conversion through the Conversions API, and Meta only recognises the two as
 * one event when they carry the same id. A caller that omits it still works;
 * the browser event simply stands alone.
 *
 * @param {{formName: string, source: string, lang: string, eventID?: string,
 *          pii?: {email?: string, phone?: string, firstName?: string,
 *                 lastName?: string, fullName?: string}}} details
 */
export async function completeLead(details) {
  // Hashed here rather than on the thank-you page so the plaintext email and
  // phone never leave this function: what gets stored, and later sent, is a
  // set of SHA-256 digests. Never throws — see advancedMatching.
  const am = await advancedMatching(details.pii);

  // Set for every form rather than only the sample request. The exit-intent
  // popup re-arms on each page load, so without this someone who submitted the
  // hero form would land on the thank-you page and be asked to request samples
  // five seconds later — directly under a heading thanking them for the
  // request they just made. SampleRequestForm already wrote this key via its
  // onSuccess callback; HeroLeadForm never did.
  try {
    sessionStorage.setItem(SUBMITTED_KEY, '1');
    sessionStorage.setItem(
      PENDING_LEAD_KEY,
      JSON.stringify({
        formName: details.formName,
        source: details.source,
        lang: details.lang,
        // Read by BaseLayout's pixel init on the thank-you page, which is the
        // only place Meta will accept it as manual advanced matching.
        am,
        // The id the form already posted to Django, so the pixel's copy of
        // this conversion and the server's deduplicate against each other.
        eventID: details.eventID || newEventId(),
      })
    );
  } catch {
    /* Safari private mode and the like. The lead is already recorded server
       side; losing the analytics event is not worth blocking the redirect. */
  }

  window.location.assign(thankYouPath(details.lang));
}

/**
 * Records a lead without navigating away.
 *
 * For the catalog form, whose payoff is the email Django sends on submit — the
 * success message tells the visitor to go and check their inbox, so pulling the
 * tab to the thank-you page would take them away from the one instruction that
 * matters. Nothing is about to unload, so there is no batching race to defer
 * around and the events go out immediately.
 *
 * The advanced matching has to be attached by re-initialising the pixel here,
 * because this page's init call ran long before the visitor typed an email
 * address. See applyPixelUserData.
 */
export async function trackLeadInPlace({ formName, source, lang, pii, eventID }) {
  const am = await advancedMatching(pii);
  if (am) applyPixelUserData(am);
  return trackLead({ formName, source, lang, eventID: eventID || newEventId() });
}

/**
 * Fires the pending lead events, if this visitor actually arrived here by
 * submitting a form. Called by the thank-you page.
 *
 * The record is removed before the events are sent, so a reload of the
 * thank-you page cannot count the same lead twice — and someone who reaches
 * the URL directly, from a bookmark or a shared link, has no record at all
 * and therefore registers no conversion.
 */
export function flushPendingLead() {
  let pending;
  try {
    const raw = sessionStorage.getItem(PENDING_LEAD_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_LEAD_KEY);
    pending = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!pending || !pending.formName) return null;

  // `am` is deliberately not passed on: BaseLayout already handed those
  // digests to fbq('init') while this document was parsing, which is the only
  // point at which Meta counts them as advanced matching.
  trackLead({
    formName: pending.formName,
    source: pending.source,
    lang: pending.lang,
    eventID: pending.eventID,
  });
  return pending;
}
