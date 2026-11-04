// End-to-end check of the lead forms, in a real browser, without creating a lead.
//
// The forms are what this site is for, and they have broken silently more than
// once, each time with every build and test green:
//
//   - The sample form on fourteen pages sent a `source` the backend refuses, so
//     those leads were lost for weeks (SOURCE_CHOICES in leads/models.py).
//   - The main buttons on five product pages opened nothing at all.
//   - An env-prefix mistake made every form answer HTTP 400 (check-build-env.js).
//
// So this does what a visitor does: it opens each form, fills it in, submits it
// and follows it to the thank-you page, on every language, under the production
// Content-Security-Policy, with a real reCAPTCHA token. Then it opens every page
// and clicks every form button on it.
//
// HOW IT STAYS HARMLESS
//
// Nothing reaches the backend and nothing reaches analytics. Every request the
// browser makes is paused here first (CDP Fetch, enabled before any navigation):
//
//   - /api/ is answered here. A lead POST gets a fake 201 and is never sent.
//   - Other hosts are refused unless they are on THIRD_PARTY_ALLOWED, which is
//     reCAPTCHA only. That is an allow-list on purpose: a tracker added next
//     year cannot record a fake conversion just because nobody remembered to
//     block it here.
//
// Because the reply is faked, a form the real server would refuse would look
// fine, which is exactly how the first bug above stayed hidden. So each captured
// submission is checked against the server's own field rules, read with an
// OPTIONS request: required fields, allowed choices, maximum lengths. OPTIONS
// creates nothing, but it does count against the 10/hour `leads` throttle for
// your IP (two per run), so a burst of runs can answer 429. Point --rules-from
// at a local server while iterating.
//
// USAGE
//
//   npm run build && npm run test:forms    the build in dist/, on the real origin
//   npm run test:forms -- --live           https://gertifoods.com as deployed
//
//   --lang=sq,en       only these languages
//   --forms-only       skip the page sweep
//   --pages-only       skip the form submissions (and the OPTIONS requests)
//   --dist=<dir>       test another build directory
//   --rules-from=<url> read the server rules from another backend
//
// Testing dist/ requires a build with VITE_RECAPTCHA_SITE_KEY set, and the build
// is served as https://gertifoods.com because reCAPTCHA only issues tokens there.
// It needs Chrome; set CHROME_PATH if it is not found.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://gertifoods.com';
const HOST = new URL(ORIGIN).hostname;
const DEFAULT_DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const LANGS = {
  sq: { prefix: '', thanks: '/faleminderit' },
  en: { prefix: '/en', thanks: '/en/thank-you' },
  de: { prefix: '/de', thanks: '/de/danke' },
};

// host, path prefix. Everything else off-site is refused. See the top of the file.
const THIRD_PARTY_ALLOWED = [
  ['www.google.com', '/recaptcha/'],
  ['www.gstatic.com', '/recaptcha/'],
];

const SAMPLE_API = '/api/leads/sample-request/';
const LEAD_API = '/api/leads/lead/';
const MODAL_FORM = '.modal-dialog form';
const SAMPLE_BUTTON = '[data-open-modal="sample"]';

// One row per way a lead can arrive. `event` and `eventSource` are what the
// thank-you page must report to GA4.
const FORMS = [
  { name: 'sample form, product page', page: '/products/pite-me-tuna', open: SAMPLE_BUTTON, form: MODAL_FORM, api: SAMPLE_API, source: 'tuna_pie_detail', event: 'sample_request' },
  // The longest source on the site: it is what outgrew the old 20-character column.
  { name: 'sample form, /furnizim page', page: '/furnizim/lokale-restorante', open: SAMPLE_BUTTON, form: MODAL_FORM, api: SAMPLE_API, source: 'supply_lokale_restorante', event: 'sample_request' },
  { name: 'hero form, home page', page: '/', form: 'form:has(input[name="first_name"])', api: LEAD_API, source: 'home_hero', event: 'hero_lead' },
  { name: 'catalog form, home page', page: '/', open: '[data-open-modal="catalog"]', form: MODAL_FORM, api: SAMPLE_API, source: 'catalog_request', event: 'catalog_request', eventSource: 'catalog_modal', catalogWording: true },
  { name: 'exit-intent popup', page: '/about', exitIntent: true, form: MODAL_FORM, api: SAMPLE_API, source: 'exit_popup', event: 'sample_request' },
];

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Runs in the page. Fills the fields a visitor must fill, and only those, so the
// honeypot stays empty and a new optional field does not need a change here.
const fillAndSubmit = (formSelector) => `(() => {
  const form = document.querySelector(${JSON.stringify(formSelector)});
  for (const el of form.elements) {
    if (!el.name || !el.required) continue;
    const value = el.type === 'email' ? 'forms-test@example.invalid'
      : el.type === 'tel' ? '+38349000000'
      : el.tagName === 'SELECT' ? [...el.options].find((o) => o.value).value
      : 'Forms Test';
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype
      : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  }
  form.requestSubmit();
  return true;
})()`;

