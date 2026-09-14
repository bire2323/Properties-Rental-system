"""Tests for date-based vehicle availability (and house overlap safeguards).

Covers:
  - The overlap matrix required for vehicle rentals (fixed-term, half-open
    intervals [start, end) where end_date is the return day and same-day
    turnover is allowed).
  - Which booking statuses block the calendar.
  - The public availability endpoint and the date-filtered listing search.
"""
from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError

from accounts.models import User
from properties.models import ListingType, ListingStatus, Property, RentalUnit
from site_settings.models import SiteSettings

from .models import Booking
from .serializers import BookingCreateSerializer


def future(days):
    return date.today() + timedelta(days=days)


class VehicleAvailabilityBusinessRulesTests(TestCase):
    """The core overlap matrix (PENDING blocks the calendar like APPROVED/CONFIRMED)."""

    def setUp(self):
        self.owner = User.objects.create_user("owner@example.com", password="x", role=User.Role.OWNER, first_name="Owner", last_name="One")
        self.renter = User.objects.create_user("renter@example.com", password="x", first_name="Renter", last_name="One")
        self.other_renter = User.objects.create_user("other@example.com", password="x", first_name="Other", last_name="Renter")
        SiteSettings.objects.create(site_name="Test", house_commission_percent=Decimal("10.00"))
        self.car = self.make_property("Car", ListingType.CAR, RentalUnit.DAILY, Decimal("100.00"))
        self.second_car = self.make_property("Second Car", ListingType.CAR, RentalUnit.DAILY, Decimal("150.00"))
        self.request = SimpleNamespace(user=self.renter)

    def make_property(self, name, listing_type, rental_unit, price):
        return Property.objects.create(
            owner=self.owner,
            property_name=name,
            description=name,
            listing_type=listing_type,
            price=price,
            rental_unit=rental_unit,
            currency="ETB",
            status=ListingStatus.ACTIVE,
            is_available=True,
        )

    def create(self, property_obj, start, end, user=None):
        data = {"property": property_obj.pk, "start_date": start, "end_date": end}
        request = SimpleNamespace(user=user or self.renter)
        serializer = BookingCreateSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def make_booking(self, property_obj, user, start, end, status):
        """Create a booking directly with an arbitrary status."""
        return Booking.objects.create(
            property=property_obj,
            renter=user,
            rental_type=Booking.RentalType.FIXED_TERM,
            start_date=start,
            end_date=end,
            base_price=Decimal("100.00"),
            security_deposit=Decimal("0.00"),
            currency="ETB",
            platform_commission_rate=Decimal("5.00"),
            platform_fee_amount=Decimal("5.00"),
            owner_payout_amount=Decimal("95.00"),
            total_amount=Decimal("100.00"),
            recipient_owner=property_obj.owner,
            status=status,
        )

    def assert_rejected(self, property_obj, start, end, user=None):
        with self.assertRaises(ValidationError):
            self.create(property_obj, start, end, user)

    def assert_allowed(self, property_obj, start, end, user=None):
        booking = self.create(property_obj, start, end, user)
        self.assertEqual(booking.status, Booking.BookingStatus.PENDING)

    # ── Overlap matrix (existing rental [start, start+3)) ───────────────

    def test_same_dates_rejected(self):
        existing = future(20)
        self.create(self.car, existing, existing + timedelta(days=3))
        self.assert_rejected(self.car, existing, existing + timedelta(days=3))

    def test_starts_within_existing_rejected(self):
        existing = future(20)
        self.create(self.car, existing, existing + timedelta(days=3))
        self.assert_rejected(self.car, existing + timedelta(days=1), existing + timedelta(days=4))

    def test_ends_within_existing_rejected(self):
        existing = future(20)
        self.create(self.car, existing, existing + timedelta(days=3))
        self.assert_rejected(self.car, existing - timedelta(days=2), existing + timedelta(days=1))

    def test_contains_existing_rejected(self):
        existing = future(20)
        self.create(self.car, existing, existing + timedelta(days=3))
        self.assert_rejected(self.car, existing - timedelta(days=3), existing + timedelta(days=6))

    def test_before_existing_ending_on_existing_start_allowed(self):
        """Request ending on the existing start day: ALLOW (return day = start day)."""
        existing = future(20)
        self.create(self.car, existing, existing + timedelta(days=3))
        self.assert_allowed(self.car, existing - timedelta(days=5), existing)

    def test_after_existing_starting_on_existing_end_allowed(self):
        """Request starting on the existing return day: ALLOW (same-day turnover)."""
        existing = future(20)
        self.create(self.car, existing, existing + timedelta(days=3))
        self.assert_allowed(self.car, existing + timedelta(days=3), existing + timedelta(days=7))

    def test_different_vehicle_always_allowed(self):
        existing = future(20)
        self.create(self.car, existing, existing + timedelta(days=3))
        self.assert_allowed(self.second_car, existing, existing + timedelta(days=3))

    def test_multiple_gap_bookings_fit(self):
        """Two existing bookings on the same vehicle still allow a gap between them."""
        first = future(20)
        second = future(40)
        self.create(self.car, first, first + timedelta(days=5))
        self.create(self.car, second, second + timedelta(days=5))
        self.assert_allowed(self.car, first + timedelta(days=6), second)

    # ── Which statuses block the calendar ───────────────────────────────

    def test_pending_blocks(self):
        start = future(10)
        self.make_booking(self.car, self.other_renter, start, start + timedelta(days=3), Booking.BookingStatus.PENDING)
        self.assert_rejected(self.car, start, start + timedelta(days=3))

    def test_approved_blocks(self):
        start = future(10)
        self.make_booking(self.car, self.other_renter, start, start + timedelta(days=3), Booking.BookingStatus.APPROVED)
        self.assert_rejected(self.car, start, start + timedelta(days=3))

    def test_confirmed_blocks(self):
        start = future(10)
        self.make_booking(self.car, self.other_renter, start, start + timedelta(days=3), Booking.BookingStatus.CONFIRMED)
        self.assert_rejected(self.car, start, start + timedelta(days=3))

    def test_rejected_does_not_block(self):
        start = future(10)
        self.make_booking(self.car, self.other_renter, start, start + timedelta(days=3), Booking.BookingStatus.REJECTED)
        self.assert_allowed(self.car, start, start + timedelta(days=3))

    def test_cancelled_does_not_block(self):
        start = future(10)
        self.make_booking(self.car, self.other_renter, start, start + timedelta(days=3), Booking.BookingStatus.CANCELLED)
        self.assert_allowed(self.car, start, start + timedelta(days=3))

    def test_completed_does_not_block(self):
        start = future(10)
        self.make_booking(self.car, self.other_renter, start, start + timedelta(days=3), Booking.BookingStatus.COMPLETED)
        self.assert_allowed(self.car, start, start + timedelta(days=3))

    def test_expired_does_not_block(self):
        start = future(10)
        self.make_booking(self.car, self.other_renter, start, start + timedelta(days=3), Booking.BookingStatus.EXPIRED)
        self.assert_allowed(self.car, start, start + timedelta(days=3))

    # ── Error message for conflicts ─────────────────────────────────────

    def test_car_conflict_error_message_includes_dates(self):
        existing = future(20)
        self.create(self.car, existing, existing + timedelta(days=3))
        start = (existing + timedelta(days=1)).isoformat()
        end = (existing + timedelta(days=4)).isoformat()
        serializer = BookingCreateSerializer(
            data={"property": self.car.pk, "start_date": start, "end_date": end},
            context={"request": self.request},
        )
        self.assertFalse(serializer.is_valid())
        expected = (
            f"This vehicle is already rented from "
            f"{existing.isoformat()} to {(existing + timedelta(days=3)).isoformat()}."
        )
        self.assertEqual(
            {"non_field_errors": [expected]},
            {k: [str(e) for e in v] for k, v in serializer.errors.items()},
        )


