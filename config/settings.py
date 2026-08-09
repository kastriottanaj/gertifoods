from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost', cast=Csv())

# Django admin path. Overridable so production can hide the admin behind a
# non-guessable URL (set DJANGO_ADMIN_URL in the server .env, e.g.
# 'api/staff-<random>/'). Mounting it under the existing 'api/' prefix means
# nginx already proxies it — no nginx change needed. Defaults to the standard
# 'admin/' for local development. Must end with a trailing slash.
ADMIN_URL = config('DJANGO_ADMIN_URL', default='admin/')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    # Local apps
    'accounts',
    'products',
    'orders',
    'leads',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # config/ is not an installed app, so its sitemap templates need to be
        # listed here to be found (see config/templates/sitemaps/).
        'DIRS': [BASE_DIR / 'config' / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DATABASE_NAME', default='gertifoods'),
        'USER': config('DATABASE_USER', default='postgres'),
        'PASSWORD': config('DATABASE_PASSWORD', default=''),
        'HOST': config('DATABASE_HOST', default='localhost'),
        'PORT': config('DATABASE_PORT', default='5432'),



    }
}

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Deny by default; public endpoints opt in with AllowAny explicitly.
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
    ),
    # Exactly one trusted proxy (nginx) sits in front of Gunicorn, so DRF must
    # derive the throttle key from the last X-Forwarded-For entry nginx appends,
    # not the raw header. Without this, a client can spoof X-Forwarded-For to get
    # a fresh throttle bucket per request and bypass the login/leads rate limits.
    'NUM_PROXIES': 1,
    'DEFAULT_THROTTLE_RATES': {
        # Generous global cap for anonymous browsing (per IP).
        'anon': '300/hour',
        # Tight caps for abuse-prone endpoints (per IP).
        'login': '5/min',
        'register': '10/hour',
        'leads': '10/hour',
    },
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# CORS
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:5173', cast=Csv())
# Allow the browser to send/receive the httpOnly refresh-token cookie on the
# cross-origin dev setup (localhost:5173 -> localhost:8000). Production is
# same-origin so this has no effect there.
CORS_ALLOW_CREDENTIALS = True

# CSRF: trusted origins for the Django admin login over HTTPS (the React app and
# API are same-origin, so this only matters for the admin form).
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='', cast=Csv())

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Europe/Berlin'
USE_I18N = True
USE_TZ = True

# Static & Media files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Email
# In development (DEBUG) emails are printed to the console so no SMTP
# credentials are needed. In production, set the EMAIL_* env vars below.
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default=(
        'django.core.mail.backends.console.EmailBackend'
        if DEBUG
        else 'django.core.mail.backends.smtp.EmailBackend'
    ),
)
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
DEFAULT_FROM_EMAIL = config(
    'DEFAULT_FROM_EMAIL',
    default='Gerti Foods <info@gertifoods.com>',
)
# Sales team inbox that receives a notification for each catalog request.
SALES_EMAIL = config('SALES_EMAIL', default='arlinda@gertifoods.com')

# Invisible reCAPTCHA v3 protection for public lead forms. It stays disabled
# when no secret is configured so local development and tests work without an
# external Google request. Production should set both backend and frontend keys.
RECAPTCHA_SECRET_KEY = config('RECAPTCHA_SECRET_KEY', default='')
RECAPTCHA_ENABLED = config(
    'RECAPTCHA_ENABLED', default=bool(RECAPTCHA_SECRET_KEY), cast=bool
)
RECAPTCHA_MIN_SCORE = config('RECAPTCHA_MIN_SCORE', default=0.5, cast=float)
RECAPTCHA_TIMEOUT = config('RECAPTCHA_TIMEOUT', default=5, cast=int)
RECAPTCHA_ALLOWED_HOSTNAMES = config(
    'RECAPTCHA_ALLOWED_HOSTNAMES', default='', cast=Csv()
)

# Catalog auto-delivery: the PDF emailed to prospects who request it.
CATALOG_PATH = config('CATALOG_PATH', default=str(BASE_DIR / 'assets' / 'catalog.pdf'))

# Canonical public origin. The sitemap views derive this from the request host,
# but `manage.py ping_indexnow` has no request, so it needs to be told.
# Keep in sync with `site` in frontend/astro.config.mjs.
SITE_DOMAIN = config('SITE_DOMAIN', default='gertifoods.com')

# IndexNow (Bing, Yandex, Seznam, Naver — Google does not participate).
#
# Not a secret: the ownership check requires this exact value to be publicly
# readable at https://<SITE_DOMAIN>/<key>.txt, so it is world-readable by
# design. Rotating it means generating a new key at https://www.indexnow.org,
# renaming frontend/public/<key>.txt to match, and rebuilding the frontend —
# the filename and this value must always agree or submissions 403.
INDEXNOW_KEY = config('INDEXNOW_KEY', default='8a47c68d27864a4a8fef802d0453e575')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Production security hardening (skipped in local development)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    # HTTPS has been stable in production, so use the full one-year max-age.
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    # Signals eligibility for browser preload lists. The header alone does not
    # enrol the domain — that requires submitting to hstspreload.org, which is
    # a long-term commitment (every subdomain must stay HTTPS-only).
    SECURE_HSTS_PRELOAD = True
