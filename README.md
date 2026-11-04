# GertiFoods

B2B web application for **GertiFoods** — a half-baked products factory based in Kosovo. It is a marketing and lead-generation site: business buyers browse the products and the company, then request samples or the catalog, call, or message on WhatsApp. There are no customer accounts (removed 2026-11-03); orders are arranged with sales directly.

## Tech Stack

**Backend**
- Python 3.14 / Django 5.2 LTS
- Django REST Framework (public catalog API and lead endpoints, no authentication)
- PostgreSQL
- django-cors-headers
- Pillow (image uploads)

**Frontend**
- Astro 7: every page is static HTML
- React 19 islands for the lead forms
- Axios

## Project Structure

```
gertifoods/
├── config/          # Django project settings, URLs, WSGI/ASGI
├── accounts/        # Custom User model (staff admin logins, legacy customer accounts)
├── products/        # Category & Product models, catalog API
├── orders/          # Order & OrderItem models (legacy online orders, admin only)
├── frontend/        # Astro site with React islands
├── manage.py
├── requirements.txt
└── .env.example
```

## Django Apps

- **accounts** — Custom `User` model extending `AbstractUser` with `company_name`, `phone`, `address`, `city`, `country`, and an `is_approved` flag (business accounts require admin approval before placing orders).
- **products** — `Category` and `Product` models. Products have price, unit (kg/piece/box), minimum order quantity, image, and availability flag.
- **orders** — `Order` and `OrderItem` models with status workflow: `pending → confirmed → processing → shipped → delivered` (or `cancelled`).

## API Routes

| Prefix | App |
|---|---|
| `/admin/` | Django admin |
| `/api/` | products (read-only) |
| `/api/leads/` | leads (lead and sample/catalog request forms) |

## Getting Started

### 1. Backend

```bash
# Create & activate virtualenv. Name the version: production runs 3.14, and a
# bare python3 can be an older system Python that Django 5.2 does not support.
python3.14 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# edit .env with your local DB credentials & SECRET_KEY

# Run migrations
python manage.py migrate

# Create a superuser
python manage.py createsuperuser

# Start dev server
python manage.py runserver
```

Backend runs at `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm ci
npm run dev
```

Frontend runs at `http://localhost:4321`. It needs Node 22.23.4 or newer.

### 3. Checking the lead forms

```bash
cd frontend
npm run build            # needs the backend running, or BUILD_API_URL=https://gertifoods.com/api
npm run test:forms       # the build you just made
npm run test:forms -- --live   # the live site
```

This submits every lead form in all three languages in headless Chrome, then
opens every page and clicks every form button. It creates no leads and records
no conversions. See the top of `frontend/scripts/check-lead-forms.js`.

## Environment Variables

See [.env.example](.env.example):

| Key | Description |
|---|---|
| `DEBUG` | Django debug flag |
| `SECRET_KEY` | Django secret key |
| `DATABASE_NAME` | PostgreSQL database name |
| `DATABASE_USER` | DB user |
| `DATABASE_PASSWORD` | DB password |
| `DATABASE_HOST` | DB host |
| `DATABASE_PORT` | DB port |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v3 secret used by Django |
| `RECAPTCHA_ALLOWED_HOSTNAMES` | Comma-separated hostnames allowed in verified tokens |

The frontend build also accepts `VITE_RECAPTCHA_SITE_KEY`. Configure it with
the public v3 site key and set `RECAPTCHA_ENABLED=True` on the backend to protect
the public lead, sample, and catalog forms. Local development leaves the check
disabled by default.

## Accounts

The public site has no logins: customer accounts, the cart and online ordering were removed on 2026-11-03, together with the `/api/accounts/` and `/api/orders/` endpoints. The only login is staff access to the Django admin. Existing customer users and orders were kept in the database and remain visible there.

## Localization

- Default language: `en-us`
- Timezone: `Europe/Berlin`
- Frontend i18n via `frontend/src/i18n/`

## Marketing & Conversion Principles (Straight Line)

