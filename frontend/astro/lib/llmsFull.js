// The text behind /llms-full.txt.
//
// llms.txt (public/llms.txt, hand-written) is the short index: what the
// company is and where each page lives. This is the long form the llms.txt
// convention pairs it with — the content of every public page, in English, in
// one file, so an agent that has fetched it never has to crawl the site.
//
// It is generated rather than written because the alternative goes stale the
// first time someone edits a page. Everything below is read from the same
// sources the pages render from — the translation table, the blog and area
// data files, and the catalogue the build already fetches — so the file can
// only say what the site says. The one editorial decision is *which* keys to
// include: headings, body copy and facts, but not button labels, alt text,
// SERP titles or the reviews block (a quote is only useful with the review it
// came from, and this file cannot link to one).
//
// A key that has no English entry falls back to Albanian in useTranslations(),
// like the pages do. A key missing from every language comes back as its own
// name; those are dropped rather than printed.
import { localePath } from './i18n.js';
import { productCopy } from './productCopy.js';

/**
 * Builds the file for one language edition — the English one in practice, but
 * the copy sources are all per-language, so the caller chooses.
 *
 * @param {object} args
 * @param {string} args.origin         site origin, no trailing slash (Astro.site)
 * @param {string} args.lang           edition to render
 * @param {(key: string) => string} args.t  useTranslations(lang)
 * @param {Array} args.products        getProducts() result
 * @param {Array} args.blogPosts       src/data/blogPosts.js
 * @param {Array} args.areas           src/data/areas.js
 */
