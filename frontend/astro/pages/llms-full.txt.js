// /llms-full.txt — the long-form companion to public/llms.txt, built from the
// same sources as the pages. See lib/llmsFull.js for what goes in and why.
//
// English only: it is the edition agents read, and the Albanian and German
// pages carry the same facts. The pages themselves stay the source for those.
import { buildLlmsFull } from '../lib/llmsFull.js';
import { useTranslations } from '../lib/i18n.js';
import { getProducts } from '../lib/products.js';
import { blogPosts } from '../../src/data/blogPosts.js';
import { areas } from '../../src/data/areas.js';

const LANG = 'en';

export async function GET({ site }) {
  const body = buildLlmsFull({
    origin: site.origin,
    lang: LANG,
    t: useTranslations(LANG),
    products: await getProducts(),
    blogPosts,
    areas,
  });
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
