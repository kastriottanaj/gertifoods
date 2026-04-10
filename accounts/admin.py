from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'company_name', 'is_approved', 'is_staff']
    list_filter = ['is_approved', 'is_staff', 'country']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Business Info', {
            'fields': ('company_name', 'phone', 'address', 'city', 'country', 'is_approved'),
        }),
    )
