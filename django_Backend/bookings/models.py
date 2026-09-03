from decimal import Decimal
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F, Q


class Booking(models.Model):
    """A renter's rental agreement and its financial snapshot."""

    class BookingStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        CONFIRMED = "confirmed", "Confirmed"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"
        EXPIRED = "expired", "Expired"

    class RentalType(models.TextChoices):
        FIXED_TERM = "fixed_term", "Fixed Term"
        MONTH_TO_MONTH = "month_to_month", "Month to Month"

    # APPROVED blocks the calendar like PENDING/CONFIRMED: the dates are
    # reserved while the owner has approved and the booking awaits payment.
    BLOCKING_STATUSES = (BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.CONFIRMED)
    ACTIVE_CALENDAR_STATUSES = set(BLOCKING_STATUSES)

    booking_reference = models.CharField(max_length=20, unique=True, editable=False)
    property = models.ForeignKey("properties.Property", on_delete=models.CASCADE, related_name="bookings")
    renter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings_as_renter")
    rental_type = models.CharField(max_length=20, choices=RentalType.choices, default=RentalType.FIXED_TERM)
    start_date = models.DateField(help_text="Move-in or pickup date.")
    end_date = models.DateField(null=True, blank=True, help_text="Move-out or return date; NULL for month-to-month houses.")

    base_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    currency = models.CharField(max_length=3)
    platform_commission_rate = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("100.00"))])
    platform_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(Decimal("0.00"))])
    owner_payout_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])

    recipient_owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings_as_recipient")
    recipient_company = models.ForeignKey("properties.Company", on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings_as_recipient")
    status = models.CharField(max_length=20, choices=BookingStatus.choices, default=BookingStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=(Q(rental_type="fixed_term", end_date__gt=F("start_date")) | Q(rental_type="month_to_month", end_date__isnull=True)),
                name="booking_date_rules_by_rental_type",
            ),
            models.CheckConstraint(
                check=(Q(recipient_owner__isnull=False, recipient_company__isnull=True) | Q(recipient_owner__isnull=True, recipient_company__isnull=False)),
                name="booking_belongs_to_exactly_one_recipient",
            ),
        ]
        indexes = [
            models.Index(fields=["renter", "status"]),
            models.Index(fields=["property", "status"]),
            models.Index(fields=["start_date", "end_date"]),
            models.Index(fields=["property", "status", "start_date"]),
        ]
        ordering = ["-created_at"]

    def clean(self):
        super().clean()
        errors = {}
        listing_type = self.property.listing_type if self.property_id else None
        if not self.start_date:
            errors["start_date"] = "A start date is required."
        if self.rental_type not in self.RentalType.values:
            errors["rental_type"] = "Choose fixed_term or month_to_month."
        elif self.rental_type == self.RentalType.MONTH_TO_MONTH:
            if listing_type != "house":
                errors["rental_type"] = "Only houses can be month-to-month."
            if self.end_date is not None:
                errors["end_date"] = "Month-to-month rentals must not have an end date."
        else:
            if not self.end_date:
                errors["end_date"] = "An end date is required for fixed-term rentals."
            elif self.start_date and self.end_date <= self.start_date:
                errors["end_date"] = "The end date must be after the start date."
        if listing_type == "car" and self.rental_type != self.RentalType.FIXED_TERM:
            errors["rental_type"] = "Vehicle bookings must use fixed_term rental type."
        if errors:
            raise ValidationError(errors)

    @classmethod
    def blocking_for_property(cls, property_obj):
        return cls.objects.filter(property=property_obj, status__in=cls.BLOCKING_STATUSES)

    @classmethod
    def has_conflict(cls, property_obj, start_date, end_date):
        """Check half-open intervals; NULL end dates extend indefinitely."""
        queryset = cls.blocking_for_property(property_obj)
        if end_date is None:
            return queryset.filter(Q(end_date__isnull=True) | Q(end_date__gt=start_date)).exists()
        return queryset.filter(Q(start_date__lt=end_date), Q(end_date__isnull=True) | Q(end_date__gt=start_date)).exists()

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            self.booking_reference = f"BK-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_reference} - {self.property.property_name} ({self.status})"


class BookingAuditEvent(models.Model):
    """
    Immutable audit trail for booking lifecycle events.

    This is the backend source-of-truth log for:
    - renter creation
    - owner/admin approvals/rejections/cancellations
    - system confirmations from verified payments
    - admin exceptional actions (cancel/expire/complete)
    - admin viewing a booking (optional but useful for investigations)
    """

    class Action(models.TextChoices):
        CREATED = "created", "Created"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"
        CONFIRMED_FROM_PAYMENT = "confirmed_from_payment", "Confirmed from payment"
        EXPIRED = "expired", "Expired"
        COMPLETED = "completed", "Completed"
        ADMIN_VIEWED = "admin_viewed", "Admin viewed"

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="audit_events",
    )
    booking_reference = models.CharField(max_length=20, db_index=True)

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="booking_audit_events",
        help_text="NULL indicates a system event.",
    )
    actor_role = models.CharField(max_length=20, blank=True, default="", help_text="Snapshot of actor role at time of event.")

    action = models.CharField(max_length=50, choices=Action.choices)
    previous_status = models.CharField(max_length=20, blank=True, default="")
    new_status = models.CharField(max_length=20, blank=True, default="")
    reason = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(fields=["booking", "created_at"]),
            models.Index(fields=["booking_reference", "created_at"]),
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["actor", "created_at"]),
        ]

    def __str__(self):
        return f"{self.booking_reference} {self.action} ({self.previous_status}->{self.new_status})"
