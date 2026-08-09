// Lead conversion: the GA4 event and the thank-you redirect that every
// successful lead submission runs through.
//
// This module imports nothing, deliberately. The three lead forms are React
// islands, so anything they import ships to the browser — reaching into
// astro/lib/i18n.js for the paths would drag the 107 KB translation table back
// into every bundle that islandMessages.js was written to keep it out of. The
// Astro side re-exports THANK_YOU_PATHS from here instead, so the URLs still
// have exactly one definition.

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
 * Sends GA4's recommended `generate_lead` event for a submitted lead form.
 *
 * Safe to call only from a page that is going to stay open — see
 * completeLead() for why, and use that instead when a redirect follows.
 *
 * `form_source` rather than `source`: GA4 already uses `source` for traffic
 * acquisition, so sending our own would collide with a dimension that means
 * something else entirely. All three params need registering as custom
 * dimensions in GA4 admin before they show up in reports.
 *
 * @param {{formName: string, source: string, lang: string}} details
 */
export function trackLead({ formName, source, lang }) {
  const gtag = typeof window !== 'undefined' ? window.gtag : undefined;
  // Absent when an ad blocker removed the tag. Nothing to do; the lead itself
  // is already safe in the database either way.
  if (typeof gtag !== 'function') return false;

  gtag('event', 'generate_lead', {
    form_name: formName,
    form_source: source,
    form_language: lang,
  });
  return true;
}

// The key the exit-intent watcher in BaseLayout.astro checks before arming.
// Named for the sample request because that is the only form that used to set
// it; it now means "this visitor has already converted this session".
const SUBMITTED_KEY = 'sample_request_submitted';

// Where completeLead() parks the details for flushPendingLead() to pick up on
// the next page. sessionStorage, not a query parameter: it keeps the
// thank-you URL clean (one page_location per language in GA4 rather than a
// scatter of ?form=… variants) and it cannot be forged by sharing a link.
const PENDING_KEY = 'gf_pending_lead';

/**
 * Records the lead and sends the visitor to the thank-you page in their
 * language. The GA4 event is fired on arrival, by flushPendingLead().
 *
 * Firing it here instead — before the redirect — is the obvious approach and
 * it does not work. gtag.js does not transmit an event when it is called: it
 * batches, and the hit only leaves the browser about four to five seconds
 * later. `event_callback` is no help, because it acknowledges in ~6ms, long
 * before anything is on the wire. Verified in headless Chrome by wrapping
 * fetch/sendBeacon: navigating on that acknowledgement discarded the queued
 * batch and GA received nothing at all. Waiting out the batch instead would
 * mean sitting on a submitted form for five seconds.
 *
 * Deferring the event to the page that is not about to unload avoids the race
 * entirely, and lets the redirect happen immediately.
 *
 * assign() rather than replace(): Back should return to the page they
 * submitted from, which is the ordinary expectation after a form post.
 */
export function completeLead(details) {
  // Set for every form rather than only the sample request. The exit-intent
  // popup re-arms on each page load, so without this someone who submitted the
  // hero form would land on the thank-you page and be asked to request samples
  // five seconds later — directly under a heading thanking them for the
  // request they just made. SampleRequestForm already wrote this key via its
  // onSuccess callback; HeroLeadForm never did.
  try {
    sessionStorage.setItem(SUBMITTED_KEY, '1');
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({
        formName: details.formName,
        source: details.source,
        lang: details.lang,
      })
    );
  } catch {
    /* Safari private mode and the like. The lead is already recorded server
       side; losing the analytics event is not worth blocking the redirect. */
  }

  window.location.assign(thankYouPath(details.lang));
}

/**
 * Fires the pending `generate_lead` event, if this visitor actually arrived
 * here by submitting a form. Called by the thank-you page.
 *
 * The record is removed before the event is sent, so a reload of the
 * thank-you page cannot count the same lead twice — and someone who reaches
 * the URL directly, from a bookmark or a shared link, has no record at all
 * and therefore registers no conversion.
 */
export function flushPendingLead() {
  let pending;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    pending = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!pending || !pending.formName) return null;
  trackLead(pending);
  return pending;
}
