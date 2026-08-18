# Deploying GertiFoods to Hetzner

Production architecture:

```
                 ┌─────────────────────────────────────────┐
   Internet ───► │ Nginx (:80/:443, TLS via Certbot)         │
                 │   /            -> React build (dist/)      │
                 │   /static /media -> files on disk          │
                 │   /api /admin  -> proxy to Gunicorn :8000  │
                 └───────────────┬───────────────────────────┘
                                 │
                          Gunicorn (Django/DRF)
                                 │
                           PostgreSQL (local)
```

Because the React app and the API are served from the **same domain**
(`gertifoods.com`), requests are same-origin and **CORS is not needed** in
production.

---

## 0. Point DNS at the server

In your domain registrar / DNS provider, create:

| Type | Name  | Value                |
|------|-------|----------------------|
| A    | `@`   | `<your-server-IPv4>` |
| A    | `www` | `<your-server-IPv4>` |

(Optional `AAAA` records for IPv6 if your Hetzner server has one.)

Wait for propagation: `dig +short gertifoods.com` should return your server IP
before you run Certbot in step 8.

---

## 1. SSH in and check the OS

```bash
ssh root@<your-server-IPv4>
cat /etc/os-release        # confirm Ubuntu/Debian version
```

All commands below assume Ubuntu/Debian (apt + systemd). Adjust package names
if your image differs.

---

## 2. System packages

```bash
apt update && apt upgrade -y
apt install -y python3 python3-venv python3-dev \
    postgresql postgresql-contrib \
    nginx git curl ufw

# Node.js 22 (to build the frontend on the server).
# Astro requires Node >= 22.12 — Node 20 will not build the site.
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

## 3. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 4. Create an app user and PostgreSQL database

```bash
# Dedicated unprivileged user that will own the code and run Gunicorn
adduser --system --group --home /var/www/gertifoods gertifoods

# Database + DB user (pick a strong password)
sudo -u postgres psql <<'SQL'
CREATE DATABASE gertifoods;
CREATE USER gertifoods WITH PASSWORD 'CHANGE_ME_STRONG_DB_PASSWORD';
ALTER ROLE gertifoods SET client_encoding TO 'utf8';
ALTER ROLE gertifoods SET default_transaction_isolation TO 'read committed';
ALTER ROLE gertifoods SET timezone TO 'Europe/Berlin';
GRANT ALL PRIVILEGES ON DATABASE gertifoods TO gertifoods;
SQL

# Django 4.2 also needs schema ownership on PostgreSQL 15+
sudo -u postgres psql -d gertifoods -c \
  "GRANT ALL ON SCHEMA public TO gertifoods;"
```

## 5. Get the code

```bash
cd /var/www
# Replace with your repo URL, or rsync/scp from your laptop
git clone <your-repo-url> gertifoods
chown -R gertifoods:gertifoods /var/www/gertifoods
cd gertifoods
```

> No remote git host? From your laptop instead:
> `rsync -avz --exclude venv --exclude node_modules --exclude .git \
>   ./ root@<server-ip>:/var/www/gertifoods/`
>
> That excludes `.git`, and the sitemap reads commit dates to fill in
> `<lastmod>` for the static pages (`config/source_lastmod.py`). Without a
> repository on the server those URLs simply ship without a `<lastmod>` —
> valid, but the pages and areas sitemaps lose their dates. Drop
> `--exclude .git` if you want to keep them.

## 6. Backend: virtualenv, env file, migrate, collectstatic

```bash
cd /var/www/gertifoods
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
```

Create the production **`.env`** (in `/var/www/gertifoods/.env`):

```ini
DEBUG=False
SECRET_KEY=<paste a fresh 50-char random key>
ALLOWED_HOSTS=gertifoods.com,www.gertifoods.com

