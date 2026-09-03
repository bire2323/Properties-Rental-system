"""
Booking business logic: pricing, overlap detection, and financial snapshots.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from math import ceil

from django.db import transaction
from django.db.models import Q

from properties.models import ListingType, ListingStatus, RentalUnit, Property
from site_settings.models import SiteSettings

from .models import Booking

# Open-ended bookings are compared against this upper bound for overlap checks.
OPEN_ENDED_MAX_DATE = date(9999, 12, 31)


def _calendar_months(start_date: date, end_date: date) -> int:
    months = (end_date.year - start_date.year) * 12 + end_date.month - start_date.month
    if end_date.day > start_date.day:
        months += 1
    return max(1, months)


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def get_platform_commission_rate(listing_type: str) -> Decimal:
    settings = SiteSettings.objects.order_by("pk").first()
    if listing_type == ListingType.HOUSE:
      if settings and settings.house_commission_percent is not None:
        return Decimal(settings.house_commission_percent)
    elif listing_type == ListingType.CAR:
        if settings and settings.car_vehicle_commission_percent is not None:
            return Decimal(settings.car_vehicle_commission_percent)
    return Decimal("5.00")


def calculate_rental_units(start_date: date, end_date: date | None, rental_unit: str) -> int:
    """
    Convert a date range into billable units based on the property's advertised rental_unit.
    For month-to-month bookings without an end date, charge one billing unit upfront.
    """
    if end_date is None:
        return 1

    days = (end_date - start_date).days
    if days <= 0:
        return 0

    if rental_unit == RentalUnit.HOURLY:
        return max(1, days * 24)
    if rental_unit == RentalUnit.DAILY:
        return days
    if rental_unit == RentalUnit.WEEKLY:
        return max(1, ceil(days / 7))
    if rental_unit == RentalUnit.MONTHLY:
        return _calendar_months(start_date, end_date)
    if rental_unit == RentalUnit.YEARLY:
        return max(1, ceil(_calendar_months(start_date, end_date) / 12))
    return max(1, days)


def calculate_base_price(
    property_obj,
    start_date: date,
    end_date: date | None,
    rental_type: str,
) -> Decimal:
    unit_price = Decimal(property_obj.price)
    if rental_type == Booking.RentalType.MONTH_TO_MONTH:
        units = 1
    else:
        units = calculate_rental_units(start_date, end_date, property_obj.rental_unit)

    if units <= 0:
        return Decimal("0.00")
    return _quantize(unit_price * Decimal(units))


def calculate_financial_snapshot(property_obj, start_date, end_date, rental_type):
    """
    Compute immutable booking financial fields from the property snapshot.
    Renter pays: base_price + security_deposit + platform_fee_amount
    Owner receives: owner_payout_amount (= base_price - platform_fee on base)
    """
    base_price = calculate_base_price(property_obj, start_date, end_date, rental_type)
    security_deposit = Decimal(property_obj.security_deposit or 0)
    commission_rate = get_platform_commission_rate(property_obj.listing_type)
    platform_fee_amount = _quantize(base_price * commission_rate / Decimal("100"))
    owner_payout_amount = _quantize(base_price - platform_fee_amount)
    total_amount = _quantize(base_price + security_deposit)

    return {
        "base_price": base_price,
        "security_deposit": _quantize(security_deposit),
        "currency": property_obj.currency,
        "platform_commission_rate": commission_rate,
        "platform_fee_amount": platform_fee_amount,
        "owner_payout_amount": owner_payout_amount,
        "total_amount": total_amount,
    }


def resolve_recipient(property_obj):
    """Return kwargs for recipient_owner / recipient_company snapshot fields."""
    if property_obj.company_id:
        return {
            "recipient_company": property_obj.company,
            "recipient_owner": None,
        }
    return {
        "recipient_owner": property_obj.owner,
        "recipient_company": None,
    }


def validate_property_bookable(property_obj):
    errors = {}
    if property_obj.status != ListingStatus.ACTIVE:
        errors["property"] = "This listing is not active and cannot be booked."
    if not property_obj.is_available:
        errors["property"] = "This listing is currently unavailable."
    return errors


def resolve_rental_type(property_obj, requested_rental_type: str | None) -> str:
    """
    Determine rental_type from property listing_type.
    Cars are always fixed_term; houses accept client choice.
    """
    if property_obj.listing_type == ListingType.CAR:
        if requested_rental_type == Booking.RentalType.MONTH_TO_MONTH:
            raise ValueError("Month-to-month rentals are not supported for vehicles.")
        return Booking.RentalType.FIXED_TERM

    if not requested_rental_type:
        return Booking.RentalType.FIXED_TERM

    valid = {choice.value for choice in Booking.RentalType}
    if requested_rental_type not in valid:
        raise ValueError(f"Invalid rental_type '{requested_rental_type}'.")

    if requested_rental_type == Booking.RentalType.MONTH_TO_MONTH:
        if property_obj.listing_type != ListingType.HOUSE:
            raise ValueError("Month-to-month rentals are only supported for houses.")

    return requested_rental_type


def validate_booking_dates(
    property_obj,
    rental_type: str,
    start_date: date,
    end_date: date | None,
):
    """Return dict of field errors for date/rental_type rules."""
    errors = {}

    if not start_date:
        errors["start_date"] = "Start date is required."

    if property_obj.listing_type == ListingType.CAR:
        if rental_type != Booking.RentalType.FIXED_TERM:
            errors["rental_type"] = "Vehicle bookings must use fixed_term rental type."
        if not end_date:
            errors["end_date"] = "Return date is required for vehicle bookings."
        elif end_date <= start_date:
            errors["end_date"] = "Return date must be after pickup date."
        return errors

    # House rules
    if rental_type == Booking.RentalType.FIXED_TERM:
        if not end_date:
            errors["end_date"] = "Move-out date is required for fixed-term house rentals."
        elif end_date <= start_date:
            errors["end_date"] = "Move-out date must be after move-in date."
    elif rental_type == Booking.RentalType.MONTH_TO_MONTH:
        if end_date is not None:
            errors["end_date"] = "Move-out date must be empty for month-to-month rentals."
    else:
        errors["rental_type"] = "Invalid rental type for house bookings."

    return errors


def get_overlapping_bookings(property_id, start_date, end_date, exclude_booking_id=None):
    """
    Return bookings that conflict with the requested period.

    Overlap rule (inclusive dates; NULL end_date = ongoing):
      start_a <= effective_end_b AND start_b <= effective_end_a
    """
    effective_end = end_date or OPEN_ENDED_MAX_DATE

    queryset = Booking.objects.filter(
        property_id=property_id,
        status__in=Booking.ACTIVE_CALENDAR_STATUSES,
        start_date__lte=effective_end,
    ).filter(
        Q(end_date__isnull=True) | Q(end_date__gt=start_date)
    )

    if exclude_booking_id:
        queryset = queryset.exclude(pk=exclude_booking_id)

    return queryset


def validate_no_overlap(property_id, start_date, end_date, exclude_booking_id=None):
    overlapping = get_overlapping_bookings(
        property_id,
        start_date,
        end_date,
        exclude_booking_id=exclude_booking_id,
    )
    if overlapping.exists():
        return {
            "non_field_errors": [
                "This property is already booked for part or all of the selected period."
            ]
        }
    return {}


def confirm_booking_from_payment(payment_transaction):
    """Confirm an approved booking after a successful verified payment.

    Only APPROVED bookings (owner approved, awaiting payment) can be moved to
    CONFIRMED by a verified payment. PENDING bookings must first be approved by
    the owner/manager before payment can unlock CONFIRMED.
    """
    from payments.models import PaymentTransaction

    if payment_transaction.status != PaymentTransaction.PaymentStatus.SUCCESSFUL:
        raise ValueError("Only successful payments can confirm a booking.")

    booking = payment_transaction.booking
    if payment_transaction.payer_id != booking.renter_id:
        raise ValueError("Payment payer does not match the booking renter.")
    if payment_transaction.currency != booking.currency:
        raise ValueError("Payment currency does not match the booking currency.")
    if payment_transaction.amount != booking.total_amount:
        raise ValueError("Payment amount does not match the booking total.")
    if booking.status != Booking.BookingStatus.APPROVED:
        raise ValueError("Only approved bookings awaiting payment can be confirmed.")

    booking.status = Booking.BookingStatus.CONFIRMED
    booking.save(update_fields=["status", "updated_at"])
    return booking


def create_booking(*, renter, property_id, rental_type, start_date, end_date):
    """Create a booking while serializing availability against concurrent requests."""
    with transaction.atomic():
        property_obj = (
            Property.objects.select_for_update()
            .get(pk=property_id)
        )
        bookable_errors = validate_property_bookable(property_obj)
        if bookable_errors:
            raise ValueError(next(iter(bookable_errors.values())))
        if property_obj.owner_id == renter.pk:
            raise ValueError("You cannot book your own listing.")
        overlap_errors = validate_no_overlap(property_id, start_date, end_date)
        if overlap_errors:
            raise ValueError(overlap_errors["non_field_errors"][0])

        financials = calculate_financial_snapshot(
            property_obj, start_date, end_date, rental_type
        )
        booking = Booking(
            property=property_obj,
            renter=renter,
            rental_type=rental_type,
            start_date=start_date,
            end_date=end_date,
            status=Booking.BookingStatus.PENDING,
            **financials,
            **resolve_recipient(property_obj),
        )
        booking.full_clean()
        booking.save()
        return booking
