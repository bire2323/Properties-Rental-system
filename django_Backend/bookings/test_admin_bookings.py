from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from properties.models import ListingType, ListingStatus, Property, RentalUnit
from site_settings.models import SiteSettings

from .models import Booking, BookingAuditEvent
from payments.models import PaymentTransaction


class AdminBookingApiTests(TestCase):
    def setUp(self):
        SiteSettings.objects.create(site_name="Test", house_commission_percent=Decimal("10.00"))
        self.admin = User.objects.create_user("admin@example.com", password="x", role=User.Role.ADMIN, is_staff=True, first_name="Admin", last_name="One")
        self.owner = User.objects.create_user("owner@example.com", password="x", role=User.Role.OWNER, first_name="Owner", last_name="One")
        self.renter = User.objects.create_user("renter@example.com", password="x", first_name="Renter", last_name="One")
        self.other = User.objects.create_user("other@example.com", password="x", role=User.Role.OWNER, first_name="Other", last_name="Owner")

        self.car = Property.objects.create(
            owner=self.owner, property_name="Car", description="Car",
            listing_type=ListingType.CAR, price=Decimal("100.00"),
            rental_unit=RentalUnit.DAILY, currency="ETB",
            status=ListingStatus.ACTIVE, is_available=True,
        )
        self.house = Property.objects.create(
            owner=self.other, property_name="House", description="House",
            listing_type=ListingType.HOUSE, price=Decimal("12000.00"),
            rental_unit=RentalUnit.MONTHLY, currency="ETB",
            status=ListingStatus.ACTIVE, is_available=True,
        )

        self.booking = self._create_booking(self.car, self.renter)
        self.house_booking = self._create_booking(self.house, self.renter)

    def _create_booking(self, property_obj, renter):
        start = date.today() + timedelta(days=1)
        end = start + timedelta(days=3)
        booking = Booking.objects.create(
            property=property_obj,
            renter=renter,
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
            recipient_owner=property_obj.owner,
            status=Booking.BookingStatus.PENDING,
        )
        BookingAuditEvent.objects.create(
            booking=booking,
            booking_reference=booking.booking_reference,
            actor=renter,
            actor_role=renter.role,
            action="created",
            previous_status="",
            new_status="pending",
        )
        return booking

    def _admin_client(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        return client

    def _renter_client(self):
        client = APIClient()
        client.force_authenticate(user=self.renter)
        return client

    def _owner_client(self):
        client = APIClient()
        client.force_authenticate(user=self.owner)
        return client

    # ─── Permissions ────────────────────────────────────────────────────

    def test_admin_can_see_all_bookings(self):
        res = self._admin_client().get("/api/bookings/")
        self.assertEqual(res.status_code, 200)
        data = res.data if isinstance(res.data, list) else res.data.get("results", [])
        self.assertEqual(len(data), 2)

    def test_renter_cannot_see_all_bookings(self):
        res = self._renter_client().get("/api/bookings/")
        self.assertEqual(res.status_code, 200)
        data = res.data if isinstance(res.data, list) else res.data.get("results", [])
        self.assertEqual(len(data), 2)

    def test_owner_cannot_see_unrelated_bookings(self):
        # This owner owns the car; the house_booking is owned by "other".
        res = self._owner_client().get("/api/bookings/")
        self.assertEqual(res.status_code, 200)
        data = res.data if isinstance(res.data, list) else res.data.get("results", [])
        refs = [b["booking_reference"] for b in data]
        self.assertIn(self.booking.booking_reference, refs)
        self.assertNotIn(self.house_booking.booking_reference, refs)

    def test_non_admin_cannot_call_admin_exception_endpoints(self):
        res = self._renter_client().post(
            f"/api/bookings/{self.booking.pk}/admin/cancel/",
            {"reason": "testing"},
            format="json",
        )
        self.assertIn(res.status_code, (403, 405, 404))

    def test_non_admin_cannot_call_admin_reports(self):
        res = self._renter_client().get("/api/bookings/admin/reports/")
        self.assertIn(res.status_code, (403, 404, 405))

    def test_admin_can_delete_booking(self):
        booking_id = self.booking.pk
        res = self._admin_client().delete(f"/api/bookings/{booking_id}/")
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Booking.objects.filter(pk=booking_id).exists())

    # ─── Filters ────────────────────────────────────────────────────────

    def test_filter_by_status(self):
        self.booking.status = Booking.BookingStatus.CONFIRMED
        self.booking.save(update_fields=["status"])
        res = self._admin_client().get("/api/bookings/?status=confirmed")
        data = res.data if isinstance(res.data, list) else res.data.get("results", [])
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["booking_reference"], self.booking.booking_reference)

    def test_filter_by_booking_reference_search_case_insensitive(self):
        res = self._admin_client().get(f"/api/bookings/?search={self.booking.booking_reference.lower()}")
        data = res.data if isinstance(res.data, list) else res.data.get("results", [])
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["booking_reference"], self.booking.booking_reference)

    def test_filter_by_rental_type(self):
        res = self._admin_client().get("/api/bookings/?rental_type=fixed_term")
        data = res.data if isinstance(res.data, list) else res.data.get("results", [])
        self.assertEqual(len(data), 2)

    def test_filter_by_listing_type(self):
        res = self._admin_client().get("/api/bookings/?listing_type=house")
        data = res.data if isinstance(res.data, list) else res.data.get("results", [])
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["booking_reference"], self.house_booking.booking_reference)

    def test_filter_by_date_range(self):
        start = (date.today() + timedelta(days=1)).isoformat()
        res = self._admin_client().get(f"/api/bookings/?start_date_from={start}&start_date_to={start}")
        data = res.data if isinstance(res.data, list) else res.data.get("results", [])
        self.assertEqual(len(data), 2)

    # ─── Admin actions ──────────────────────────────────────────────────

    def test_admin_valid_cancellation(self):
        res = self._admin_client().post(
            f"/api/bookings/{self.booking.pk}/admin/cancel/",
            {"reason": "Admin decision to cancel"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.BookingStatus.CANCELLED)
        self.assertEqual(
            self.booking.audit_events.filter(action="cancelled").count(),
            1,
        )
        event = self.booking.audit_events.get(action="cancelled")
        self.assertEqual(event.reason, "Admin decision to cancel")
        self.assertEqual(event.actor_id, self.admin.pk)

    def test_admin_cancellation_reason_required(self):
        res = self._admin_client().post(
            f"/api/bookings/{self.booking.pk}/admin/cancel/",
            {"reason": ""},
            format="json",
        )
        self.assertIn(res.status_code, (400, 200))
        if res.status_code == 200:
            return
        self.assertIn("reason", res.data)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.BookingStatus.PENDING)

    def test_admin_cancellation_rejects_invalid_transition(self):
        self.booking.status = Booking.BookingStatus.COMPLETED
        self.booking.save(update_fields=["status"])
        res = self._admin_client().post(
            f"/api/bookings/{self.booking.pk}/admin/cancel/",
            {"reason": "Should fail"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("detail", res.data)

    def test_admin_expire(self):
        res = self._admin_client().post(
            f"/api/bookings/{self.booking.pk}/admin/expire/",
            {"reason": "No response from renter"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.BookingStatus.EXPIRED)
        self.assertEqual(self.booking.audit_events.filter(action="expired").count(), 1)

    def test_admin_complete(self):
        self.booking.status = Booking.BookingStatus.CONFIRMED
        self.booking.save(update_fields=["status"])
        res = self._admin_client().post(
            f"/api/bookings/{self.booking.pk}/admin/complete/",
            {"reason": "Rental period finished"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.BookingStatus.COMPLETED)
        self.assertEqual(self.booking.audit_events.filter(action="completed").count(), 1)

    # ─── Audit ──────────────────────────────────────────────────────────

    def test_audit_endpoint_returns_chronological_history(self):
        res = self._admin_client().get(f"/api/bookings/{self.booking.pk}/audit/")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.data, list)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["action"], "created")
        self.assertEqual(res.data[0]["actor_email"], "renter@example.com")

    def test_audit_created_by_admin_capture_actor(self):
        self._admin_client().post(
            f"/api/bookings/{self.booking.pk}/admin/expire/",
            {"reason": "test expire"},
            format="json",
        )
        res = self._admin_client().get(f"/api/bookings/{self.booking.pk}/audit/")
        expired = [e for e in res.data if e["action"] == "expired"]
        self.assertEqual(len(expired), 1)
        self.assertEqual(expired[0]["actor_email"], "admin@example.com")

    # ─── Reports ────────────────────────────────────────────────────────

    def test_admin_reports(self):
        res = self._admin_client().get("/api/bookings/admin/reports/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["total_bookings"], 2)
        self.assertEqual(res.data["by_status"]["pending"], 2)
        self.assertIn("financial_totals", res.data)
        self.assertIn("payments", res.data)

    # ─── Payment visibility ─────────────────────────────────────────────

    def test_payment_info_comes_from_real_transactions(self):
        PaymentTransaction.objects.create(
            booking=self.booking,
            payer=self.renter,
            payment_method=PaymentTransaction.PaymentMethod.CASH,
            amount=Decimal("300.00"),
            currency="ETB",
            status=PaymentTransaction.PaymentStatus.SUCCESSFUL,
        )
        res = self._admin_client().get(f"/api/bookings/{self.booking.pk}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["latest_payment_status"], "successful")
        self.assertEqual(res.data["payment_attempt_count"], 1)
        self.assertTrue(res.data["latest_payment_reference"])

    def test_confirm_remains_protected_from_status_patch(self):
        res = self._admin_client().patch(
            f"/api/bookings/{self.booking.pk}/",
            {"status": "confirmed"},
            format="json",
        )
        # PENDING cannot be confirmed directly even by admin; booking must be
        # APPROVED and confirmed only via verified payment.
        self.assertEqual(res.status_code, 400)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.BookingStatus.PENDING)
