from django.contrib import admin

from .models import SampleRequest


@admin.register(SampleRequest)
class SampleRequestAdmin(admin.ModelAdmin):
    list_display = (
        'company_name',
        'contact_name',
        'business_type',
        'source',
        'status',
        'created_at',
    )
    list_filter = ('status', 'business_type', 'source', 'created_at')
    list_editable = ('status',)
    search_fields = ('company_name', 'contact_name', 'email', 'phone', 'city')
    readonly_fields = ('created_at', 'updated_at')
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
            'fields': ('source', 'status', 'created_at', 'updated_at'),
        }),
    )
