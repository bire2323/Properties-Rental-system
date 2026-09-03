"""
Audit signals for payment lifecycle.

The payments app has no API views/services yet (payment initiation and
verification are not wired up), but PaymentTransaction / Refund / OwnerPayout
records can change through the Django admin or future services. These signals
guarantee that whenever a payment record's status changes, an AuditLog entry is
created — and for events important enough to require administrative attention,
an admin Notification is also created.

Duplicate prevention: status transitions are only logged when the status value
actually changes. Because the admin UI is the only current writer and it saves
the whole form (not just the status field), we guard on the status field
changing to avoid repeated logs on unrelated saves.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from audit.models import AuditLog
from audit.services import audit_event
from accounts.models import Notification

from .models import PaymentTransaction, Refund, OwnerPayout


def _admin_notification(title, details, info, sender=None, sender_email=""):
    Notification.objects.create(
        type=Notification.NotificationType.PAYMENT,
        status=Notification.NotificationStatus.NEW,
        title=title,
        details=details,
        info=info,
        sender=sender,
        sender_email=sender_email or (sender.email if sender else ""),
        sender_name=(sender.get_full_name().strip() or sender.email) if sender else "System",
    )


@receiver(pre_save, sender=PaymentTransaction)
def capture_payment_previous_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._previous_status = PaymentTransaction.objects.filter(
                pk=instance.pk
            ).values_list("status", flat=True).first()
        except PaymentTransaction.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


@receiver(post_save, sender=PaymentTransaction)
def audit_payment_transaction(sender, instance, created, **kwargs):
    previous_status = getattr(instance, "_previous_status", None)

    # Only log if this is a create or a genuine status change
    if created:
        action = "PAYMENT_INITIATED"
        severity = AuditLog.Severity.INFO
        result = AuditLog.Result.SUCCESS
        description = f"Payment transaction {instance.transaction_reference} initiated for booking {instance.booking.booking_reference}."
    elif previous_status is not None and previous_status != instance.status:
        if instance.status == PaymentTransaction.PaymentStatus.SUCCESSFUL:
            action = "PAYMENT_SUCCESS"
            severity = AuditLog.Severity.INFO
            result = AuditLog.Result.SUCCESS
            description = f"Payment {instance.transaction_reference} completed successfully."
        elif instance.status == PaymentTransaction.PaymentStatus.FAILED:
            action = "PAYMENT_FAILED"
            severity = AuditLog.Severity.ERROR
            result = AuditLog.Result.FAILED
            description = f"Payment {instance.transaction_reference} failed."
            _admin_notification(
                "Payment failed",
                f"Payment {instance.transaction_reference} for {instance.booking.booking_reference} failed. An administrator should investigate.",
                "Payment alert",
                sender=instance.payer,
                sender_email=instance.payer.email,
            )
        elif instance.status in (
            PaymentTransaction.PaymentStatus.REFUNDED,
            PaymentTransaction.PaymentStatus.PARTIALLY_REFUNDED,
        ):
            action = "PAYMENT_REFUNDED"
            severity = AuditLog.Severity.INFO
            result = AuditLog.Result.SUCCESS
            description = f"Payment {instance.transaction_reference} refund status: {instance.status}."
        else:
            # Pending / cancelled / other
            action = "PAYMENT_STATUS_CHANGED"
            severity = AuditLog.Severity.INFO
            result = AuditLog.Result.SUCCESS
            description = f"Payment {instance.transaction_reference} status changed to {instance.status}."
    else:
        # No meaningful change (e.g. admin saving the same status)
        return

    audit_event(
        actor=instance.payer,
        action=action,
        category=AuditLog.Category.PAYMENT,
        severity=severity,
        result=result,
        target_type="payment",
        target_id=instance.pk,
        target_display=instance.transaction_reference,
        description=description,
        previous_state={"payment_status": previous_status} if previous_status else {},
        new_state={"payment_status": instance.status},
        metadata={
            "transaction_reference": instance.transaction_reference,
            "booking_reference": instance.booking.booking_reference,
            "payment_method": instance.payment_method,
            "amount": str(instance.amount),
            "currency": instance.currency,
        },
    )


@receiver(pre_save, sender=Refund)
def capture_refund_previous_status(sender, instance, **kwargs):
    if instance.pk:
        instance._previous_refund_status = Refund.objects.filter(
            pk=instance.pk
        ).values_list("status", flat=True).first()
    else:
        instance._previous_refund_status = None


@receiver(post_save, sender=Refund)
def audit_refund(sender, instance, created, **kwargs):
    previous_status = getattr(instance, "_previous_refund_status", None)

    if created:
        action = "REFUND_REQUESTED"
        severity = AuditLog.Severity.INFO
        result = AuditLog.Result.SUCCESS
        description = f"Refund {instance.refund_reference} requested for payment {instance.payment.transaction_reference}."
    elif previous_status is not None and previous_status != instance.status:
        if instance.status == Refund.RefundStatus.COMPLETED:
            action = "REFUND_COMPLETED"
            severity = AuditLog.Severity.INFO
            result = AuditLog.Result.SUCCESS
            description = f"Refund {instance.refund_reference} completed."
        elif instance.status == Refund.RefundStatus.FAILED:
            action = "REFUND_FAILED"
            severity = AuditLog.Severity.ERROR
            result = AuditLog.Result.FAILED
            description = f"Refund {instance.refund_reference} failed."
            _admin_notification(
                "Refund failed",
                f"Refund {instance.refund_reference} for payment {instance.payment.transaction_reference} failed.",
                "Refund alert",
            )
        else:
            action = "REFUND_STATUS_CHANGED"
            severity = AuditLog.Severity.INFO
            result = AuditLog.Result.SUCCESS
            description = f"Refund {instance.refund_reference} status changed to {instance.status}."
    else:
        return

    payer = instance.payment.payer if instance.payment else None
    audit_event(
        actor=payer,
        action=action,
        category=AuditLog.Category.PAYMENT,
        severity=severity,
        result=result,
        target_type="refund",
        target_id=instance.pk,
        target_display=instance.refund_reference,
        description=description,
        previous_state={"refund_status": previous_status} if previous_status else {},
        new_state={"refund_status": instance.status},
        metadata={
            "refund_reference": instance.refund_reference,
            "transaction_reference": getattr(instance.payment, "transaction_reference", ""),
            "amount": str(instance.amount),
            "currency": instance.currency,
        },
    )


@receiver(pre_save, sender=OwnerPayout)
def capture_payout_previous_status(sender, instance, **kwargs):
    if instance.pk:
        instance._previous_payout_status = OwnerPayout.objects.filter(
            pk=instance.pk
        ).values_list("status", flat=True).first()
    else:
        instance._previous_payout_status = None


@receiver(post_save, sender=OwnerPayout)
def audit_owner_payout(sender, instance, created, **kwargs):
    previous_status = getattr(instance, "_previous_payout_status", None)

    if created:
        action = "OWNER_PAYOUT_CREATED"
        severity = AuditLog.Severity.INFO
        result = AuditLog.Result.SUCCESS
        description = f"Owner payout {instance.payout_reference} created for booking {instance.booking.booking_reference}."
    elif previous_status is not None and previous_status != instance.status:
        if instance.status == OwnerPayout.PayoutStatus.PAID:
            action = "OWNER_PAYOUT_COMPLETED"
            severity = AuditLog.Severity.INFO
            result = AuditLog.Result.SUCCESS
            description = f"Owner payout {instance.payout_reference} completed."
        elif instance.status == OwnerPayout.PayoutStatus.FAILED:
            action = "OWNER_PAYOUT_FAILED"
            severity = AuditLog.Severity.ERROR
            result = AuditLog.Result.FAILED
            description = f"Owner payout {instance.payout_reference} failed."
            _admin_notification(
                "Owner payout failed",
                f"Owner payout {instance.payout_reference} failed. An administrator should investigate.",
                "Payout alert",
            )
        else:
            action = "OWNER_PAYOUT_STATUS_CHANGED"
            severity = AuditLog.Severity.INFO
            result = AuditLog.Result.SUCCESS
            description = f"Owner payout {instance.payout_reference} status changed to {instance.status}."
    else:
        return

    audit_event(
        actor=None,
        action=action,
        category=AuditLog.Category.PAYMENT,
        severity=severity,
        result=result,
        target_type="payout",
        target_id=instance.pk,
        target_display=instance.payout_reference,
        description=description,
        previous_state={"payout_status": previous_status} if previous_status else {},
        new_state={"payout_status": instance.status},
        metadata={
            "payout_reference": instance.payout_reference,
            "booking_reference": instance.booking.booking_reference,
            "amount": str(instance.amount),
            "currency": instance.currency,
        },
    )
