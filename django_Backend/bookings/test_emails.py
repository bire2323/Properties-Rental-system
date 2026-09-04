"""Transactional booking email tests.

Uses TransactionTestCase because emails are dispatched via
transaction.on_commit; the real-commit semantics of TransactionTestCase make
mail.outbox deterministic for the atomic-wrapped admin endpoints.
"""
from datetime import date, timedelta
from decimal import Decimal

from django.core import mail
from django.test import TransactionTestCase, override_settings
from django.test.utils import override_settings as ovr
from rest_framework.test import APIClient

from accounts.models import User
from properties.models import ListingType, ListingStatus, Property, RentalUnit
from site_settings.models import SiteSettings

from .models import Booking, BookingAuditEvent
from .services import create_booking, confirm_booking_from_payment
from payments.models import PaymentTransaction


@ovr(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class BookingEmailTests(TransactionTestCase):
    def setUp(self):
        SiteSettings.objects.create(site_name="Test", house_commission_percent=Decimal("10.00"))
        self.admin = User.objects.create_user("admin@example.com", password="x", role=User.Role.ADMIN, is_staff=True, first_name="Admin", last_name="One")
        self.owner = User.objects.create_user("owner@example.com", password="x", role=User.Role.OWNER, first_name="Owner", last_name="One")
        self.renter = User.objects.create_user("renter@example.com", password="x", first_name="Renter", last_name="One")

        self.car = Property.objects.create(
            owner=self.owner, property_name="Family Sedan", description="Car",
            listing_type=ListingType.CAR, price=Decimal("100.00"),
            rental_unit=RentalUnit.DAILY, currency="ETB",
            status=ListingStatus.ACTIVE, is_available=True,
            security_deposit=Decimal("0.00"),
        )

    def _booking(self, status=Booking.BookingStatus.PENDING, property_obj=None):
        start = date.today() + timedelta(days=1)
        end = start + timedelta(days=3)
        b = Booking.objects.create(
            property=property_obj or self.car,
            renter=self.renter,
            rental_type=Booking.RentalType.FIXED_TERM,
            start_date=start,
            end_date=end,
            base_price=Decimal("300.00"),
            security_deposit=Decimal("0.00"),
            currency="ETB",
            platform_commission_rate=Decimal("5.00"),
            platform_fee_amount=Decimal("15.00"),
            owner_payout_amount=Decimal("285.00"),
            total_amount=Decimal("300.00"),
            recipient_owner=self.owner,
            status=status,
        )
        self._audit(b, "created")
        return b

    def _audit(self, b, action):
        BookingAuditEvent.objects.create(
            booking=b, booking_reference=b.booking_reference, actor=self.renter,
            actor_role=self.renter.role, action=action,
            previous_status="", new_status=b.status,
        )

    def _client(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    # ─── Created (owner notified) ───────────────────────────────────────

    def test_created_sends_email_to_owner(self):
        booking = create_booking(
            renter=self.renter,
            property_id=self.car.pk,
            rental_type=Booking.RentalType.FIXED_TERM,
            start_date=date.today() + timedelta(days=1),
            end_date=date.today() + timedelta(days=3),
        )
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertIn("New booking request", message.subject)
        self.assertEqual(message.to, ["owner@example.com"])
        # A PENDING booking is not paid: use "Amount due", never "paid".
        body = message.body
        html = "".join(c[0] for c in message.alternatives if c[1] == "text/html") or ""
        for text in (body, html):
            self.assertIn("amount due", text.lower())
            self.assertNotIn("total paid by tenant", text.lower())
            self.assertNotIn("payment received", text.lower())

    # ─── Approved (tenant notified, tenant-safe) ────────────────────────

    def test_approved_sends_payment_email_to_tenant(self):
        booking = self._booking()
        res = self._client(self.owner).patch(
            f"/api/bookings/{booking.pk}/", {"status": "approved"}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertIn("approved", message.subject.lower())
        self.assertEqual(message.to, ["renter@example.com"])
        body = message.body
        html = "".join(c[0] for c in message.alternatives if c[1] == "text/html") or ""
        for text in (body, html):
            # APPROVED is still awaiting payment: "Amount due", not "received".
            self.assertIn("amount due", text.lower())
            self.assertNotIn("payment received", text.lower())
            self.assertNotIn("owner payout", text.lower())
            self.assertNotIn("platform fee", text.lower())

    # ─── Rejected (tenant notified) ─────────────────────────────────────

    def test_rejected_sends_email_to_tenant(self):
        booking = self._booking()
        res = self._client(self.owner).patch(
            f"/api/bookings/{booking.pk}/", {"status": "rejected"}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertIn("not approved", message.body.lower())
        self.assertEqual(message.to, ["renter@example.com"])

    # ─── Renter cancel → owner ──────────────────────────────────────────

    def test_renter_cancel_sends_email_to_owner(self):
        booking = self._booking()
        res = self._client(self.renter).delete(f"/api/bookings/{booking.pk}/")
        self.assertEqual(res.status_code, 204)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertIn("cancelled", message.subject.lower())
        self.assertEqual(message.to, ["owner@example.com"])

    # ─── Admin cancel → tenant ──────────────────────────────────────────

    def test_admin_cancel_sends_email_to_tenant(self):
        booking = self._booking()
        res = self._client(self.admin).post(
            f"/api/bookings/{booking.pk}/admin/cancel/",
            {"reason": "Owner unavailable"}, format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertIn("by the owner", message.body)
        self.assertEqual(message.to, ["renter@example.com"])

    # ─── Admin expire → both ────────────────────────────────────────────

    def test_admin_expire_sends_email_to_both(self):
        booking = self._booking()
        res = self._client(self.admin).post(
            f"/api/bookings/{booking.pk}/admin/expire/",
            {"reason": "Expired"}, format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(set(mail.outbox[0].to), {"owner@example.com", "renter@example.com"})

    # ─── Admin complete → both ──────────────────────────────────────────

    def test_admin_complete_sends_email_to_both(self):
        booking = self._booking(status=Booking.BookingStatus.CONFIRMED)
        res = self._client(self.admin).post(
            f"/api/bookings/{booking.pk}/admin/complete/",
            {"reason": "All good"}, format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(set(mail.outbox[0].to), {"owner@example.com", "renter@example.com"})

    # ─── Confirmed only after verified payment ──────────────────────────

    def test_confirmed_email_only_after_verified_payment(self):
        booking = self._booking(status=Booking.BookingStatus.APPROVED)
        payment = PaymentTransaction.objects.create(
            booking=booking, payer=self.renter,
            payment_method=PaymentTransaction.PaymentMethod.CASH,
            amount=booking.total_amount, currency=booking.currency,
            status=PaymentTransaction.PaymentStatus.SUCCESSFUL,
        )
        confirm_booking_from_payment(payment)
        self.assertEqual(booking.status, Booking.BookingStatus.CONFIRMED)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertIn("confirmed", message.subject.lower())
        self.assertEqual(message.to, ["renter@example.com"])
        body = message.body
        html = "".join(c[0] for c in message.alternatives if c[1] == "text/html") or ""
        for text in (body, html):
            # Only after authoritative verification may the email claim received.
            self.assertIn("payment received", text.lower())
            self.assertIn("confirmed", text.lower())

    def test_no_confirmation_email_for_unverified_payment(self):
        booking = self._booking(status=Booking.BookingStatus.APPROVED)
        payment = PaymentTransaction.objects.create(
            booking=booking, payer=self.renter,
            payment_method=PaymentTransaction.PaymentMethod.CASH,
            amount=booking.total_amount, currency=booking.currency,
            status=PaymentTransaction.PaymentStatus.PENDING,
        )
        with self.assertRaises(ValueError):
            confirm_booking_from_payment(payment)
        self.assertEqual(len(mail.outbox), 0)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.BookingStatus.APPROVED)

    # ─── Duplicate protection ───────────────────────────────────────────

    def test_no_duplicate_email_when_actor_cannot_approve(self):
        booking = self._booking()
        # Renter has no permission to approve, so status stays PENDING.
        res = self._client(self.renter).patch(
            f"/api/bookings/{booking.pk}/", {"status": "approved"}, format="json"
        )
        self.assertIn(res.status_code, (400, 403))
        self.assertEqual(len(mail.outbox), 0)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.BookingStatus.PENDING)

    # ─── Rollback: no email on failed transaction ───────────────────────

    def test_no_email_when_transaction_rolls_back(self):
        from django.db import transaction, IntegrityError

        booking = self._booking(status=Booking.BookingStatus.PENDING)
        previous = booking.status
        with self.assertRaises(Exception):
            with transaction.atomic():
                booking.status = Booking.BookingStatus.APPROVED
                booking.save(update_fields=["status", "updated_at"])
                from .email_service import send_booking_approved_email

                send_booking_approved_email(booking)
                raise RuntimeError("boom")
        self.assertEqual(len(mail.outbox), 0)
        booking.refresh_from_db()
        self.assertEqual(booking.status, previous)

    # ─── Email failure never breaks the status change ───────────────────

    @override_settings(EMAIL_BACKEND="bookings.test_email_backend.FailingEmailBackend")
    def test_email_failure_preserves_status_change(self):
        booking = self._booking()
        res = self._client(self.owner).patch(
            f"/api/bookings/{booking.pk}/", {"status": "approved"}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.BookingStatus.APPROVED)

    # ─── SMTP configuration (development uses Gmail SMTP) ───────────────

    def test_development_email_backend_is_gmail_smtp_not_console(self):
        """Verify the settings file configures Gmail SMTP for development.

        The live settings object is overridden by @override_settings for
        locmem in this test class; we therefore read the source file directly.
        """
        from pathlib import Path
        from django.conf import settings

        settings_path = Path(settings.BASE_DIR) / "config" / "settings.py"
        source = settings_path.read_text(encoding="utf-8")
        self.assertIn("smtp.EmailBackend", source)
        self.assertIn("smtp.gmail.com", source)
        self.assertIn("465", source)
        # Must not have console as the *default* backend.
        self.assertNotIn('default="django.core.mail.backends.console.EmailBackend"', source)

    # ─── Security: credentials come from environment, never hard-coded ─

    def test_smtp_credentials_loaded_from_environment(self):
        """EMAIL_HOST_USER/PASSWORD must come from .env via decouple."""
        from pathlib import Path
        from django.conf import settings
        from decouple import config as decouple_config

        # Values must resolve from the environment through decouple.
        self.assertEqual(settings.EMAIL_HOST_USER, decouple_config("EMAIL_HOST_USER", default=""))
        self.assertEqual(
            settings.EMAIL_HOST_PASSWORD, decouple_config("EMAIL_HOST_PASSWORD", default="")
        )

        # The SMTP password must NOT appear in settings.py source.
        password = settings.EMAIL_HOST_PASSWORD
        if password:
            settings_path = Path(settings.BASE_DIR) / "config" / "settings.py"
            settings_source = settings_path.read_text(encoding="utf-8")
            self.assertNotIn(password, settings_source)
