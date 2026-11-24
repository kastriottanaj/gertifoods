// Internal links written inside copy strings.
//
// Copy in src/i18n/translations.js and src/data/blogPosts.js can link a phrase
// to another page of the site with Markdown's inline-link syntax:
//
//   'Për një metodë hap pas hapi, lexo [udhëzuesin tonë](/blog/<slug>).'
//
// The path is language-neutral (the same '/about' in all three languages), and
// components/LinkedText.astro maps it through localePath(), so the German copy
// links to /de/about without anyone writing the prefix. That also makes a link
// into another language's edition impossible to write by accident, which is the
// mistake the 2026-11-24 link audit kept suggesting.
//
// Only root-relative paths count ('/x', not '//host' or 'https://…'). Anything
// else stays literal text, so copy can never carry an external or javascript:
// link, and a typo shows up on the page, where scripts/check-build-output.js
// fails the build on it, instead of quietly becoming a link.
//
// A key that carries a link must be rendered through LinkedText. Plain-text
// consumers strip the markup with plainCopy() (llms-full.txt does, line by
// line), and check-build-output.js fails the build if raw markup reaches dist/.
const LINK = /\[([^[\]]+)\]\((\/(?!\/)[^()\s]*)\)/g;

/** Splits copy into plain-text and link segments: [{ text }, { text, href }]. */
export function copySegments(copy) {
  const text = String(copy ?? '');
  const segments = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index) });
    segments.push({ text: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

/** The copy as a reader sees it, without link markup. */
export function plainCopy(copy) {
  return String(copy ?? '').replace(LINK, '$1');
}
