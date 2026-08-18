from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid


class Booking(models.Model):
    """
    Represents a booking from a tenant for a property.
    Stores financial information as a snapshot at the time of booking.
    """
    class BookingStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"
        EXPIRED = "expired", "Expired"

    # Unique booking reference
    booking_reference = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text="Auto-generated booking reference (e.g., BK-XXXXXXXX)."
    )

    # Core booking relationships
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="bookings",
        help_text="The property being booked."
    )
    renter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings_as_renter",
        help_text="The tenant/renter."
    )

    # Booking dates
    start_date = models.DateField(
        help_text="Check-in date."
    )
    end_date = models.DateField(
        help_text="Check-out date."
    )

    # Financial snapshot fields
    base_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Rental cost before deposit and fees."
    )
    security_deposit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Security deposit amount."
    )
    currency = models.CharField(
        max_length=3,
        help_text="Currency used for all financial amounts in this booking."
    )
    platform_commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text="Platform commission rate at the time of booking (as percentage)."
    )
    platform_fee_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        help_text="Total platform fee charged to the renter."
    )
    owner_payout_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Amount the property owner/company will receive."
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Total amount the renter is expected to pay (base + deposit + platform_fee)."
    )

    # Recipient snapshot (who receives the payout)
    # Either the individual owner or the company (if property belongs to company)
    recipient_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bookings_as_recipient",
        help_text="Individual owner receiving payout (if property is individually owned)."
    )
    recipient_company = models.ForeignKey(
        "properties.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bookings_as_recipient",
        help_text="Company receiving payout (if property belongs to a company)."
    )

    # Booking status
    status = models.CharField(
        max_length=20,
        choices=BookingStatus.choices,
        default=BookingStatus.PENDING,
        help_text="Current booking status."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F('start_date')),
                name='booking_end_after_start'
            ),
            models.CheckConstraint(
                check=models.Q(recipient_owner__isnull=False, recipient_company__isnull=True) |
                      models.Q(recipient_owner__isnull=True, recipient_company__isnull=False),
                name='booking_belongs_to_exactly_one_recipient'
            )
        ]
        indexes = [
            models.Index(fields=['renter', 'status']),
            models.Index(fields=['property', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]
        ordering = ['-created_at']
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'

    def save(self, *args, **kwargs):
        """Auto-generate booking reference if not already set."""
        if not self.booking_reference:
            self.booking_reference = f"BK-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_reference} - {self.property.property_name} ({self.status})"

