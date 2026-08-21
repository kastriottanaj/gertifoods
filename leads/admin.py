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
        'sales_notified',
        'created_at',
    )
    # Filtering on sales_notified is the point: it answers "which leads did we
    # never actually hear about?" in one click.
    list_filter = ('sales_notified', 'status', 'source', 'created_at')
    list_editable = ('status',)
    search_fields = ('first_name', 'last_name', 'email', 'phone')
    readonly_fields = ('sales_notified', 'created_at', 'updated_at')
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
    )


@admin.register(SampleRequest)
class SampleRequestAdmin(admin.ModelAdmin):
    list_display = (
        'company_name',
        'contact_name',
        'business_type',
        'source',
        'status',
        'sales_notified',
        'created_at',
    )
    list_filter = ('sales_notified', 'status', 'business_type', 'source', 'created_at')
    list_editable = ('status',)
    search_fields = ('company_name', 'contact_name', 'email', 'phone', 'city')
    readonly_fields = ('sales_notified', 'created_at', 'updated_at')
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
    )
