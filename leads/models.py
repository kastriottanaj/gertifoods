from django.db import models


class SampleRequest(models.Model):
    """
    Anonymous lead capture from the website.

    Prospective B2B buyers submit this to receive free product samples and a
    wholesale price list. This is the primary opt-in bribe at the top of the
    Straight Line funnel — the lowest-friction entry point before account
    creation and approval.
    """

    BUSINESS_TYPE_CHOICES = [
        ('bakery', 'Bakery'),
        ('restaurant', 'Restaurant'),
        ('hotel', 'Hotel'),
        ('supermarket', 'Supermarket / Retail'),
        ('catering', 'Catering'),
        ('distributor', 'Distributor / Wholesaler'),
        ('other', 'Other'),
    ]

    SOURCE_CHOICES = [
        ('home_hero', 'Home Hero'),
        ('exit_popup', 'Exit Popup'),
        ('products_page', 'Products Page'),
        ('contact_page', 'Contact Page'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('sent', 'Samples Sent'),
        ('converted', 'Converted to Customer'),
        ('closed', 'Closed'),
    ]

    company_name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    city = models.CharField(max_length=100, blank=True)
    business_type = models.CharField(
        max_length=20,
        choices=BUSINESS_TYPE_CHOICES,
        default='other',
    )
    products_interested = models.TextField(
        blank=True,
        help_text='Products the prospect wants to sample.',
    )
    message = models.TextField(blank=True)
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default='other',
        help_text='Which page or CTA captured this lead.',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company_name} ({self.get_status_display()})"