DATABASE_NAME=gertifoods
DATABASE_USER=gertifoods
DATABASE_PASSWORD=CHANGE_ME_STRONG_DB_PASSWORD
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Email (real SMTP for catalog auto-delivery + lead notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_HOST_USER=info@gertifoods.com
EMAIL_HOST_PASSWORD=<smtp-password>
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Gerti Foods <info@gertifoods.com>

# Google reCAPTCHA v3 (create keys for both production hostnames)
RECAPTCHA_ENABLED=True
RECAPTCHA_SECRET_KEY=<recaptcha-v3-secret-key>
RECAPTCHA_MIN_SCORE=0.5
RECAPTCHA_ALLOWED_HOSTNAMES=gertifoods.com,www.gertifoods.com
```

Generate a secret key:

```bash
./venv/bin/python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Run migrations, collect static, create an admin user:

```bash
./venv/bin/python manage.py migrate
./venv/bin/python manage.py collectstatic --noinput
./venv/bin/python manage.py createsuperuser
chown -R gertifoods:gertifoods /var/www/gertifoods
```

## 7. Frontend: build the site

The frontend is an Astro build that renders every page to static HTML and
hydrates only the interactive parts (lead forms, cart, portal) as React islands.

Two things are baked in at **build time**, so both must be right before you run
the build:

1. **The reCAPTCHA site key**, via `.env.production`. Django enables reCAPTCHA
   whenever `RECAPTCHA_SECRET_KEY` is set and rejects submissions carrying an
   empty token, so a build without the matching site key makes every lead form
   fail with HTTP 400. `npm run build` refuses to start without it — pass
   `ALLOW_NO_RECAPTCHA=1` only if the backend genuinely runs without reCAPTCHA.
2. **The product catalogue.** Product pages are generated from the Django API,
   so **Gunicorn must already be running** (step 8) — or, on a first install
   where it isn't up yet, start the dev server briefly just for the build.

```bash
cd /var/www/gertifoods/frontend
printf '%s\n' \
  "VITE_RECAPTCHA_SITE_KEY=<recaptcha-v3-site-key>" > .env.production
npm ci
npm run build        # outputs to frontend/dist (served by Nginx)
```

**Do not set `VITE_API_URL` here.** Production is same-origin — nginx proxies
`/api` to Gunicorn — so leaving it unset makes the browser call the relative
`/api`, which is correct on whichever hostname the visitor arrived at. Pinning
it to `https://gertifoods.com/api` breaks `www.gertifoods.com`, which serves the
site directly rather than redirecting to the apex: every API call from `www`
would become a cross-origin request that the API rejects (the `www` origin is
not in `CORS_ALLOWED_ORIGINS`) and the page's own `connect-src 'self'` blocks.
The variable exists for local development only, where Astro and Django sit on
different ports.

`.env.production` is gitignored, so it does **not** survive a fresh clone and
has to be recreated on any new build host. Two build-time guards exist because
it silently didn't: `scripts/check-build-env.js` refuses to build without the
required variables, and `scripts/check-build-output.js` fails the build if a
development value (a `localhost:<port>` host, a URL built from an `undefined`
variable) or a missing reCAPTCHA loader made it into `dist/`.

The build reads the catalogue from `http://127.0.0.1:8000/api` by default.
**On this server that default returns HTTP 400**, because `ALLOWED_HOSTS` in the
production `.env` lists only the public hostnames, so Django rejects a request
whose `Host` header is `127.0.0.1:8000`. Point the build at the public API
instead:

```bash
BUILD_API_URL=https://gertifoods.com/api npm run build
```

(Alternatively, add `127.0.0.1` to `ALLOWED_HOSTS` and the loopback default
works — worth doing if you ever need to build before TLS is up.)

If the API is unreachable the build **fails deliberately** rather than shipping
a site with no products behind a sitemap that advertises them. To build without
a catalogue anyway (local copy edits, for example), set `ALLOW_EMPTY_CATALOG=1`.

## 8. Gunicorn service

```bash
cp /var/www/gertifoods/deploy/gunicorn.service /etc/systemd/system/gunicorn.service
systemctl daemon-reload
systemctl enable --now gunicorn
systemctl status gunicorn      # should be "active (running)"
```

## 9. Nginx

```bash
cp /var/www/gertifoods/deploy/nginx.conf /etc/nginx/sites-available/gertifoods
ln -s /etc/nginx/sites-available/gertifoods /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t                       # test config
systemctl restart nginx
```

At this point `http://gertifoods.com` should load the site (HTTP only).

### Compression

Ubuntu's stock `/etc/nginx/nginx.conf` ships `gzip on;` with every `gzip_types`
line commented out. That reads as "compression is on" but it is not: with no
`gzip_types`, nginx falls back to its default of `text/html` alone, so the HTML
compresses and every stylesheet and script is served raw. It cost roughly 190 KB
per page here — `client.js` 179 KB → 56 KB, `BaseLayout.css` 51 KB → 10 KB.

Uncomment the block in the `http` section of `/etc/nginx/nginx.conf` and give it
an explicit type list:

```nginx
gzip on;
gzip_vary on;             # assets are cached immutable, so shared caches must vary
gzip_proxied any;
gzip_comp_level 6;
gzip_min_length 256;
gzip_buffers 16 8k;
gzip_http_version 1.1;
# text/html is always gzipped by nginx and must not be listed here.
gzip_types
    text/plain text/css text/xml text/javascript
    application/javascript application/json application/xml
    application/xml+rss application/rss+xml application/manifest+json
    image/svg+xml;
```

Then `nginx -t && systemctl reload nginx`. Verify with
`curl -sI -H 'Accept-Encoding: gzip' https://gertifoods.com/_astro/<any>.css |
grep -i content-encoding` — it must say `gzip`. This lives in nginx.conf rather
than `deploy/nginx.conf` because the site file is Certbot-managed (see below).

## 10. HTTPS with Certbot

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d gertifoods.com -d www.gertifoods.com
```

Choose "redirect" so all HTTP traffic goes to HTTPS. Certbot also installs a
renewal timer — verify with `systemctl list-timers | grep certbot`.

> Note: `settings.py` enables `SECURE_SSL_REDIRECT` and HSTS when `DEBUG=False`.
> These rely on HTTPS being live, so finish this step before sharing the link.

---

## Done — verify

- `https://gertifoods.com` → React site loads over HTTPS
- `https://gertifoods.com/admin/` → Django admin (styled, static files load)
- `https://gertifoods.com/api/...` → API responds
- Submit a sample-request lead → confirm the email is delivered

---

## Redeploying after changes

```bash
cd /var/www/gertifoods
git pull                                   # or rsync again
./venv/bin/pip install -r requirements.txt # if deps changed
./venv/bin/python manage.py migrate
./venv/bin/python manage.py collectstatic --noinput
sudo systemctl restart gunicorn            # restart BEFORE the frontend build,
                                           # which reads the catalogue from it
cd frontend && npm ci
BUILD_API_URL=https://gertifoods.com/api npm run build
```

`astro build` empties `dist/` before it writes, so a build that fails partway
leaves nothing to serve. Take a copy first if you want an instant rollback:

```bash
cp -a /var/www/gertifoods/frontend/dist /root/dist-backup-$(date +%F-%H%M%S)
```

### After changing the product catalogue

Product pages are generated at build time, so **adding, repricing or retiring a
product in the Django admin does not change the live site on its own.** Rebuild
the frontend afterwards:

```bash
cd /var/www/gertifoods/frontend && BUILD_API_URL=https://gertifoods.com/api npm run build
```

Nothing needs restarting — Nginx serves the new files as soon as they are
written. The same applies to blog posts and area pages, whose content lives in
`frontend/src/data/`.

### Telling search engines what changed (IndexNow)

After the rebuild, submit the URLs you actually changed so participating
engines recrawl them without waiting for their own schedule:

```bash
cd /var/www/gertifoods
./venv/bin/python manage.py ping_indexnow /products/pite-me-tuna /en/products/pite-me-tuna /de/products/pite-me-tuna
```

Two things worth knowing before relying on this:

- **Google does not participate in IndexNow.** This reaches Bing, Yandex,
  Seznam and Naver. Google still finds changes by crawling `/sitemap.xml`.
- **Submit only what changed.** `--all` exists for the first-ever submission
  and for changes that genuinely touch every page; using it on every deploy
  earns a 429 "potential spam" response and devalues the signal.

Add `--dry-run` to see the payload without sending it. The command verifies
that `https://gertifoods.com/<key>.txt` is reachable before submitting, so a
frontend that has not been rebuilt since the key file was added fails with a
clear message rather than a bare 403.

Receipts appear in [Bing Webmaster Tools](https://www.bing.com/webmasters)
under IndexNow.
