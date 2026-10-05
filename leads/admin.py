from django.contrib import admin

from .models import Lead, SampleRequest


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        'first_name',
        'last_name',
        'email',
        'phone',
        'source',
        'status',
        'utm_campaign',
        'sales_notified',
        'created_at',
    )
    # Filtering on sales_notified is the point: it answers "which leads did we
    # never actually hear about?" in one click.
    list_filter = ('utm_campaign', 'utm_source', 'status', 'capi_sent', 'sales_notified', 'source', 'created_at')
    list_editable = ('status',)
    search_fields = ('first_name', 'last_name', 'email', 'phone')
    # Everything here is recorded by the server or the browser, never typed.
    readonly_fields = (
        'sales_notified',
        'capi_sent',
        'event_id',
        'fbc',
        'fbp',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'fbclid',
        'gclid',
        'landing_page',
        'referrer',
        'marketing_consent',
        'created_at',
        'updated_at',
    )
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    fieldsets = (
        ('Contact', {
            'fields': ('first_name', 'last_name', 'email', 'phone'),
        }),
        ('Message', {
            'fields': ('message',),
        }),
        ('Tracking', {
            'fields': ('source', 'status', 'sales_notified', 'created_at', 'updated_at'),
        }),
        # Ad attribution. Read-only: every value here is recorded by the
        # server or minted by the browser, never typed. fbc being populated is
        # what says this lead arrived from a Meta ad; capi_sent being false
        # across many rows means the access token has stopped working.
        # Which campaign paid for this lead. Set status to 'Converted to
        # Customer' and these columns become the answer to the only question
        # that matters: which campaigns produce customers, not just leads.
        ('Attribution', {
            'fields': (
                'utm_campaign',
                'utm_source',
                'utm_medium',
                'utm_content',
                'utm_term',
                'landing_page',
                'referrer',
                'fbclid',
                'gclid',
            ),
        }),
        ('Meta', {
            'classes': ('collapse',),
            'fields': ('capi_sent', 'marketing_consent', 'event_id', 'fbc', 'fbp'),
        }),
    )


@admin.register(SampleRequest)
class SampleRequestAdmin(admin.ModelAdmin):
    list_display = (
        'company_name',
        'contact_name',
        'business_type',
        'source',
        'status',
        'utm_campaign',
        'sales_notified',
        'created_at',
    )
    list_filter = ('utm_campaign', 'utm_source', 'status', 'business_type', 'capi_sent', 'sales_notified', 'source', 'created_at')
    list_editable = ('status',)
    search_fields = ('company_name', 'contact_name', 'email', 'phone', 'city')
    # Everything here is recorded by the server or the browser, never typed.
    readonly_fields = (
        'sales_notified',
        'capi_sent',
        'event_id',
        'fbc',
        'fbp',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'fbclid',
        'gclid',
        'landing_page',
        'referrer',
        'marketing_consent',
        'created_at',
        'updated_at',
    )
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    fieldsets = (
        ('Lead', {
            'fields': (
                'company_name',
                'contact_name',
                'email',
                'phone',
                'city',
                'business_type',
            ),
        }),
        ('Interest', {
            'fields': ('products_interested', 'message'),
        }),
        ('Tracking', {
            'fields': ('source', 'status', 'sales_notified', 'created_at', 'updated_at'),
        }),
        # Ad attribution. Read-only: every value here is recorded by the
        # server or minted by the browser, never typed. fbc being populated is
        # what says this lead arrived from a Meta ad; capi_sent being false
        # across many rows means the access token has stopped working.
        # Which campaign paid for this lead. Set status to 'Converted to
        # Customer' and these columns become the answer to the only question
        # that matters: which campaigns produce customers, not just leads.
        ('Attribution', {
            'fields': (
                'utm_campaign',
                'utm_source',
                'utm_medium',
                'utm_content',
                'utm_term',
                'landing_page',
                'referrer',
                'fbclid',
                'gclid',
            ),
        }),
        ('Meta', {
            'classes': ('collapse',),
            'fields': ('capi_sent', 'marketing_consent', 'event_id', 'fbc', 'fbp'),
        }),
    )