class VehicleAvailabilityApiTests(TestCase):
    """Public availability endpoint + date-filtered search."""

    def setUp(self):
        self.owner = User.objects.create_user("owner@example.com", password="x", role=User.Role.OWNER, first_name="Owner", last_name="One")
        self.renter = User.objects.create_user("renter@example.com", password="x", first_name="Renter", last_name="One")
        SiteSettings.objects.create(site_name="Test", house_commission_percent=Decimal("10.00"))
        self.client = APIClient()

        self.car = Property.objects.create(
            owner=self.owner, property_name="Car", description="Car",
            listing_type=ListingType.CAR, price=Decimal("100.00"),
            rental_unit=RentalUnit.DAILY, currency="ETB",
            status=ListingStatus.ACTIVE, is_available=True,
        )
        self.free_car = Property.objects.create(
            owner=self.owner, property_name="Free Car", description="Free",
            listing_type=ListingType.CAR, price=Decimal("100.00"),
            rental_unit=RentalUnit.DAILY, currency="ETB",
            status=ListingStatus.ACTIVE, is_available=True,
        )

    def make_booking(self, property_obj, start, end):
        return Booking.objects.create(
            property=property_obj,
            renter=self.renter,
            rental_type=Booking.RentalType.FIXED_TERM,
            start_date=start,
            end_date=end,
            base_price=Decimal("100.00"),
            security_deposit=Decimal("0.00"),
            currency="ETB",
            platform_commission_rate=Decimal("5.00"),
            platform_fee_amount=Decimal("5.00"),
            owner_payout_amount=Decimal("95.00"),
            total_amount=Decimal("100.00"),
            recipient_owner=property_obj.owner,
            status=Booking.BookingStatus.PENDING,
        )

    def availability_url(self, property_id, start, end):
        return f"/api/properties/{property_id}/availability/?start_date={start.isoformat()}&end_date={end.isoformat()}"

    # ── Availability endpoint ───────────────────────────────────────────

    def test_available_when_no_booking(self):
        start = future(19)
        end = start + timedelta(days=5)
        response = self.client.get(self.availability_url(self.car.pk, start, end))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"available": True, "conflicting_booking": None})

    def test_unavailable_when_blocked_reports_conflict_dates_only(self):
        start = future(15)
        self.make_booking(self.car, start, start + timedelta(days=3))
        requested_start = start + timedelta(days=1)
        requested_end = start + timedelta(days=4)
        response = self.client.get(self.availability_url(self.car.pk, requested_start, requested_end))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["available"])
        self.assertEqual(
            response.data["conflicting_booking"],
            {"start_date": start.isoformat(), "end_date": (start + timedelta(days=3)).isoformat()},
        )

    def test_unavailable_report_exposes_only_dates_not_renter(self):
        """The conflicting_booking payload must never leak renter information."""
        start = future(15)
        self.make_booking(self.car, start, start + timedelta(days=3))
        requested_start = start + timedelta(days=1)
        requested_end = start + timedelta(days=4)
        response = self.client.get(self.availability_url(self.car.pk, requested_start, requested_end))
        payload_keys = response.data["conflicting_booking"].keys()
        self.assertEqual(set(payload_keys), {"start_date", "end_date"})

    def test_available_on_return_day_same_day_turnover(self):
        start = future(15)
        self.make_booking(self.car, start, start + timedelta(days=3))
        response = self.client.get(self.availability_url(self.car.pk, start + timedelta(days=3), start + timedelta(days=7)))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["available"], True)

    def test_available_before_existing(self):
        start = future(15)
        self.make_booking(self.car, start, start + timedelta(days=3))
        response = self.client.get(self.availability_url(self.car.pk, start - timedelta(days=5), start))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["available"], True)

    def test_requires_start_and_end_dates(self):
        response = self.client.get(f"/api/properties/{self.car.pk}/availability/")
        self.assertEqual(response.status_code, 400)

    def test_rejects_invalid_date_format(self):
        response = self.client.get(
            f"/api/properties/{self.car.pk}/availability/?start_date=15-09-2026&end_date=2026-09-18"
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_end_date_not_after_start_date(self):
        start = future(15)
        response = self.client.get(self.availability_url(self.car.pk, start, start))
        self.assertEqual(response.status_code, 400)

    def test_returns_404_for_unknown_property(self):
        response = self.client.get(self.availability_url(999999, future(1), future(5)))
        self.assertEqual(response.status_code, 404)

    # ── Date-filtered listing search ────────────────────────────────────

    def test_conflicted_vehicle_excluded_from_search(self):
        start = future(15)
        self.make_booking(self.car, start, start + timedelta(days=3))
        response = self.client.get(
            f"/api/properties/?type=car&start_date={start.isoformat()}&end_date={(start + timedelta(days=3)).isoformat()}"
        )
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.data}
        self.assertNotIn(self.car.pk, ids)
        self.assertIn(self.free_car.pk, ids)

    def test_adjacent_period_vehicle_included_in_search(self):
        """Existing [start, start+3); searching start+3 → start+7 must still show the car."""
        start = future(15)
        self.make_booking(self.car, start, start + timedelta(days=3))
        response = self.client.get(
            f"/api/properties/?type=car&start_date={(start + timedelta(days=3)).isoformat()}&end_date={(start + timedelta(days=7)).isoformat()}"
        )
        results = response.data
        ids = {item["id"] for item in results}
        self.assertIn(self.car.pk, ids)

    def test_search_without_dates_includes_conflicted_vehicle(self):
        start = future(15)
        self.make_booking(self.car, start, start + timedelta(days=3))
        response = self.client.get("/api/properties/?type=car")
        ids = {item["id"] for item in response.data}
        self.assertIn(self.car.pk, ids)