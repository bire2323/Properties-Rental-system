"""Chapa payment gateway services.

Server-side Chapa integration. The ONLY authoritative source of truth for a
payment is a successful Chapa verification request (``/transaction/verify``)
made by THIS backend. Chapa redirects, the provider callback, the webhook, and
the frontend's own "success" display are all treated as untrusted until the
backend verifies the transaction and confirms the booking.
"""
import logging
import uuid
from decimal import Decimal

from django.conf import settings
from django.db import transaction as db_transaction

from audit.models import AuditLog
from audit.services import audit_event

from .models import PaymentTransaction

logger = logging.getLogger(__name__)

__all__ = [
    "ChapaError",
    "has_chapa_configured",
    "chapa_initialize",
    "chapa_verify",
    "create_payment_transaction",
    "verify_and_confirm",
]


class ChapaError(Exception):
    """Raised when Chapa returns an error or the gateway is unreachable."""


def _chapa_headers():
    if not settings.CHAPA_SECRET_KEY:
        raise ChapaError("CHAPA_SECRET_KEY is not configured.")
    return {
        "Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def has_chapa_configured():
    return bool(settings.CHAPA_SECRET_KEY)


def chapa_initialize(*, tx_ref, amount, currency, email, first_name, last_name, callback_url, return_url):
    """Call Chapa /transaction/initialize and return the checkout URL.

    Raises ChapaError on network/HTTP/API errors. Never throws protected
    (secret) data into the error message.
    """
    import requests

    payload = {
        "amount": str(amount),
        "currency": currency,
        "email": email,
        "first_name": first_name or "",
        "last_name": last_name or "",
        "tx_ref": tx_ref,
        "callback_url": callback_url,
        "return_url": return_url,
        "customization": {
            # Chapa limits customization.title to 16 characters.
            "title": "Property Rental",
        },
    }
    try:
        response = requests.post(
            f"{settings.CHAPA_API_BASE}/transaction/initialize",
            json=payload,
            headers=_chapa_headers(),
            timeout=30,
        )
    except requests.RequestException as exc:
        raise ChapaError("Could not reach the Chapa gateway.") from exc

    if response.status_code >= 400:
        detail = ""
        try:
            detail = response.json().get("message") or response.json().get("error") or str(response.json())
        except Exception:
            detail = ""
        suffix = f": {detail}" if detail else ""
        raise ChapaError(f"Chapa initialization failed (HTTP {response.status_code}){suffix}")

    try:
        body = response.json()
    except ValueError as exc:
        raise ChapaError("Chapa returned an unreadable response.") from exc

    data = body.get("data") or {}
    checkout_url = data.get("checkout_url")
    if not checkout_url:
        raise ChapaError("Chapa did not return a checkout URL.")

    return {
        "checkout_url": checkout_url,
        "reference": body.get("data", {}).get("reference") or body.get("reference"),
    }


def chapa_verify(tx_ref):
    """Verify a transaction with Chapa.

    Returns a dict with ``status`` ("success"/"failed"/...), ``amount``,
    ``currency`` and ``reference`` (Chapa's provider transaction id) as
    reported by Chapa. Raises ChapaError on transport/HTTP/parse errors.
    """
    import requests

    try:
        response = requests.get(
            f"{settings.CHAPA_API_BASE}/transaction/verify/{tx_ref}",
            headers=_chapa_headers(),
            timeout=30,
        )
    except requests.RequestException as exc:
        raise ChapaError("Could not reach the Chapa gateway.") from exc

    if response.status_code >= 400:
        raise ChapaError(f"Chapa verification failed (HTTP {response.status_code}).")

    try:
        body = response.json()
    except ValueError as exc:
        raise ChapaError("Chapa returned an unreadable response.") from exc

    data = body.get("data") or {}
    status = data.get("status")
    # Negative verification: Chapa advertises the tx_ref but reports it as
    # failed/incomplete -- that is a well-formed response, not an error.
    if not status:
        raise ChapaError("Chapa verification response did not include a status.")

    return {
        "status": status,
        "amount": data.get("amount"),
        "currency": data.get("currency"),
        "reference": data.get("reference") or data.get("tx_ref"),
        "mode": data.get("mode"),
    }


def _generate_tx_ref():
    return f"CHAPA-{uuid.uuid4().hex[:12].upper()}"


def _expected_chapa_mode():
    """Infer the expected Chapa transaction mode from the configured secret key.

    Test keys start with ``CHASECK_TEST-`` and live keys with ``CHASECK-``.
    Chapa's verify response includes ``mode`` ("test"/"live"); we compare the
    reported mode against this expectation when Chapa supplies it. Never logs
    or exposes the key itself.
    """
    key = getattr(settings, "CHAPA_SECRET_KEY", "") or ""
    if key.startswith("CHASECK_TEST-"):
        return "test"
    return "live"


def create_payment_transaction(*, booking, payer, payment_method=PaymentTransaction.PaymentMethod.CHAPA):
    """Create a local PaymentTransaction for a new payment attempt.

    Each call creates a fresh attempt (its own tx_ref), so failed attempts do
    NOT overwrite earlier history. Only APPROVED bookings awaiting payment can
    be paid.
    """
    if booking.status != booking.BookingStatus.APPROVED:
        raise ValueError("Payment is only available once the owner approves the booking.")
    if payer.pk != booking.renter_id:
        raise ValueError("Only the booking renter can pay.")

    payment = PaymentTransaction(
        booking=booking,
        payer=payer,
        payment_method=payment_method,
        amount=booking.total_amount,
        currency=booking.currency,
        tx_ref=_generate_tx_ref(),
        status=PaymentTransaction.PaymentStatus.INITIATED,
    )
    payment.save()
    return payment


@db_transaction.atomic
def _mark_status_and_confirm(payment, verified):
    """Set payment SUCCESSFUL and confirm the booking, idempotently.

    Must run inside the caller's atomic block so that a single confirmation
    (booking CONFIRMED, one confirmation email, one audit trail) results even
    if both the callback/webhook and the polled verify arrive.
    """
    if (
        payment.status == PaymentTransaction.PaymentStatus.SUCCESSFUL
        and payment.booking.status == payment.booking.BookingStatus.CONFIRMED
    ):
        return payment.booking

    payment.status = PaymentTransaction.PaymentStatus.SUCCESSFUL
    payment.provider_reference = verified.get("reference") or payment.provider_reference
    payment.save(update_fields=["status", "provider_reference", "updated_at"])

    from bookings.services import confirm_booking_from_payment

    return confirm_booking_from_payment(payment)


def _record_mismatch(payment, expected_amount, expected_currency, reported):
    """Audit an amount/currency mismatch and mark it for investigation.

    A mismatch means the amount/currency reported by Chapa differs from what
    we expected, so the payment MUST NOT be considered successful even if Chapa
    reports the transaction as 'success'. The booking stays unconfirmed; it is
    already APPROVED (payment creation is gated on that) so no state update is
    needed here.
    """
    audit_event(
        actor=payment.payer,
        action="PAYMENT_MISMATCH",
        category=AuditLog.Category.PAYMENT,
        severity=AuditLog.Severity.ERROR,
        result=AuditLog.Result.FAILED,
        target_type="payment",
        target_id=payment.pk,
        target_display=payment.transaction_reference,
        description=(
            f"Payment {payment.transaction_reference} amount/currency mismatch: "
            f"expected {expected_amount} {expected_currency}, Chapa reported "
            f"{reported.get('amount')} {reported.get('currency')}. Booking left unconfirmed."
        ),
        previous_state={"payment_status": payment.status},
        new_state={"booking_status": payment.booking.status},
        metadata={
            "transaction_reference": payment.transaction_reference,
            "booking_reference": payment.booking.booking_reference,
            "expected_amount": str(expected_amount),
            "expected_currency": expected_currency,
            "reported_amount": str(reported.get("amount")),
            "reported_currency": reported.get("currency"),
            "reported_mode": reported.get("mode"),
        },
    )


def _record_alerts(payment, *, description, metadata):
    """Record an audit failure that leaves the payment/booking unconfirmed.

    Like ``_record_mismatch`` but used for other authoritative verification
    failures (e.g. a Chapa mode mismatch). Never raises and never mutates the
    payment state itself.
    """
    audit_event(
        actor=payment.payer,
        action="PAYMENT_VERIFICATION_FAILED",
        category=AuditLog.Category.PAYMENT,
        severity=AuditLog.Severity.ERROR,
        result=AuditLog.Result.FAILED,
        target_type="payment",
        target_id=payment.pk,
        target_display=payment.transaction_reference,
        description=description,
        previous_state={"payment_status": payment.status},
        new_state={"booking_status": payment.booking.status},
        metadata=metadata,
    )


def verify_and_confirm(payment):
    """Verify a payment with Chapa and, if legitimate, confirm the booking.

    Idempotent: if the booking/payment are already confirmed/successful the
    transaction is a no-op. Returns the booking on success, or raises
    ChapaError / ValueError otherwise.

    Note: the FAILED/mismatch state is written inside an atomic block that
    commits NORMALLY (no exception escapes it), and the ValueError is raised
    only AFTER that block commits -- otherwise the exception would roll back
    the failure state we just recorded.
    """
    # Idempotency fast-path: already confirmed, do nothing (webhook + callback
    # both arriving must produce a single confirmation).
    if (
        payment.status == PaymentTransaction.PaymentStatus.SUCCESSFUL
        and payment.booking.status == payment.booking.BookingStatus.CONFIRMED
    ):
        return payment.booking

    if not has_chapa_configured():
        raise ChapaError("Chapa is not configured.")

    verified = chapa_verify(payment.tx_ref)
    status = str(verified.get("status", "")).lower()
    amount = verified.get("amount")
    currency = str(verified.get("currency", "")).upper()
    mode = str(verified.get("mode", "")).lower()

    logger.info(
        "Chapa verification for tx_ref=%s returned status=%s amount=%s currency=%s mode=%s",
        payment.tx_ref,
        status,
        amount,
        currency,
        mode or "n/a",
    )

    outcome = None
    with db_transaction.atomic():
        # Re-check under lock: a concurrent webhook may have already confirmed.
        current = PaymentTransaction.objects.select_for_update().get(pk=payment.pk)
        if (
            current.status == PaymentTransaction.PaymentStatus.SUCCESSFUL
            and current.booking.status == current.booking.BookingStatus.CONFIRMED
        ):
            return current.booking

        # A FAILED attempt is terminal: Chapa authoritatively reported that the
        # transaction did not succeed. We never resurrect it; the renter starts
        # a fresh attempt (new PaymentTransaction / tx_ref) instead.
        if current.status == PaymentTransaction.PaymentStatus.FAILED:
            raise ValueError("This payment attempt already failed; start a new payment.")

        expected_amount = current.amount
        expected_currency = str(current.currency).upper()

        amount_matches = True
        try:
            amount_matches = Decimal(str(amount)) == Decimal(str(expected_amount))
        except (TypeError, ValueError):
            amount_matches = False

        currency_matches = bool(currency) and currency == expected_currency

        # Chapa reports the transaction mode as "test" or "live". When Chapa
        # supplies it, require it to match the mode implied by our configured
        # secret key (TEST vs LIVE). When Chapa omits it (older responses) we
        # do not treat the absence as a mismatch. A real mismatch is surfaced
        # as a failure and audited so it can be investigated.
        expected_mode = _expected_chapa_mode()
        supplied_mode = bool(mode)
        mode_matches = (not supplied_mode) or (mode == expected_mode)

        if status != "success":
            if current.status != PaymentTransaction.PaymentStatus.FAILED:
                current.status = PaymentTransaction.PaymentStatus.FAILED
                current.save(update_fields=["status", "updated_at"])
            outcome = "not_success"
        elif not (amount_matches and currency_matches):
            _record_mismatch(current, expected_amount, expected_currency, verified)
            if current.status != PaymentTransaction.PaymentStatus.FAILED:
                current.status = PaymentTransaction.PaymentStatus.FAILED
                current.save(update_fields=["status", "updated_at"])
            outcome = "mismatch"
        elif not mode_matches:
            _record_alerts(
                current,
                description=(
                    f"Payment {current.transaction_reference} mode mismatch: expected "
                    f"{expected_mode}, Chapa reported {mode}. Booking left unconfirmed."
                ),
                metadata={
                    "transaction_reference": current.transaction_reference,
                    "booking_reference": current.booking.booking_reference,
                    "expected_mode": expected_mode,
                    "reported_mode": mode,
                },
            )
            if current.status != PaymentTransaction.PaymentStatus.FAILED:
                current.status = PaymentTransaction.PaymentStatus.FAILED
                current.save(update_fields=["status", "updated_at"])
            outcome = "mode_mismatch"
        else:
            return _mark_status_and_confirm(
                current,
                {"reference": verified.get("reference"), "mode": mode},
            )

    # Must NOT raise inside the atomic block above or the recorded failure
    # state would be rolled back with the exception.
    if outcome == "not_success":
        logger.warning("Chapa reports payment %s was not successful.", payment.tx_ref)
        raise ValueError("Chapa reports the payment was not successful.")
    if outcome == "mode_mismatch":
        logger.warning("Chapa mode mismatch for payment %s.", payment.tx_ref)
        raise ValueError("Payment mode mismatch; booking not confirmed.")
    raise ValueError("Payment amount/currency mismatch; booking not confirmed.")
