# Security Hardening Log

A record of security reviews and the hardening applied as a result, so the
reasoning and changes are easy to recall later. Newest pass first.

---

## Pass 1 — Full codebase security audit (2026-06-17)

A detailed read-through of the whole codebase (Django backend, React frontend,
deploy config) produced a prioritized findings list. All findings were then
fixed, deployed to production, and verified live. The single remaining item
(#5) is a product decision, not a vulnerability.

### Starting posture (already good)
The fundamentals most small apps get wrong were already correct: DRF
deny-by-default permissions, server-side order price calculation, JWT rotation +
blacklist, throttling, secrets in env (not git), the production hardening block,
offline GeoIP, and no `dangerouslySetInnerHTML`. The work below is refinement on
a sound base.

### Summary table

| # | Finding | Severity | Status | Commit(s) |
|---|---------|----------|--------|-----------|
| 1 | Rate-limit bypass via spoofed `X-Forwarded-For` | Medium | ✅ Fixed & live | `b75c9e9` |
| 2 | Public forms abusable as email/spam cannon | Medium | ✅ Fixed & live | `b75c9e9` |
| 3 | JWT refresh token stored in `localStorage` | Medium | ✅ Fixed & live | `80277ee` |
| 4 | No Content-Security-Policy / security headers on SPA | Low/Med | ✅ Fixed & live | `b75c9e9` (+nginx) |
| 6 | HSTS max-age only 1 hour | Low | ✅ Fixed & live | `b75c9e9` |
| 7 | Vulnerable dependencies (21 CVEs) | Low/Med | ✅ Fixed & live | `962bd4f` |
| 7 | Admin on default path + SSH password brute-force surface | Low | ✅ Fixed & live | `40986e4`, `10236d3` (+server) |
| 5 | Email enumeration on register | Low | ⏸️ Accepted (product decision) | — |

---

### #1 — Rate-limit bypass via spoofed `X-Forwarded-For`

**What:** DRF throttling (login 5/min, register 10/h, leads 10/h) keyed off the
raw `X-Forwarded-For` header, which the client controls. Rotating the header
gave a fresh throttle bucket per request, defeating the limits.

**Why it mattered:** Re-opened brute-force / abuse on the throttled endpoints —
the protection looked present but was bypassable.

**Fix:** `REST_FRAMEWORK['NUM_PROXIES'] = 1` in `config/settings.py`, so DRF
trusts exactly one proxy hop (nginx) and reads the real client IP from the entry
nginx appends. Safe because Gunicorn binds `127.0.0.1` — the only path in is
through nginx.

**Impact:** Throttles now key off the true client IP; header rotation no longer
works. No behavior change for legitimate users.

---

### #2 — Public forms abusable as an email/spam cannon

**What:** The public, `AllowAny` lead/sample/catalog endpoints saved a row and
sent email on every submission. The catalog endpoint emails a PDF to any
supplied address. With #1, throttling was bypassable → email-bomb / sender-
reputation risk.

**Fix:** A hidden honeypot field (`website`) on all three public forms, invisible
to humans (off-screen, `aria-hidden`, `tabIndex=-1`, autocomplete off) but
autofilled by bots. Server-side `HoneypotCreateMixin` returns a normal-looking
`201` when it's filled but **saves nothing and sends no email** — bots can't tell
they were dropped.

**Files:** backend `leads/views.py`; frontend `components/Honeypot.jsx` (new),
wired into `HeroLeadForm.jsx`, `CatalogRequestForm.jsx`, `SampleRequestForm.jsx`
(the last also covers the exit-intent popup).

**Impact:** Automated spam is silently discarded before it touches the DB, the
sales inbox, or the mail server. Verified live: a honeypot-filled POST returns
`201` with no lead saved.

---

### #3 — JWT refresh token in `localStorage`

**What:** Both the access token and the 7-day refresh token lived in
`localStorage`, so any XSS could exfiltrate a long-lived session and keep minting
new tokens.

**Fix:** Moved the refresh token into an `httpOnly`, `Secure` (prod),
`SameSite=Lax` cookie scoped to `path=/api/accounts/`. JavaScript can no longer
read it.
- Login sets the cookie and strips `refresh` from the JSON body.
- New `CookieTokenRefreshView` reads + rotates the token from the cookie and
  returns only the new access token.
- Logout (now `AllowAny`) blacklists the cookie's token and deletes the cookie.
- Frontend stores only the access token, sends `withCredentials`, refreshes with
  an empty body; `CORS_ALLOW_CREDENTIALS = True` for the dev cross-origin setup.

**Files:** `accounts/views.py`, `accounts/urls.py`, `config/settings.py`,
`frontend/src/services/api.js`, `frontend/src/context/AuthContext.jsx`.

**Impact:** The long-lived credential is unreachable from JS. Only the 1-hour
access token remains in `localStorage` (standard accepted residual). Verified
live with a throwaway user: login `200` (cookie set, `HttpOnly; Secure;
SameSite=Lax; Path=/api/accounts/; Max-Age=604800`, no refresh in body), refresh
`200` from cookie, logout `205` + cookie cleared, refresh-after-logout `401`.

**Note:** Anyone logged in before the deploy is asked to log in once more after
their access token expires (old localStorage refresh token is ignored).

---

### #4 + #6 — Content-Security-Policy, security headers, and HSTS

**What:** The React SPA HTML is served directly by nginx, so it carried **none**
of Django's middleware security headers (CSP, X-Frame-Options, nosniff,
Referrer-Policy) and no HSTS — those only attached to `/api` and `/admin`. HSTS
max-age was also only 1 hour.

