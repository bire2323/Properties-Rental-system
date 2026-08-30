from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid


class PaymentTransaction(models.Model):
    
    class PaymentMethod(models.TextChoices):
        TELEBIRR = "telebirr", "Telebirr"
        CHAPA = "chapa", "Chapa"
        CBE_BIRR = "cbe_birr", "CBE Birr"
        CASH = "cash", "Cash"
        OTHER = "other", "Other"

    class PaymentStatus(models.TextChoices):
        INITIATED = "initiated", "Initiated"
        PENDING = "pending", "Pending"
        SUCCESSFUL = "successful", "Successful"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"
        PARTIALLY_REFUNDED = "partially_refunded", "Partially Refunded"

    # Transaction reference
    transaction_reference = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        help_text="Unique transaction identifier."
    )

    # Core relationships
    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="payment_transactions",
        help_text="The booking this payment is for."
    )
    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payment_transactions_as_payer",
        help_text="The user making the payment."
    )

    # Payment method and provider reference
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        help_text="Payment method used."
    )
    provider_reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Reference from the external payment provider (e.g., transaction ID from Chapa)."
    )

    # Financial information
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Amount charged."
    )
    currency = models.CharField(
        max_length=3,
        help_text="Currency for this transaction."
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.INITIATED,
        help_text="Current payment status."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['booking', 'status']),
            models.Index(fields=['payer', 'status']),
            models.Index(fields=['status']),
        ]
        ordering = ['-created_at']
        verbose_name = 'Payment Transaction'
        verbose_name_plural = 'Payment Transactions'

    def save(self, *args, **kwargs):
        """Auto-generate transaction reference if not already set."""
        if not self.transaction_reference:
            self.transaction_reference = f"TXN-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.transaction_reference} - {self.amount} {self.currency} ({self.status})"


class Refund(models.Model):
    """
    Represents a refund for a payment transaction.
    Tracks refund status and allows partial refunds.
    """
    class RefundStatus(models.TextChoices):
        INITIATED = "initiated", "Initiated"
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    # Reference
    refund_reference = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        help_text="Unique refund identifier."
    )

    # Core relationship
    payment = models.ForeignKey(
        PaymentTransaction,
        on_delete=models.CASCADE,
        related_name="refunds",
        help_text="The payment transaction being refunded."
    )

    # Refund details
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Refund amount."
    )
    currency = models.CharField(
        max_length=3,
        help_text="Currency for this refund."
    )
    reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for the refund."
    )

    # Refund status
    status = models.CharField(
        max_length=20,
        choices=RefundStatus.choices,
        default=RefundStatus.INITIATED,
        help_text="Current refund status."
    )

    # External reference
    provider_refund_reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Reference from the external payment provider for the refund."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the refund was processed."
    )

    class Meta:
        indexes = [
            models.Index(fields=['payment', 'status']),
            models.Index(fields=['status']),
        ]
        ordering = ['-created_at']
        verbose_name = 'Refund'
        verbose_name_plural = 'Refunds'

    def save(self, *args, **kwargs):
        """Auto-generate refund reference if not already set."""
        if not self.refund_reference:
            self.refund_reference = f"RFD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.refund_reference} - {self.amount} {self.currency} ({self.status})"


class OwnerPayout(models.Model):
    """
    Represents money owed to property owners or companies.
    Connected to bookings, payouts must belong to exactly one recipient.
    """
    class PayoutStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    # Reference
    payout_reference = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        help_text="Unique payout identifier."
    )

    # Core relationship
    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="owner_payouts",
        help_text="The booking this payout is for."
    )

    # Recipient (must be exactly one)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owner_payouts_as_owner",
        help_text="Individual owner receiving the payout. NULL if company receives it."
    )
    company = models.ForeignKey(
        "properties.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owner_payouts_as_company",
        help_text="Company receiving the payout. NULL if individual owner receives it."
    )

    # Payout details
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Amount to be paid to the owner/company."
    )
    currency = models.CharField(
        max_length=3,
        help_text="Currency for the payout."
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=PayoutStatus.choices,
        default=PayoutStatus.PENDING,
        help_text="Current payout status."
    )

    # Payout tracking
    processed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the payout was processed."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(owner__isnull=False, company__isnull=True) |
                      models.Q(owner__isnull=True, company__isnull=False),
                name='payout_belongs_to_exactly_one_recipient'
            )
        ]
        indexes = [
            models.Index(fields=['booking']),
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['company', 'status']),
            models.Index(fields=['status']),
        ]
        ordering = ['-created_at']
        verbose_name = 'Owner Payout'
        verbose_name_plural = 'Owner Payouts'

    def save(self, *args, **kwargs):
        """Auto-generate payout reference if not already set."""
        if not self.payout_reference:
            self.payout_reference = f"OUT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        recipient = self.owner.email if self.owner else self.company.name
        return f"{self.payout_reference} - {self.amount} {self.currency} to {recipient} ({self.status})"

