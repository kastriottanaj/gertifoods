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

# Node.js 20 (to build the React frontend on the server)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
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

1. **The API base URL** the browser will call, via `.env.production`.
2. **The product catalogue.** Product pages are generated from the Django API,
   so **Gunicorn must already be running** (step 8) — or, on a first install
   where it isn't up yet, start the dev server briefly just for the build.

```bash
cd /var/www/gertifoods/frontend
echo "VITE_API_URL=https://gertifoods.com/api" > .env.production
npm ci
npm run build        # outputs to frontend/dist (served by Nginx)
```

The build reads the catalogue from `http://127.0.0.1:8000/api` by default —
Django directly on the loopback interface, so it does not depend on Nginx or
TLS being up yet. Override with `BUILD_API_URL` if Gunicorn listens elsewhere.

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
cd frontend && npm ci && npm run build
```

### After changing the product catalogue

Product pages are generated at build time, so **adding, repricing or retiring a
product in the Django admin does not change the live site on its own.** Rebuild
the frontend afterwards:

```bash
cd /var/www/gertifoods/frontend && npm run build
```

Nothing needs restarting — Nginx serves the new files as soon as they are
written. The same applies to blog posts and area pages, whose content lives in
`frontend/src/data/`.