**Fix:**
- HSTS in `config/settings.py`: `SECURE_HSTS_SECONDS` `3600 → 31536000` (1 year)
  + `SECURE_HSTS_PRELOAD = True`.
- A baseline CSP plus X-Frame-Options/nosniff/Referrer-Policy/Permissions-Policy/
  HSTS added to the nginx `location /` block (SPA only — **scoped so the Django
  admin and DRF browsable API, which need their own inline JS, are untouched**).
- CSP uses `'unsafe-inline'` for scripts/styles (required by the inline GA
  bootstrap and React inline styles; `index.html` is static so no nonce). The
  real hardening is the locked-down sinks: `connect-src`/`img-src` allowlisted to
  self + Google, plus `object-src 'none'`, `base-uri 'self'`, `form-action
  'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`.

**Impact:** A stolen token can no longer be exfiltrated to an attacker host;
clickjacking blocked; browsers refuse HTTP downgrade. Verified live via response
headers; GA + Consent Mode still work.

**Tradeoff / future:** Tightening `script-src` to a nonce/hash would require
routing `index.html` through Django. Deferred — the sink lockdown delivers most
of the value.

**`preload` caveat:** the header signals eligibility only; the domain is **not**
enrolled until submitted to hstspreload.org — a long-term, hard-to-reverse
commitment (every subdomain must stay HTTPS-only). Don't submit unless certain.

---

### #7 — Vulnerable dependencies + Dependabot

**What:** `pip-audit` and `npm audit` flagged **21 known CVEs**.

**Fix (all within existing major lines — no breaking upgrades):**

| Package | From → To | CVEs | Note |
|---------|-----------|------|------|
| Django | 4.2.29 → 4.2.30 | 5 | LTS patch |
| PyJWT | 2.12.1 → 2.13.0 | 5 | signs the JWT auth tokens |
| pillow | 11.3.0 → 12.2.0 | 6 | major bump; tested on server Python 3.14 |
| react-router-dom | 7.14 → 7.18 | 4 | incl. open-redirect / CSRF advisories |
| axios + transitive | 1.14 → 1.18, form-data/postcss/vite | — | lockfile only |

Added `.github/dependabot.yml` (weekly pip + npm + github-actions update PRs) so
this stays automated.

**Impact:** `npm audit` and the Python set both report **0 vulnerabilities**.
Verified by installing in a throwaway venv on the server first, then
`manage.py check`, build, and a full auth cycle smoke test (login/refresh/logout)
to confirm the PyJWT bump didn't break token signing.