// Runs in the page. Clicks each form button in turn and reports whether it opened
// the form, closing the modal again in between.
const CLICK_EVERY_BUTTON = `(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const until = async (test) => {
    for (let i = 0; i < 60; i++) { if (test()) return true; await sleep(50); }
    return false;
  };
  const results = [];
  for (const button of document.querySelectorAll('[data-open-modal]')) {
    button.click();
    const opened = await until(() => document.querySelector(${JSON.stringify(MODAL_FORM)}));
    results.push({ label: button.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40), opened });
    document.querySelector('.modal-close')?.click();
    await until(() => !document.querySelector('.modal-dialog'));
  }
  return results;
})()`;

const LEAD_EVENTS = `Array.from(window.dataLayer || [])
  .filter((a) => a[0] === 'event' && a[1] === 'generate_lead')
  .map((a) => a[2])`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const run = { blocked: new Set(), postsAnswered: 0, dist: null, csp: null };
const openBrowsers = new Set();

class Browser {
  static async launch(chromePath) {
    const profile = mkdtempSync(join(tmpdir(), 'gf-lead-forms-'));
    const args = [
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      'about:blank',
    ];
    if (!chromePath.includes('headless-shell')) args.unshift('--headless=new');
    const proc = spawn(chromePath, args, { stdio: ['ignore', 'ignore', 'pipe'] });

    const endpoint = await withTimeout(
      new Promise((resolveEndpoint, reject) => {
        let log = '';
        proc.stderr.on('data', (chunk) => {
          log += chunk;
          const match = log.match(/DevTools listening on (ws:\S+)/);
          if (match) resolveEndpoint(match[1]);
        });
        proc.on('exit', () => reject(new Error(`Chrome exited early: ${log.slice(0, 300)}`)));
      }),
      20000,
      `Chrome did not start: ${chromePath}`
    );

    const socket = new WebSocket(endpoint);
    await new Promise((r, reject) => {
      socket.addEventListener('open', r, { once: true });
      socket.addEventListener('error', () => reject(new Error('Could not connect to Chrome')), { once: true });
    });
    const browser = new Browser(proc, socket, profile);
    openBrowsers.add(browser);
    return browser;
  }

  constructor(proc, socket, profile) {
    this.proc = proc;
    this.socket = socket;
    this.profile = profile;
    this.nextId = 1;
    this.pending = new Map();
    this.tabs = new Map();
    socket.addEventListener('message', (event) => this.onMessage(JSON.parse(event.data)));
  }

  onMessage(message) {
    if (message.id) {
      const waiter = this.pending.get(message.id);
      if (!waiter) return;
      this.pending.delete(message.id);
      if (message.error) waiter.reject(new Error(`${waiter.method}: ${message.error.message}`));
      else waiter.resolve(message.result);
      return;
    }
    this.tabs.get(message.sessionId)?.onEvent(message.method, message.params);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const reply = new Promise((resolveReply, reject) => {
      this.pending.set(id, { method, resolve: resolveReply, reject });
    });
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId && { sessionId }) }));
    return withTimeout(reply, 30000, `Chrome did not answer ${method}`);
  }

  close() {
    openBrowsers.delete(this);
    try {
      this.socket.close();
      this.proc.kill();
      rmSync(this.profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      // A profile left in the temp directory is not worth failing a run over.
    }
  }
}

