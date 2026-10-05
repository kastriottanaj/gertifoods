// Where a lead came from — the half of the funnel the database could not see.
//
// Meta reports what it costs to get a lead. It cannot report which campaign
// produced the leads that became paying wholesale customers, because the two
// facts live in different systems: the campaign is Meta's, and "this company
// now buys from us" is a status field in the Django admin. Nothing joined
// them, so the only measurable number was cost per lead — which, for a
// business whose leads vary from a café wanting two trays to a chain wanting
// pallets weekly, is close to meaningless.
//
// This module records the campaign markers on arrival and hands them to the
// form on submission, so each lead row carries its own origin.
//
// The capture has to happen on arrival, not at submit time: a visitor lands on
// /furnizim/byrektore?utm_campaign=byrektore-oct from an ad, reads two more
// pages, and submits from somewhere else entirely. By then the query string is
// long gone.

const STORE_KEY = 'gf_attribution';

// The five standard UTM parameters, plus the click identifiers the ad
// platforms add themselves. fbclid matters twice over: it is also what the
// server rebuilds Meta's `fbc` match parameter from when the pixel was blocked
// and never set the cookie.
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const CLICK_KEYS = ['fbclid', 'gclid'];
const ALL_KEYS = [...UTM_KEYS, ...CLICK_KEYS, 'landing_page', 'referrer'];

// Matches the CharField length in leads/models.py. A referrer can be
// arbitrarily long and a truncated one is still useful; a rejected lead is not.
const MAX_LENGTH = 255;

const clip = (value) => String(value ?? '').slice(0, MAX_LENGTH);

function read() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Records this arrival, if it carries anything worth recording.
 *
 * Last campaign touch wins. A visitor who clicks the byrektore ad, comes back
 * a week later through the Tirana ad and then converts is credited to Tirana —
 * matching how Meta itself attributes, so the two systems agree rather than
 * quietly disagreeing.
 *
 * A visit with no markers never overwrites a stored campaign: arriving by ad
 * and returning directly a day later must not erase the ad. It is only
 * recorded when nothing is stored at all, so organic and direct traffic still
 * gets an origin instead of a blank.
 *
 * localStorage rather than sessionStorage because this is B2B: the gap between
 * clicking an ad and actually filling in a form is measured in days here, not
 * minutes, and sessionStorage would be gone by then.
 */
export function captureAttribution() {
  if (typeof window === 'undefined') return;

  let params;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return;
  }

  const record = {};
  for (const key of [...UTM_KEYS, ...CLICK_KEYS]) {
    const value = params.get(key);
    if (value) record[key] = clip(value);
  }
  const isCampaign = Object.keys(record).length > 0;

  // Nothing to add: no markers, and an origin is already on file.
  if (!isCampaign && read()) return;

  record.landing_page = clip(window.location.pathname);
  // Only the external referrer is interesting. Our own pages would otherwise
  // overwrite the real source the moment the visitor clicked a second link.
  try {
    const ref = document.referrer;
    if (ref && new URL(ref).host !== window.location.host) record.referrer = clip(ref);
  } catch {
    /* malformed referrer; not worth failing over */
  }

  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(record));
  } catch {
    /* Safari private mode. The lead still submits, just without an origin. */
  }
}

/**
 * The stored origin, shaped for the lead API. Always an object, so a caller
 * can spread it into the payload without checking.
 */
export function getAttribution() {
  const record = read();
  if (!record) return {};

  // Whitelisted rather than passed through: whatever ends up in localStorage
  // is attacker-controllable, and the API should only ever see fields it
  // actually has columns for.
  const payload = {};
  for (const key of ALL_KEYS) {
    if (record[key]) payload[key] = clip(record[key]);
  }
  return payload;
}
