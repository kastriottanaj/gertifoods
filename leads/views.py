import os
from django.conf import settings
from django.core.mail import EmailMessage
from rest_framework import generics, permissions

from .models import Lead, SampleRequest
from .serializers import LeadSerializer, SampleRequestSerializer


class LeadCreateView(generics.CreateAPIView):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.AllowAny]


class SampleRequestCreateView(generics.CreateAPIView):
    queryset = SampleRequest.objects.all()
    serializer_class = SampleRequestSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        instance = serializer.save()
        if instance.source == 'catalog_request':
            self._send_catalog_email(instance)

    def _send_catalog_email(self, instance):
        pdf_path = settings.CATALOG_PDF_PATH
        if not os.path.exists(pdf_path):
            return

        # Email to the customer with PDF attached
        customer_email = EmailMessage(
            subject='Katalogu i Produkteve — Gerti Foods 2026',
            body=(
                f'Përshëndetje {instance.company_name},\n\n'
                'Faleminderit për interesimin tuaj në produktet tona!\n\n'
                'Ju lutem gjeni të bashkëlidhur katalogun tonë të plotë të produkteve për vitin 2026.\n\n'
                'Për çdo pyetje ose për të rezervuar një takim me ekipin tonë të shitjeve,\n'
                'mund të na kontaktoni:\n'
                '  • Email: arlinda@gertifoods.com\n'
                '  • Tel: +383 49 111 150\n'
                '  • WhatsApp: +383 49 111 150\n\n'
                'Me respekt,\n'
                'Ekipi i Gerti Foods\n'
                'www.gertifoods.com'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[instance.email],
        )
        with open(pdf_path, 'rb') as f:
            customer_email.attach('Katallogu_GertiFoods_2026.pdf', f.read(), 'application/pdf')
        customer_email.send(fail_silently=True)

        # Notification to sales team
        sales_email = EmailMessage(
            subject=f'Kërkesë e re katalog — {instance.company_name}',
            body=(
                f'Kërkesë e re për katalog:\n\n'
                f'Kompania: {instance.company_name}\n'
                f'Email: {instance.email}\n'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.SALES_EMAIL],
        )
        sales_email.send(fail_silently=True)
