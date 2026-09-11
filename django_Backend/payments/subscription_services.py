import logging
import urllib.parse
from django.db import transaction as db_transaction
from django.utils import timezone
from audit.models import AuditLog
from audit.services import audit_event
from properties.models import Subscription, SubscriptionPlan
from payments.models import SubscriptionPayment
from payments.services import chapa_initialize, chapa_verify, has_chapa_configured, ChapaError

logger = logging.getLogger(__name__)

def _with_tx_ref(url, ref):
    """Append the internal transaction reference to a URL for the Chapa round-trip.

    Chapa redirects the user back to the exact ``return_url`` we provide, so the
    subscription result page must receive the reference as a query parameter here.
    """
    sep = '&' if urllib.parse.urlsplit(url).query else '?'
    return f"{url}{sep}tx_ref={urllib.parse.quote(str(ref))}"

def create_subscription_payment(subscription, payer, callback_url, return_url):
    """
    Creates a new SubscriptionPayment and initializes Chapa checkout.
    """
    if not has_chapa_configured():
        raise ChapaError("Chapa is not configured.")

    payment = SubscriptionPayment.objects.create(
        subscription=subscription,
        payer=payer,
        payment_method=SubscriptionPayment.PaymentMethod.CHAPA,
        amount=subscription.plan.price,
        currency=subscription.plan.currency,
        status=SubscriptionPayment.PaymentStatus.INITIATED,
    )

    try:
        chapa_response = chapa_initialize(
            tx_ref=payment.transaction_reference,
            amount=payment.amount,
            currency=payment.currency,
            email=payer.email,
            first_name=payer.first_name,
            last_name=payer.last_name,
            callback_url=callback_url,
            return_url=_with_tx_ref(return_url, payment.transaction_reference),
        )
        # tx_ref is the reference we passed to Chapa (the round-trip key).
        payment.tx_ref = payment.transaction_reference
        # Chapa's own reference from the initialize response.
        payment.provider_reference = chapa_response["reference"]
        payment.save(update_fields=["tx_ref", "provider_reference"])
        return payment, chapa_response["checkout_url"]
    except Exception as e:
        payment.status = SubscriptionPayment.PaymentStatus.FAILED
        payment.save(update_fields=["status"])
        raise e

@db_transaction.atomic
def verify_and_activate_subscription(payment):
    """
    Verifies the payment with Chapa and activates the subscription idempotently.
    """
    if payment.status == SubscriptionPayment.PaymentStatus.SUCCESSFUL:
        return payment.subscription

    if not has_chapa_configured():
        raise ChapaError("Chapa is not configured.")

    try:
        verified = chapa_verify(payment.tx_ref or payment.transaction_reference)
    except ChapaError as e:
        # If verification fails completely (network error), don't fail the payment yet
        logger.error(f"Chapa verification failed for {payment.transaction_reference}: {e}")
        return None

    status = str(verified.get("status", "")).lower()
    
    if status == "success":
        payment.status = SubscriptionPayment.PaymentStatus.SUCCESSFUL
        payment.provider_reference = verified.get("reference")
        payment.save(update_fields=["status", "provider_reference", "updated_at"])

        subscription = payment.subscription
        plan = subscription.plan

        # Snapshot the exact purchased terms so later plan edits (price, limits,
        # discount) never retroactively change this already-paid period.
        subscription.purchased_name = plan.name if plan else (subscription.purchased_name or "")
        subscription.purchased_price = payment.amount
        subscription.purchased_currency = payment.currency
        subscription.purchased_billing_cycle = plan.billing_cycle if plan else (subscription.purchased_billing_cycle or SubscriptionPlan.BillingCycle.MONTHLY)
        subscription.purchased_max_listings = plan.max_listings if plan else subscription.purchased_max_listings
        subscription.purchased_featured_listing_limit = plan.featured_listing_limit if plan else subscription.purchased_featured_listing_limit
        subscription.purchased_commission_rate_discount = plan.commission_rate_discount if plan else subscription.purchased_commission_rate_discount

        # Activate subscription logic
        now = timezone.now()
        subscription.status = Subscription.SubscriptionStatus.ACTIVE
        subscription.current_period_start = now
        
        # Calculate current_period_end based on billing_cycle
        from datetime import timedelta
        if (plan and plan.billing_cycle == SubscriptionPlan.BillingCycle.YEARLY) or subscription.purchased_billing_cycle == SubscriptionPlan.BillingCycle.YEARLY:
            subscription.current_period_end = now + timedelta(days=365)
        else:
            subscription.current_period_end = now + timedelta(days=30)
            
        subscription.cancel_at_period_end = False
        subscription.save(update_fields=[
            "purchased_name",
            "purchased_price",
            "purchased_currency",
            "purchased_billing_cycle",
            "purchased_max_listings",
            "purchased_featured_listing_limit",
            "purchased_commission_rate_discount",
            "status",
            "current_period_start",
            "current_period_end",
            "cancel_at_period_end",
            "updated_at",
        ])

        audit_event(
            actor=payment.payer,
            action="SUBSCRIPTION_ACTIVATED",
            category=AuditLog.Category.PAYMENT,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="subscription",
            target_id=subscription.pk,
            target_display=f"Subscription to {plan.name if plan else subscription.purchased_name}",
            description=f"Subscription {subscription.pk} activated via payment {payment.transaction_reference}",
            previous_state={},
            new_state={
                "status": "ACTIVE",
                "amount": str(payment.amount),
                "currency": payment.currency,
            },
            metadata={"payment_ref": payment.transaction_reference}
        )
        return subscription
        
    elif status in ["failed", "abandoned", "cancelled"]:
        payment.status = SubscriptionPayment.PaymentStatus.FAILED
        payment.save(update_fields=["status", "updated_at"])
        return None
        
    return None