export function buildLlmsFull({ origin, lang, t, products, blogPosts, areas }) {
  const ORIGIN = origin.replace(/\/$/, '');
  // The address a language-neutral path is served at, absolute.
  const url = (l, path) => `${ORIGIN}${localePath(l, path)}`;

  // t() echoes the key when nothing is authored under it; treat that as absent
  // so an unset optional key produces no line, not a line reading `about_x`.
  const has = (key) => t(key) !== key;
  const text = (key) => (has(key) ? t(key) : null);
  const copy = productCopy(t);

  const out = [];
  const line = (s = '') => out.push(s);
  const para = (s) => {
    if (s) {
      line(s);
      line();
    }
  };
  const heading = (level, s) => {
    line(`${'#'.repeat(level)} ${s}`);
    line();
  };
  // "Title: body" bullets from a run of numbered or named keys; entries whose
  // title is unset are skipped, which is how the optional fourth supply point
  // and the per-country FAQ collapse to nothing.
  const bullets = (pairs) => {
    const items = pairs
      .map(([titleKey, bodyKey]) => {
        const title = text(titleKey);
        if (!title) return null;
        const body = bodyKey ? text(bodyKey) : null;
        return body ? `- ${title}: ${body}` : `- ${title}`;
      })
      .filter(Boolean);
    if (items.length) {
      items.forEach(line);
      line();
    }
  };
  const numbered = (prefix, count, titleSuffix, bodySuffix) =>
    Array.from({ length: count }, (_, i) => [
      `${prefix}_${i + 1}_${titleSuffix}`,
      bodySuffix ? `${prefix}_${i + 1}_${bodySuffix}` : null,
    ]);

  // ---------------------------------------------------------------- header
  heading(1, 'Gerti Foods');
  para(
    '> B2B factory in Prizren, Kosovo supplying bakeries, hotels, restaurants, ' +
      'supermarkets, catering and distributors with ISO 22000 certified half-baked ' +
      '(par-baked) products — byrek (pies) and tortillas — that finish baking fresh ' +
      'in 15 to 20 minutes.'
  );
  para(
    `This is the full-text edition of ${ORIGIN}/llms.txt: the content of every ` +
      'public page on gertifoods.com, in English, in one file. The site is published ' +
      `in Albanian (default, unprefixed), English (${ORIGIN}/en/...) and German ` +
      `(${ORIGIN}/de/...). This file is generated at build time from the same sources ` +
      'the pages render from, so it matches what the site shows.'
  );

  // ----------------------------------------------------------------- about
  heading(2, `About Gerti Foods (${url(lang, '/about')})`);
  para(text('about_hero_body'));
  heading(3, text('about_story_heading') ?? 'Our story');
  para(text('about_story_body_1'));
  para(text('about_story_body_2'));
  bullets([
    ['about_story_point_1'],
    ['about_story_point_2'],
    ['about_story_point_3'],
  ]);
  heading(3, 'Key facts');
  // The About page's stat strip is labels beside numbers that live in the
  // template, so the numbers are stated here in words instead of read from it.
  line('- Founded: January 2024');
  line('- Location: Str. Kalaja e Shkupit, 20000 Prizren, Kosovo');
  line('- Founders: three partners from the Hasi region, a bread-baking tradition of more than 600 years');
  line('- Certifications: HACCP, ISO 22000, IFS, BRC, Halal');
  line('- Production capacity: byrek up to 800 pieces per hour; tortillas up to 3,000 pieces per hour');
  line('- Bake time on site: 15–20 minutes from frozen');
  line('- Sales model: B2B only, no consumer retail');
  line('- Markets: Kosovo, Albania, Hungary, Croatia, Slovakia, Germany');
  line();
  heading(3, text('about_choose_title') ?? 'Why businesses choose Gerti Foods');
  bullets([
    ['about_benefit_quality', 'about_benefit_quality_body'],
    ['about_benefit_service', 'about_benefit_service_body'],
    ['about_benefit_supply', 'about_benefit_supply_body'],
    ['about_choose_local', 'about_choose_local_body'],
    ['about_choose_success', 'about_choose_success_body'],
    ['about_choose_partner', 'about_choose_partner_body'],
  ]);

  // -------------------------------------------------------- why half-baked
  heading(2, `Why half-baked (${url(lang, '/')})`);
  para(text('home_hero_subtitle'));
  if (has('pain_title')) {
    heading(3, text('pain_title'));
    para(text('pain_subtitle'));
    if (has('pain_without_label')) {
      line(`${text('pain_without_label')}:`);
      line();
      bullets(numbered('pain_without', 3, 'title', 'body'));
    }
    if (has('pain_with_label')) {
      line(`${text('pain_with_label')}:`);
      line();
      bullets(numbered('pain_with', 3, 'title', 'body'));
    }
  }
  if (has('pillars_title')) {
    heading(3, text('pillars_title'));
    para(text('pillars_subtitle'));
    bullets(numbered('pillar', 3, 'title', 'body'));
  }
  if (has('process_title')) {
    heading(3, text('process_title'));
    para(text('process_subtitle'));
    const steps = numbered('process_step', 3, 'title', 'body')
      .map(([titleKey, bodyKey], i) => {
        const title = text(titleKey);
        return title ? `${i + 1}. ${title}: ${text(bodyKey) ?? ''}`.trim() : null;
      })
      .filter(Boolean);
    steps.forEach(line);
    if (steps.length) line();
  }

  // ---------------------------------------------------------- who we serve
  if (has('segments_title')) {
    heading(2, text('segments_title'));
    para(text('segments_subtitle'));
    bullets([
      ['segment_bakeries_title', 'segment_bakeries_body'],
      ['segment_horeca_title', 'segment_horeca_body'],
      ['segment_retail_title', 'segment_retail_body'],
      ['segment_catering_title', 'segment_catering_body'],
    ]);
  }

  // -------------------------------------------------------------- products
  heading(2, `Products (${url(lang, '/products')})`);
  para(text('products_about_intro'));
  bullets(numbered('products_about', 4, 'title', 'body'));

  // The landing-style product pages are request-an-offer pages and print no
  // price (ProductDetail.astro, isLandingDetail); say the same here rather than
  // quoting a number the page itself withholds.
  const PRICE_ON_REQUEST = new Set([
    'family-pack-pite-4',
    'pite-me-djathe',
    'pite-me-mish',
    'pite-me-spinaq',
  ]);
  for (const product of products) {
    const unit = copy.unit(product);
    heading(3, `${copy.name(product)} (${url(lang, `/products/${product.slug}`)})`);
    para(copy.description(product));
    line(`- Category: ${copy.category(product)}`);
    line(
      PRICE_ON_REQUEST.has(product.slug)
        ? `- ${text('products_price_on_request') ?? 'Price on request'}`
        : `- Price: €${product.price} per ${unit}`
    );
    line(`- Minimum order: ${product.min_order_quantity} × ${unit}`);
    line();
  }

  // The tortilla line is a hand-built landing page, not a catalogue row (see
  // the note in config/sitemaps.py), so it is described from its own keys.
  heading(3, `${text('tt_title') ?? 'Tortillas'} (${url(lang, '/products/tortilla')})`);
  para(text('tt_intro'));
  bullets([
    ['tt_trust_cert_label', 'tt_trust_cert'],
    ['tt_trust_standards_label', 'tt_trust_standards'],
    ['tt_trust_capacity_label', 'tt_trust_capacity'],
    ['tt_trust_b2b_label', 'tt_trust_b2b'],
  ]);
  if (has('tt_benefits_title')) {
    line(`${text('tt_benefits_title')}:`);
    line();
    bullets([
      ['tt_benefit_ready', 'tt_benefit_ready_body'],
      ['tt_benefit_volume', 'tt_benefit_volume_body'],
      ['tt_benefit_consistent', 'tt_benefit_consistent_body'],
    ]);
  }
  if (has('tt_variants_title')) {
    line(`${text('tt_variants_title')}:`);
    line();
    bullets([
      ['tt_variant_plain', 'tt_variant_plain_body'],
      ['tt_variant_vegetable', 'tt_variant_vegetable_body'],
      ['tt_variant_fruit', 'tt_variant_fruit_body'],
      ['tt_variant_cinnamon', 'tt_variant_cinnamon_body'],
    ]);
  }
  if (has('tt_solutions_title')) {
    line(`${text('tt_solutions_title')}:`);
    line();
    bullets([
      ['tt_for_bakeries', 'tt_for_bakeries_body'],
      ['tt_for_horeca', 'tt_for_horeca_body'],
      ['tt_for_retail', 'tt_for_retail_body'],
      ['tt_for_catering', 'tt_for_catering_body'],
    ]);
  }

  // ---------------------------------------------------------------- areas
  heading(2, `Where we deliver (${url(lang, '/areas')})`);
  para(text('areas_intro'));
  bullets([
    ['areas_reliable', 'areas_reliable_body'],
    ['areas_quality', 'areas_quality_body'],
    ['areas_partner', 'areas_partner_body'],
  ]);
  if (has('areas_how_title')) {
    heading(3, text('areas_how_title'));
    para(text('areas_how_intro'));
    bullets(numbered('areas_how', 4, 'title', 'body'));
  }

  for (const area of areas) {
    const k = (suffix) => `${area.slug}_${suffix}`;
    heading(3, `${t(area.nameKey)} (${url(lang, `/areas/${area.slug}`)})`);
    para(text(k('hero_body')));

    // Per-market supply facts render only for markets sales has confirmed
    // them for — the same `has()` test AreaDetail.astro applies, so a country
    // without them gets no invented logistics here either.
    if (has(k('supply_title'))) {
      heading(4, text(k('supply_title')));
      para(text(k('supply_intro')));
      const points = [1, 2, 3, 4]
        .filter((n) => has(k(`supply_${n}_title`)))
        .map((n) => `- ${text(k(`supply_${n}_title`))}: ${text(k(`supply_${n}_body`))}`);
      // The page lists the customers it may name at the end of the last
      // point ("Among our customers: …"), so they belong on that line.
      if (points.length && area.customers?.length) {
        points[points.length - 1] +=
          ' ' + area.customers.map((c) => `${c.name} (${c.url})`).join(', ');
      }
      points.forEach(line);
      if (points.length) line();
    }
    const faq = [1, 2, 3, 4].filter((n) => has(k(`faq_${n}_q`)));
    if (faq.length) {
      heading(4, text(k('faq_title')) ?? 'Frequently asked questions');
      for (const n of faq) {
        line(`- Q: ${text(k(`faq_${n}_q`))}`);
        line(`  A: ${text(k(`faq_${n}_a`))}`);
      }
      line();
    }
  }

  // ------------------------------------------------------------------ blog
  heading(2, `Blog (${url(lang, '/blog')})`);
  for (const post of blogPosts) {
    const tr = post.translations[lang] ?? post.translations.en ?? post.translations.sq;
    if (!tr) continue;
    heading(3, `${tr.title} (${url(lang, `/blog/${post.slug}`)})`);
    line(
      `Published ${post.published}` +
        (post.updated ? `, updated ${post.updated}` : '') +
        (tr.readingTime ? ` · ${tr.readingTime}` : '')
    );
    line();
    para(tr.description);
    for (const [sectionTitle, paragraphs] of tr.sections ?? []) {
      heading(4, sectionTitle);
      for (const p of paragraphs) para(p);
    }
  }

  // --------------------------------------------------------------- contact
  heading(2, 'Contact');
  line('- Phone / sales line: +383 49 111 150 (tel:+38349111150)');
  line('- WhatsApp: https://wa.me/38349111150');
  line('- Email: info@gertifoods.com (sales: arlinda@gertifoods.com)');
  line('- Book a 30-minute meeting: https://calendly.com/arlinda-gertifoods/30min');
  line(`- Address: ${text('footer_address') ?? 'Str. Kalaja e Shkupit, 20000 Prizren, Kosovo'}`);
  line(`- Legal notice: ${url(lang, '/imprint')}`);
  line();

  // -------------------------------------------------------------- machine
  heading(2, 'Machine-readable resources');
  line(`- Sitemap: ${ORIGIN}/sitemap.xml`);
  line(`- Short index of this site: ${ORIGIN}/llms.txt`);
  line(
    '- WebMCP tools registered in the browser (https://developer.chrome.com/docs/ai/webmcp): ' +
      'search_products (keyword search over the catalogue, returns name, page URL, price and description), ' +
      'get_contact_info (phone, WhatsApp, email and address), ' +
      'search_products_form (declarative search form that opens the product results page).'
  );
  line();

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