// One browser tab. A fresh tab per form gives each one a fresh sessionStorage,
// which matters: submitting a form sets the flag that suppresses the exit popup.
class Tab {
  static async open(browser) {
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
    const tab = new Tab(browser, sessionId, targetId);
    browser.tabs.set(sessionId, tab);
    // First, and awaited: if interception cannot be set up this throws before
    // the tab has loaded anything, so no request can slip past it.
    await tab.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    for (const domain of ['Page', 'Runtime', 'Network', 'Log']) await tab.send(`${domain}.enable`);
    await tab.send('Network.setCacheDisabled', { cacheDisabled: true });
    // Desktop width: the exit-intent watcher only arms from 768px up.
    await tab.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    return tab;
  }

  constructor(browser, sessionId, targetId) {
    this.browser = browser;
    this.sessionId = sessionId;
    this.targetId = targetId;
    this.posts = [];
    this.problems = [];
    this.documentStatus = null;
    this.onLoad = null;
  }

  send(method, params) {
    return this.browser.send(method, params, this.sessionId);
  }

  onEvent(method, params) {
    if (method === 'Fetch.requestPaused') {
      // A request can be cancelled by a navigation while it is paused; answering
      // it then fails, and there is nothing left to do about it.
      this.route(params).catch(() => {});
    } else if (method === 'Page.loadEventFired') {
      this.onLoad?.();
    } else if (method === 'Runtime.exceptionThrown') {
      const { exception, text } = params.exceptionDetails;
      this.problems.push(`JavaScript error: ${(exception?.description ?? text).split('\n')[0]}`);
    } else if (method === 'Log.entryAdded') {
      if (/Content Security Policy/i.test(params.entry.text)) {
        this.problems.push(`blocked by the CSP: ${params.entry.text.slice(0, 160)}`);
      }
    } else if (method === 'Network.responseReceived') {
      const { type, response } = params;
      if (type === 'Document') {
        this.documentStatus = response.status;
      } else if (response.status >= 400 && new URL(response.url).hostname === HOST) {
        this.problems.push(`broken asset: ${response.status} ${new URL(response.url).pathname}`);
      }
    }
  }

  async route({ requestId, request }) {
    const url = new URL(request.url);
    const pass = () => this.send('Fetch.continueRequest', { requestId });

    if (url.hostname !== HOST) {
      if (THIRD_PARTY_ALLOWED.some(([host, path]) => url.hostname === host && url.pathname.startsWith(path))) {
        return pass();
      }
      run.blocked.add(url.hostname);
      return this.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    }

    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'POST') {
        const contentType = Object.entries(request.headers).find(([name]) => name.toLowerCase() === 'content-type')?.[1];
        this.posts.push({ path: url.pathname, contentType, body: JSON.parse(request.postData ?? '{}') });
        run.postsAnswered++;
        return this.fulfill(requestId, 201, 'application/json', Buffer.from('{"id":1}'));
      }
      return this.fulfill(requestId, 204, 'application/json', Buffer.alloc(0));
    }

    // Live mode serves the real site. Product photos are not in the build, so
    // they come from the real site in both modes.
    if (!run.dist || url.pathname.startsWith('/media/')) return pass();

    const { file, status } = serveFromBuild(run.dist, url.pathname);
    return this.fulfill(requestId, status, CONTENT_TYPES[extname(file)] ?? 'application/octet-stream', readFileSync(file), run.csp);
  }

  fulfill(requestId, responseCode, contentType, body, csp) {
    const responseHeaders = [{ name: 'Content-Type', value: contentType }];
    if (csp) responseHeaders.push({ name: 'Content-Security-Policy', value: csp });
    return this.send('Fetch.fulfillRequest', { requestId, responseCode, responseHeaders, body: body.toString('base64') });
  }

  async goto(path) {
    this.documentStatus = null;
    const loaded = new Promise((r) => {
      this.onLoad = r;
    });
    await this.send('Page.navigate', { url: ORIGIN + path });
    await withTimeout(loaded, 30000, `${path} did not finish loading`);
  }

  async evaluate(expression) {
    const { result, exceptionDetails } = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
  }

  // Polls rather than sleeping a fixed time, and tolerates the page navigating
  // underneath it, when an evaluate has no context to run in.
  async waitFor(expression, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const value = await this.evaluate(expression).catch(() => undefined);
      if (value) return value;
      await sleep(100);
    }
    return null;
  }

  takeProblems() {
    const problems = [...new Set(this.problems)];
    this.problems = [];
    return problems;
  }

  async close() {
    this.browser.tabs.delete(this.sessionId);
    await this.browser.send('Target.closeTarget', { targetId: this.targetId }).catch(() => {});
  }
}

