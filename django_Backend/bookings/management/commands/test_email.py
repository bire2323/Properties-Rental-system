"""Real SMTP delivery test command.

Usage:
    python manage.py test_email recipient@gmail.com
    python manage.py test_email --recipient "Temesgen <real-owner@gmail.com>"

Sends a real email through the configured EMAIL_BACKEND (in development this is
Gmail SMTP) so you can verify Django -> smtp.gmail.com -> recipient's inbox is
working. The message is clearly labelled a delivery TEST -- it is NOT a booking
or payment event and must never be mistaken for a successful payment.
"""

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand, CommandError
from django.template.loader import render_to_string


class Command(BaseCommand):
    help = "Send a real test email via the configured SMTP backend."

    def add_arguments(self, parser):
        parser.add_argument("recipient", nargs="?", help="Recipient email address.")
        parser.add_argument(
            "--recipient",
            dest="recipient_opt",
            help="Recipient email address (alternative to positional arg).",
        )

    def handle(self, *args, **options):
        recipient = (options.get("recipient_opt") or options.get("recipient") or "").strip()
        if not recipient:
            raise CommandError(
                "Provide a recipient email, e.g. python manage.py test_email real-owner@gmail.com"
            )

        from site_settings.models import SiteSettings

        site = SiteSettings.objects.order_by("pk").first()
        site_name = site.site_name if site and site.site_name else getattr(
            settings, "DEFAULT_FROM_NAME", "Property Rental System"
        )

        context = {
            "site_name": site_name,
            "recipient": recipient,
            "backend": settings.EMAIL_BACKEND.split(".")[-2],
            "host": settings.EMAIL_HOST or "(not set)",
            "port": settings.EMAIL_PORT,
        }

        try:
            html_body = render_to_string("emails/test_email.html", context)
        except Exception:
            html_body = None
        try:
            text_body = render_to_string("emails/test_email.txt", context)
        except Exception:
            text_body = None

        subject = f"[Delivery test] {site_name} email configuration check"
        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body or "Email configuration test.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )
        if html_body:
            message.attach_alternative(html_body, "text/html")

        try:
            sent = message.send(fail_silently=False)
        except Exception as exc:  # noqa: BLE001
            raise CommandError(
                f"SMTP delivery failed to {recipient} via "
                f"{context['host']}:{context['port']}: {exc}"
            ) from exc

        if not sent:
            raise CommandError("SMTP backend did not report any message sent.")

        self.stdout.write(
            self.style.SUCCESS(
                f"Test email sent to {recipient} via "
                f"{context['host']}:{context['port']} (backend: {settings.EMAIL_BACKEND})."
            )
        )
