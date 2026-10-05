from django.db import models


class Lead(models.Model):
    """
    Top-of-funnel lead capture from the inline hero form.

    Lower friction than SampleRequest — asks only for name, surname, email,
    phone, and an optional message. Used to qualify interest before the
    prospect is ready for the full sample-request flow (which requires
    company name, business type, etc.).
    """

    SOURCE_CHOICES = [
        ('home_hero', 'Home Hero'),
        ('home_cta', 'Home Final CTA'),
        ('exit_popup', 'Exit Popup'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('converted', 'Converted to Customer'),
        ('closed', 'Closed'),
    ]

    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    message = models.TextField(blank=True)
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default='home_hero',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
    )
    # Whether the sales notification for this row actually left the server.
    #
    # Sending is best-effort by design: leads/emails.py swallows any failure so
    # a mail problem can never roll back a lead that is already saved. That is
    # the right trade-off, but it made a real outage invisible — every
    # notification this site ever sent failed SMTP authentication, and the only
    # evidence was a line in journalctl that nobody reads. Recording the result
    # puts it in the admin, where someone looking at leads will see it.
    sales_notified = models.BooleanField(
        default=False,
        help_text='Whether the sales notification email was delivered to the SMTP server.',
    )
    # --- Meta ad attribution -------------------------------------------
    #
    # event_id is minted in the browser before the form is posted and used by
    # BOTH copies of the conversion — the pixel's and the one leads/capi.py
    # sends from the server. Meta deduplicates on (event_name, event_id), so
    # the two paths can both fire without the lead being counted twice.
    #
    # fbc and fbp are Meta's click and browser identifiers, read off the
    # first-party cookies the pixel sets on this domain. Stored rather than
    # only forwarded: they are what will later let "this lead became a
    # customer" be reported back to Meta, which is the signal that teaches it
    # to find businesses that actually sign rather than businesses that
    # fill in forms.
    event_id = models.CharField(
        max_length=64,
        blank=True,
        help_text='Shared id that deduplicates the pixel and server copies of this conversion.',
    )
    fbc = models.CharField(
        max_length=255,
        blank=True,
        help_text="Meta click id (_fbc cookie). Present only when the visitor arrived from an ad.",
    )
    fbp = models.CharField(
        max_length=255,
        blank=True,
        help_text='Meta browser id (_fbp cookie).',
    )
    # Whether Meta accepted the server-side copy of this conversion. Same
    # reasoning as sales_notified: the send is best-effort and swallows its
    # failures, so without this a silently broken token would be invisible.
    capi_sent = models.BooleanField(
        default=False,
        help_text='Whether the Conversions API accepted this lead.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_status_display()})"


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
        ('catalog_request', 'Catalog Request'),
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
    contact_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
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
    # Whether the sales notification for this row actually left the server.
    #
    # Sending is best-effort by design: leads/emails.py swallows any failure so
    # a mail problem can never roll back a lead that is already saved. That is
    # the right trade-off, but it made a real outage invisible — every
    # notification this site ever sent failed SMTP authentication, and the only
    # evidence was a line in journalctl that nobody reads. Recording the result
    # puts it in the admin, where someone looking at leads will see it.
    sales_notified = models.BooleanField(
        default=False,
        help_text='Whether the sales notification email was delivered to the SMTP server.',
    )
    # --- Meta ad attribution -------------------------------------------
    #
    # event_id is minted in the browser before the form is posted and used by
    # BOTH copies of the conversion — the pixel's and the one leads/capi.py
    # sends from the server. Meta deduplicates on (event_name, event_id), so
    # the two paths can both fire without the lead being counted twice.
    #
    # fbc and fbp are Meta's click and browser identifiers, read off the
    # first-party cookies the pixel sets on this domain. Stored rather than
    # only forwarded: they are what will later let "this lead became a
    # customer" be reported back to Meta, which is the signal that teaches it
    # to find businesses that actually sign rather than businesses that
    # fill in forms.
    event_id = models.CharField(
        max_length=64,
        blank=True,
        help_text='Shared id that deduplicates the pixel and server copies of this conversion.',
    )
    fbc = models.CharField(
        max_length=255,
        blank=True,
        help_text="Meta click id (_fbc cookie). Present only when the visitor arrived from an ad.",
    )
    fbp = models.CharField(
        max_length=255,
        blank=True,
        help_text='Meta browser id (_fbp cookie).',
    )
    # Whether Meta accepted the server-side copy of this conversion. Same
    # reasoning as sales_notified: the send is best-effort and swallows its
    # failures, so without this a silently broken token would be invisible.
    capi_sent = models.BooleanField(
        default=False,
        help_text='Whether the Conversions API accepted this lead.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company_name} ({self.get_status_display()})"
