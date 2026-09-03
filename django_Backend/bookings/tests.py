from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from accounts.models import User
from properties.models import ListingType, ListingStatus, Property, RentalUnit
from site_settings.models import SiteSettings

from .models import Booking
from .serializers import BookingCreateSerializer
from .services import confirm_booking_from_payment
from payments.models import PaymentTransaction


class BookingBusinessRulesTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user("owner@example.com", password="x", role=User.Role.OWNER, first_name="Owner", last_name="One")
        self.renter = User.objects.create_user("renter@example.com", password="x", first_name="Renter", last_name="One")
        self.other_renter = User.objects.create_user("other@example.com", password="x", first_name="Other", last_name="One")
        SiteSettings.objects.create(site_name="Test", house_commission_percent=Decimal("10.00"))
        self.car = self.make_property("Car", ListingType.CAR, RentalUnit.DAILY, Decimal("100.00"))
        self.house = self.make_property("House", ListingType.HOUSE, RentalUnit.MONTHLY, Decimal("12000.00"))
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

    def create(self, property_obj, start, end, rental_type=None, user=None):
        data = {"property": property_obj.pk, "start_date": start, "end_date": end}
        if rental_type is not None:
            data["rental_type"] = rental_type
        request = SimpleNamespace(user=user or self.renter)
        serializer = BookingCreateSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def test_car_fixed_period_calculates_snapshot(self):
        booking = self.create(self.car, date.today() + timedelta(days=1), date.today() + timedelta(days=6))
        self.assertEqual(booking.rental_type, Booking.RentalType.FIXED_TERM)
        self.assertEqual(booking.base_price, Decimal("500.00"))
        self.assertEqual(booking.platform_fee_amount, Decimal("50.00"))
        self.assertEqual(booking.owner_payout_amount, Decimal("450.00"))
        self.assertEqual(booking.status, Booking.BookingStatus.PENDING)

    def test_car_rejects_month_to_month_and_invalid_dates(self):
        start = date.today() + timedelta(days=1)
        for end in (None, start, start - timedelta(days=1)):
            serializer = BookingCreateSerializer(
                data={"property": self.car.pk, "start_date": start, "end_date": end},
                context={"request": self.request},
            )
            self.assertFalse(serializer.is_valid())
        serializer = BookingCreateSerializer(
            data={"property": self.car.pk, "rental_type": "month_to_month", "start_date": start},
            context={"request": self.request},
        )
        self.assertFalse(serializer.is_valid())

    def test_fixed_term_overlap_is_rejected_but_adjacent_period_is_allowed(self):
        start = date.today() + timedelta(days=2)
        self.create(self.car, start, start + timedelta(days=5))
        with self.assertRaises(ValidationError):
            self.create(self.car, start + timedelta(days=2), start + timedelta(days=6))
        self.create(self.car, start + timedelta(days=5), start + timedelta(days=8))

    def test_house_month_to_month_is_open_ended_and_blocks_future_tenancy(self):
        start = date.today() + timedelta(days=1)
        booking = self.create(self.house, start, None, Booking.RentalType.MONTH_TO_MONTH)
        self.assertIsNone(booking.end_date)
        with self.assertRaises(ValidationError):
            self.create(self.house, start + timedelta(days=30), start + timedelta(days=60), Booking.RentalType.FIXED_TERM, self.other_renter)

    def test_house_fixed_term_requires_end_date(self):
        start = date.today() + timedelta(days=1)
        booking = self.create(self.house, start, date(start.year, start.month + 1 if start.month < 12 else 1, 1), Booking.RentalType.FIXED_TERM)
        self.assertEqual(booking.base_price, Decimal("12000.00"))

    def test_six_month_house_term_uses_six_monthly_periods(self):
        start = date.today() + timedelta(days=1)
        end_month = start.month + 6
        end = date(start.year + (end_month - 1) // 12, (end_month - 1) % 12 + 1, start.day)
        booking = self.create(self.house, start, end, Booking.RentalType.FIXED_TERM)
        self.assertEqual(booking.base_price, Decimal("72000.00"))

    def test_financial_input_is_not_accepted_from_client(self):
        start = date.today() + timedelta(days=1)
        serializer = BookingCreateSerializer(
            data={"property": self.car.pk, "start_date": start, "end_date": start + timedelta(days=1), "total_amount": "1.00"},
            context={"request": self.request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        booking = serializer.save()
        self.assertEqual(booking.total_amount, Decimal("110.00"))

    def test_only_approved_successful_matching_payment_confirms_booking(self):
        start = date.today() + timedelta(days=1)
        booking = self.create(self.car, start, start + timedelta(days=1))
        payment = PaymentTransaction.objects.create(
            booking=booking,
            payer=self.renter,
            payment_method=PaymentTransaction.PaymentMethod.CASH,
            amount=booking.total_amount,
            currency=booking.currency,
            status=PaymentTransaction.PaymentStatus.PENDING,
        )
        # A PENDING booking is not yet approved, so payment cannot confirm it.
        payment.status = PaymentTransaction.PaymentStatus.SUCCESSFUL
        payment.save(update_fields=["status", "updated_at"])
        with self.assertRaises(ValueError):
            confirm_booking_from_payment(payment)
        # Owner approval moves the booking to APPROVED (awaiting payment).
        booking.status = Booking.BookingStatus.APPROVED
        booking.save(update_fields=["status", "updated_at"])
        confirm_booking_from_payment(payment)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.BookingStatus.CONFIRMED)

class BookingApiErrorFormatTests(TestCase):
    """Guarantee the EXACT error dicts the booking API returns to the frontend.

    These are the shapes the React frontend must parse and display verbatim.
    """

    def setUp(self):
        self.owner = User.objects.create_user("owner@example.com", password="x", role=User.Role.OWNER, first_name="Owner", last_name="One")
        self.renter = User.objects.create_user("renter@example.com", password="x", first_name="Renter", last_name="One")
        SiteSettings.objects.create(site_name="Test", house_commission_percent=Decimal("10.00"))
        self.car = self.make_property("Car", ListingType.CAR, RentalUnit.DAILY, Decimal("100.00"))
        self.house = self.make_property("House", ListingType.HOUSE, RentalUnit.MONTHLY, Decimal("12000.00"))
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

    def errors(self, data, user=None):
        serializer = BookingCreateSerializer(data=data, context={"request": SimpleNamespace(user=user or self.renter)})
        serializer.is_valid()
        return {k: [str(e) for e in v] for k, v in serializer.errors.items()}

    def test_missing_start_date(self):
        end_later = (date.today() + timedelta(days=5)).isoformat()
        self.assertEqual(
            self.errors({"property": self.house.pk, "end_date": end_later}),
            {"start_date": ["This field is required."]},
        )

    def test_fixed_term_end_before_start(self):
        start = (date.today() + timedelta(days=2)).isoformat()
        end_later = (date.today() + timedelta(days=5)).isoformat()
        self.assertEqual(
            self.errors({"property": self.house.pk, "start_date": end_later, "end_date": start, "rental_type": "fixed_term"}),
            {"end_date": ["Move-out date must be after move-in date."]},
        )

    def test_month_to_month_house_with_end_date(self):
        start = (date.today() + timedelta(days=2)).isoformat()
        end_later = (date.today() + timedelta(days=5)).isoformat()
        self.assertEqual(
            self.errors({"property": self.house.pk, "start_date": start, "end_date": end_later, "rental_type": "month_to_month"}),
            {"end_date": ["Move-out date must be empty for month-to-month rentals."]},
        )

    def test_month_to_month_rental_type_for_car(self):
        start = (date.today() + timedelta(days=2)).isoformat()
        end_later = (date.today() + timedelta(days=5)).isoformat()
        self.assertEqual(
            self.errors({"property": self.car.pk, "start_date": start, "end_date": end_later, "rental_type": "month_to_month"}),
            {"rental_type": ["Month-to-month rentals are not supported for vehicles."]},
        )

    def test_overlap_non_field_error(self):
        start = (date.today() + timedelta(days=2)).isoformat()
        end_later = (date.today() + timedelta(days=5)).isoformat()
        first = BookingCreateSerializer(data={"property": self.house.pk, "start_date": start, "end_date": end_later}, context={"request": self.request})
        self.assertTrue(first.is_valid(), first.errors)
        first.save()
        self.assertEqual(
            self.errors({"property": self.house.pk, "start_date": start, "end_date": end_later}),
            {"non_field_errors": ["This property is already booked for part or all of the selected period."]},
        )

    def test_book_own_listing(self):
        start = (date.today() + timedelta(days=2)).isoformat()
        end_later = (date.today() + timedelta(days=5)).isoformat()
        self.assertEqual(
            self.errors({"property": self.house.pk, "start_date": start, "end_date": end_later}, user=self.owner),
            {"property": ["You cannot book your own listing."]},
        )