// The same lookup nginx does: try_files $uri $uri.html $uri/index.html =404.
function serveFromBuild(dist, pathname) {
  const decoded = decodeURIComponent(pathname);
  for (const candidate of [decoded, `${decoded}.html`, `${decoded.replace(/\/$/, '')}/index.html`]) {
    const file = join(dist, candidate);
    if (file.startsWith(dist) && existsSync(file) && statSync(file).isFile()) return { file, status: 200 };
  }
  return { file: join(dist, '404.html'), status: 404 };
}

// What the real server would refuse, going by its own OPTIONS description.
function refusedByServer(body, fields) {
  const reasons = [];
  for (const [name, rule] of Object.entries(fields)) {
    if (rule.read_only) continue;
    const value = body[name];
    if (value === undefined || value === null || value === '') {
      if (rule.required) reasons.push(`${name} is required`);
      else if (value === '' && rule.choices) reasons.push(`${name} cannot be blank`);
      continue;
    }
    if (rule.choices && !rule.choices.some((choice) => choice.value === value)) {
      reasons.push(`"${value}" is not a valid ${name}`);
    }
    if (rule.max_length && String(value).length > rule.max_length) {
      reasons.push(`${name} is longer than ${rule.max_length} characters`);
    }
  }
  return reasons;
}

async function checkForm(browser, lang, scenario, serverRules) {
  const { prefix, thanks } = LANGS[lang];
  const problems = [];
  const tab = await Tab.open(browser);
  try {
    await tab.goto((prefix + scenario.page).replace(/(.)\/$/, '$1'));
    if (tab.documentStatus !== 200) {
      problems.push(`the page answered ${tab.documentStatus}`);
      return problems;
    }
    if (!(await tab.waitFor(`document.querySelectorAll('astro-island[ssr]').length === 0`))) {
      problems.push('the page never finished hydrating');
    }

    if (scenario.open) {
      await tab.evaluate(`document.querySelector(${JSON.stringify(scenario.open)}).click(), true`);
    }
    if (scenario.exitIntent) {
      // The watcher arms a few seconds after load, so keep leaving the window
      // until it does. It stops listening after the first exit it reacts to.
      await tab.waitFor(
        `document.dispatchEvent(new MouseEvent('mouseout', { clientY: 0, relatedTarget: null, bubbles: true })),
         !!document.querySelector(${JSON.stringify(scenario.form)})`
      );
    }
    if (!(await tab.waitFor(`!!document.querySelector(${JSON.stringify(scenario.form)})`, 10000))) {
      problems.push('the form did not open');
      return problems;
    }

    await tab.evaluate(fillAndSubmit(scenario.form));
    for (let i = 0; i < 100 && !tab.posts.length; i++) await sleep(200);
    const post = tab.posts[0];
    if (!post) {
      problems.push('submitting the form sent nothing to the server');
      return problems;
    }

    if (post.path !== scenario.api) problems.push(`posted to ${post.path}, expected ${scenario.api}`);
    if (!/application\/json/.test(post.contentType ?? '')) problems.push(`sent ${post.contentType} instead of JSON`);
    if (post.body.source !== scenario.source) problems.push(`sent source "${post.body.source}", expected "${scenario.source}"`);
    if (!post.body.recaptcha_token) problems.push('no reCAPTCHA token: Django refuses an empty one, so a real visitor would get an error');
    if (post.body.website) problems.push('the honeypot was filled in: Django would pretend to save this lead and discard it');
    const fields = serverRules[post.path];
    if (fields) {
      for (const reason of refusedByServer(post.body, fields)) problems.push(`the server would refuse this: ${reason}`);
    } else {
      problems.push(`no server rules for ${post.path}`);
    }

    if (!(await tab.waitFor(`location.pathname === ${JSON.stringify(thanks)} && document.readyState === 'complete'`))) {
      problems.push(`did not reach ${thanks}, still on ${await tab.evaluate('location.pathname').catch(() => '?')}`);
      return problems;
    }
    if (tab.documentStatus !== 200) problems.push(`the thank-you page answered ${tab.documentStatus}`);
    if (tab.posts.length !== 1) problems.push(`sent ${tab.posts.length} POSTs for one submission`);

    const events = await tab.waitFor(`(() => { const e = ${LEAD_EVENTS}; return e.length ? e : null; })()`, 8000);
    if (!events) {
      problems.push('no generate_lead conversion fired');
    } else {
      if (events.length !== 1) problems.push(`generate_lead fired ${events.length} times`);
      const event = events[0];
      if (event.form_name !== scenario.event) problems.push(`conversion form_name "${event.form_name}", expected "${scenario.event}"`);
      const expectedSource = scenario.eventSource ?? scenario.source;
      if (event.form_source !== expectedSource) problems.push(`conversion form_source "${event.form_source}", expected "${expectedSource}"`);
      if (event.form_language !== lang) problems.push(`conversion form_language "${event.form_language}", expected "${lang}"`);
    }

    // A catalog requester gets the catalog line and no samples-and-offer steps.
    const shown = await tab.evaluate(`({
      catalog: !document.querySelector('[data-ty-catalog]')?.hidden,
      steps: !document.querySelector('.ty-steps')?.hidden,
    })`);
    const wantCatalog = Boolean(scenario.catalogWording);
    if (shown.catalog !== wantCatalog) problems.push(`thank-you page ${wantCatalog ? 'does not show' : 'wrongly shows'} the catalog wording`);
    if (shown.steps === wantCatalog) problems.push(`thank-you page ${wantCatalog ? 'wrongly shows' : 'does not show'} the next steps`);

    return problems;
  } finally {
    problems.push(...tab.takeProblems());
    await tab.close();
  }
}