The website follows Jordan Belfort's Straight Line Persuasion principles, adapted for a **B2B half-baked products wholesaler**. All copy, UX, and page structure must reinforce these:

### The Three 10's — every page should move the visitor toward:
1. **Love the products (10/10)** — Position GertiFoods half-baked products as the smartest choice for foodservice operators. Lead with concrete outcomes: consistent quality every batch, lower labor cost, less waste, fresh-baked aroma on demand. Show finished-product photography, shelf-life numbers, and bake-time data.
2. **Trust GertiFoods as a producer (10/10)** — Establish the factory as a serious, reliable supplier. Showcase certifications (HACCP / food safety), production capacity, traceability, hygiene standards, and the founder/factory story rooted in Kosovo craftsmanship. Use customer logos (bakeries, hotels, supermarkets, restaurants) and testimonials from operators who switched and never looked back.
3. **Trust the process (10/10)** — Reinforce that doing business with GertiFoods is easy and professional: account approval, transparent wholesale pricing, dependable delivery windows, clear minimum order quantities, and a real human on the sales line. The B2B account model (`is_approved` flag) is a feature, not friction — it signals "we vet our partners."

### First Impression (4 seconds)
Within seconds of landing, the visitor must perceive:
- **Appetite appeal** — high-quality product photography that triggers the "I want my customers eating this" reaction
- **Industrial credibility** — clean, professional design that signals factory scale (not a hobby producer)
- **Regional authority** — positioned as Kosovo's go-to half-baked supplier, not just another bakery

### Pain & Urgency (unconscious level)
- Increase awareness of what the prospect is losing without GertiFoods: high labor cost from in-house baking, inconsistent quality across shifts, waste from unsold baked goods, customer complaints when the head baker calls in sick
- Use future pacing: paint the picture of a kitchen where fresh product comes out of the oven on demand, staff spend less time on prep, margins go up, and customers get the same quality every visit
- Never manipulate — ethically highlight the cost of inaction (labor inflation, food waste regulations, competitors serving fresher product)

### Lower the Buying Threshold
- **Opt-in bribe:** Free product samples + wholesale price list as the primary CTA across all pages
- **Secondary CTAs:** "Book a factory visit," "Talk to sales," "Request a tasting"
- **Exit popup:** Catch visitors before they leave with a no-strings sample box offer
- Make the first step feel low-risk: "Request samples" not "Place wholesale order." The full ordering portal only opens after account approval — that's by design.

### Straight Line Sales Funnel (website flow)
1. **Lead Capture** — Free sample request / wholesale price list opt-in (Home hero, Products page, Contact page, exit popup)
2. **Build Trust** — Factory story, certifications, customer case studies, photos of the production line, testimonials from existing B2B buyers
3. **Core Offer** — Product catalog with clear specs (unit, MOQ, shelf life, bake instructions), account application form
4. **Activate & Reorder** — Approved accounts get the full ordering portal; follow-up via sales rep + email to drive repeat orders

### Copy Guidelines
- Every word must be deliberate — move the visitor down the straight line toward "Request samples" or "Apply for a wholesale account"
- Build both **logical** AND **emotional** cases:
  - Logical: cost-per-unit, prep-time savings, waste reduction, shelf life, MOQ
  - Emotional: your customers' faces when they bite into a fresh croissant, your reputation as the place that never runs out
- Answer the buyer's questions before they ask: pricing transparency, delivery zones, lead times, sample policy, payment terms
- Qualify visitors: speak directly to **professional foodservice buyers** in Kosovo and the region (bakeries, hotels, restaurants, supermarkets, catering, distributors), so the right people self-select and tire-kickers filter themselves out

## Working Style
- Always share the thinking process. For every decision (architecture, sequencing, technology, design), explain transparently: What are the options? What speaks for/against each? Why is the decision made this way? The user wants to understand the reasoning, not just see the result.
- Work step by step — do not tackle multiple large tasks at once. Complete and validate one task at a time before moving to the next.
