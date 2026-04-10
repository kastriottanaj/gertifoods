# GertiFoods

B2B web application for **GertiFoods** — a half-baked products factory based in Kosovo. The platform lets approved business customers browse the product catalog, place orders, and track their order history.

## Tech Stack

**Backend**
- Python / Django 4.2
- Django REST Framework + SimpleJWT (JWT auth)
- PostgreSQL
- django-cors-headers
- Pillow (image uploads)

**Frontend**
- React 19 + Vite
- React Router 7
- Axios
- react-helmet-async (SEO)

## Project Structure

```
gertifoods/
├── config/          # Django project settings, URLs, WSGI/ASGI
├── accounts/        # Custom User model, auth, registration, profile
├── products/        # Category & Product models, catalog API
├── orders/          # Order & OrderItem models, checkout API
├── frontend/        # React + Vite SPA
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
| `/api/accounts/` | accounts |
| `/api/` | products |
| `/api/` | orders |

## Getting Started

### 1. Backend

```bash
# Create & activate virtualenv
python3 -m venv venv
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
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

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

## Authentication

JWT-based via `djangorestframework-simplejwt`:
- Access token lifetime: **1 hour**
- Refresh token lifetime: **7 days**

Business accounts must be approved (`is_approved=True`) by an admin before placing orders.

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