async function checkPage(tab, path) {
  const problems = [];
  await tab.goto(path);
  if (tab.documentStatus !== 200) problems.push(`answered ${tab.documentStatus}`);
  const at = await tab.evaluate('location.pathname');
  if (at !== path) problems.push(`redirected to ${at}`);
  if (!(await tab.waitFor(`document.querySelectorAll('astro-island[ssr]').length === 0`))) {
    problems.push('never finished hydrating');
  }
  for (const { label, opened } of await tab.evaluate(CLICK_EVERY_BUTTON)) {
    if (!opened) problems.push(`button "${label}" opened nothing`);
  }
  // Viewing a page, thank-you pages included, must never invent a conversion.
  const events = await tab.evaluate(LEAD_EVENTS);
  if (events.length) problems.push(`fired generate_lead with nothing submitted`);
  problems.push(...tab.takeProblems());
  return problems;
}

async function runLanguage(lang, { chrome, serverRules, pages, formsOnly, pagesOnly }) {
  const report = (line) => console.log(`[${lang}] ${line}`);
  const browser = await Browser.launch(chrome);
  let failed = 0;
  try {
    if (!pagesOnly) {
      for (const scenario of FORMS) {
        const problems = await checkForm(browser, lang, scenario, serverRules).catch((error) => [error.message]);
        report(`${problems.length ? 'FAIL' : 'PASS'}  ${scenario.name}`);
        for (const problem of problems) report(`        ${problem}`);
        if (problems.length) failed++;
      }
    }
    if (!formsOnly) {
      let tab = await Tab.open(browser);
      let checked = 0;
      for (const path of pages) {
        let problems;
        try {
          problems = await checkPage(tab, path);
        } catch {
          // Could be the page, could be the browser session: one fresh attempt
          // tells them apart, and a real failure fails the same way twice.
          await tab.close();
          tab = await Tab.open(browser);
          problems = await checkPage(tab, path).catch((error) => [error.message]);
        }
        checked++;
        if (problems.length) {
          failed++;
          report(`FAIL  ${path}`);
          for (const problem of problems) report(`        ${problem}`);
        }
      }
      await tab.close();
      report(`${checked} pages checked`);
    }
  } finally {
    browser.close();
  }
  return failed;
}

function findChrome() {
  const home = homedir();
  const playwrightCache = join(home, 'Library', 'Caches', 'ms-playwright');
  const shells = existsSync(playwrightCache)
    ? readdirSync(playwrightCache)
        .filter((name) => name.startsWith('chromium_headless_shell-'))
        .flatMap((name) => ['mac-arm64', 'mac-x64'].map((arch) => join(playwrightCache, name, `chrome-headless-shell-${arch}`, 'chrome-headless-shell')))
    : [];
  const found = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ...shells,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].find((path) => path && existsSync(path));
  if (!found) fail('Chrome was not found. Set CHROME_PATH to its executable.');
  return found;
}

