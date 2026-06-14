from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    company_name = models.CharField(max_length=255, blank=True)
    business_id = models.CharField(max_length=50, blank=True, help_text='Business identification/registration number')
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='Kosovo')
    is_approved = models.BooleanField(
        default=False,
        help_text='Business accounts must be approved before they can place orders.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company_name or self.username}"