**To confirm on GitHub:** Settings → Code security → ensure **Dependabot alerts**
+ **security updates** are enabled (the version-update config works on push;
alerts are a separate repo toggle).

---

### #7 — Admin hardening (URL + fail2ban + SSH)

**What:** Django admin sat at the default `/admin/`, and the server accepted SSH
**root password** logins (`PasswordAuthentication yes`, `PermitRootLogin yes`) —
the auth log was full of brute-force attempts.

**Fix:**
1. **Hidden admin URL** — `settings.ADMIN_URL` reads `DJANGO_ADMIN_URL` (default
   `admin/` for dev). Production sets a random slug under the `api/` prefix, so
   the existing nginx `/api/` proxy serves it with **no nginx proxy change**. The
   nginx regex dropped `admin`, so the literal `/admin/` now returns the React
   SPA — no Django backend revealed.
2. **fail2ban** — installed with the `sshd` jail (5 fails/10m → 1h ban). Banned
   live brute-forcers within seconds.
3. **SSH key-only** — `PasswordAuthentication no` + `PermitRootLogin
   prohibit-password` via `/etc/ssh/sshd_config.d/00-hardening.conf` (sorts
   before cloud-init's re-enable; sshd uses the first value). Validated effective
   config and tested a fresh key login before trusting the change — no lockout.

**Files:** `config/settings.py`, `config/urls.py`, `.env.example`,
`deploy/nginx.conf` (+ server-side `.env`, fail2ban, sshd drop-in).

**Impact:** Admin login page is undiscoverable at the default path; SSH password
brute-force surface eliminated; remaining attempts get OS-level banned. Verified
live: `/admin/` → SPA (200), secret path → login (302), fresh key SSH OK,
`passwordauthentication no`.

**Retrieve the admin URL:**
`ssh root@167.233.78.149 'grep DJANGO_ADMIN_URL /var/www/gertifoods/.env'`

---

### #5 — Email enumeration on register (ACCEPTED, not fixed)

**What:** Registration reveals whether an email already exists ("An account with
this email already exists"). A minor enumeration vector.

**Decision:** Accepted as-is. For a B2B audience the enumeration risk is low and
the clear error message has real UX value. Revisit only if abuse appears — the
fix would be generic auth messaging.

---

## Server-side changes (NOT in git — live server only)

These were applied directly on the Hetzner box and are not tracked in the repo:

- **nginx** `/etc/nginx/sites-available/gertifoods` — security headers inserted
  into `location /`; admin dropped from the proxy regex. Backups:
  `.bak`, `.bak2`. (The live config is Certbot-managed — hand-merge changes from
  `deploy/nginx.conf`, never copy over it.)
- **`.env`** `/var/www/gertifoods/.env` — added `DJANGO_ADMIN_URL=api/staff-<random>/`.
- **fail2ban** — `/etc/fail2ban/jail.local` (sshd jail).
- **SSH** — `/etc/ssh/sshd_config.d/00-hardening.conf` (key-only, root
  prohibit-password).

## Deployment notes

- Backend changes go live on `git pull` + `systemctl restart gunicorn`.
- Frontend changes need `npm ci && npm run build` (served from `frontend/dist`).
- nginx changes need a hand-merge into the Certbot-managed live config, then
  `nginx -t && systemctl reload nginx`.
- Verification pattern used throughout: test installs/config in a throwaway
  env first, validate (`manage.py check`, `nginx -t`, `sshd -t`), then a live
  smoke test (curl headers / auth cycle with a temp user that is deleted after).

## Operational reminders

- **Admin URL** lives only in the server `.env` (kept out of git and memory on
  purpose). Retrieve with the grep command above.
- **Dependabot** opens weekly PRs — review and merge them to stay patched.
- **HSTS `preload`** is set but the domain is not enrolled; don't submit to
  hstspreload.org unless every subdomain will stay HTTPS-only forever.
- **Unrelated pre-existing TODO** (from deploy memory, not this pass): add
  SPF/DKIM DNS records so outbound mail doesn't land in spam.