async function readServerRules(origin) {
  const rules = {};
  for (const path of [LEAD_API, SAMPLE_API]) {
    const response = await fetch(origin + path, { method: 'OPTIONS', headers: { Accept: 'application/json' } });
    if (response.status === 429) {
      fail(`${origin} is throttling this IP (the leads limit is 10 requests an hour, OPTIONS included).\nWait, or use --rules-from=http://127.0.0.1:8000 with a local server.`);
    }
    const fields = response.ok ? (await response.json()).actions?.POST : null;
    if (!fields) {
      fail(`Could not read the field rules from OPTIONS ${origin}${path} (HTTP ${response.status}).\nWithout them a form the server would refuse could pass unnoticed.`);
    }
    rules[path] = fields;
  }
  return rules;
}

async function liveCsp() {
  const response = await fetch(`${ORIGIN}/`, { method: 'HEAD' });
  const csp = response.headers.get('content-security-policy');
  if (!csp) fail(`${ORIGIN}/ sent no Content-Security-Policy to test the build under.`);
  return csp;
}

function pagesInBuild(dist) {
  return readdirSync(dist, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.html') && !/(^|\/)404\.html$/.test(file))
    .map((file) => `/${file.replace(/\.html$/, '').replace(/(^|\/)index$/, '')}`.replace(/(.)\/$/, '$1'))
    .sort();
}

async function pagesInSitemap() {
  const locs = async (url) => [...(await (await fetch(url)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = [];
  for (const section of await locs(`${ORIGIN}/sitemap.xml`)) urls.push(...(await locs(section)));
  // The thank-you pages are noindex, so the sitemap rightly leaves them out.
  const thanks = Object.values(LANGS).map(({ thanks: path }) => path);
  return [...new Set([...urls.map((url) => new URL(url).pathname), ...thanks])].sort();
}

const languageOf = (path) => Object.entries(LANGS).find(([, { prefix }]) => prefix && (path === prefix || path.startsWith(`${prefix}/`)))?.[0] ?? 'sq';

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const options = { live: false, formsOnly: false, pagesOnly: false, langs: Object.keys(LANGS), dist: DEFAULT_DIST, rulesFrom: ORIGIN };
  for (const arg of argv) {
    const [flag, value] = arg.split('=');
    if (flag === '--live') options.live = true;
    else if (flag === '--forms-only') options.formsOnly = true;
    else if (flag === '--pages-only') options.pagesOnly = true;
    else if (flag === '--lang') options.langs = value.split(',');
    else if (flag === '--dist') options.dist = resolve(value);
    else if (flag === '--rules-from') options.rulesFrom = value.replace(/\/$/, '');
    else fail(`Unknown option ${arg}. See the top of ${fileURLToPath(import.meta.url)}.`);
  }
  const unknown = options.langs.filter((lang) => !LANGS[lang]);
  if (unknown.length) fail(`Unknown language: ${unknown.join(', ')}`);
  return options;
}

process.on('exit', () => {
  for (const browser of openBrowsers) browser.close();
});
process.on('SIGINT', () => process.exit(130));

const options = parseArgs(process.argv.slice(2));
if (!options.live) {
  if (!existsSync(join(options.dist, 'index.html'))) fail(`No build in ${options.dist}. Run npm run build first, or use --live.`);
  run.dist = options.dist;
  run.csp = await liveCsp();
}

const chrome = findChrome();
const serverRules = options.pagesOnly ? null : await readServerRules(options.rulesFrom);
const allPages = options.formsOnly ? [] : options.live ? await pagesInSitemap() : pagesInBuild(options.dist);

console.log(`Testing ${options.live ? ORIGIN : options.dist}\nServer rules from ${options.pagesOnly ? '(not needed)' : options.rulesFrom}\n`);

const failures = await Promise.all(
  options.langs.map((lang) =>
    runLanguage(lang, {
      chrome,
      serverRules,
      formsOnly: options.formsOnly,
      pagesOnly: options.pagesOnly,
      pages: allPages.filter((path) => languageOf(path) === lang),
    })
  )
);
const failed = failures.reduce((sum, count) => sum + count, 0);

console.log(`\nLead POSTs answered in the browser, none sent to the server: ${run.postsAnswered}`);
console.log(`Hosts refused, nothing sent to them: ${[...run.blocked].sort().join(', ') || 'none'}`);
console.log(failed ? `\n${failed} check(s) FAILED\n` : '\nAll checks passed\n');
process.exit(failed ? 1 : 0);
