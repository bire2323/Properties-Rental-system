"""Payment API views.

See the rules:
- APPROVED != PAID. Only server-side Chapa verification may set a payment
  SUCCESSFUL and a booking CONFIRMED.
- Chapa redirects / callback status / webhook notification / frontend "success"
  are never trusted on their own. The webhook and callback simply trigger an
  authoritative server-side Chapa verification.
- The amount charged is taken from the booking's server-side financial snapshot
  (booking.total_amount), never from the client.
"""
import hashlib
import hmac

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.models import AuditLog

from accounts.models import User
from accounts.permissions import CookieJWTAuthentication, IsAuthenticatedCookie

from .models import PaymentTransaction
from . import services


def _payment_payload(payment):
    return {
        "id": payment.pk,
        "transaction_reference": payment.transaction_reference,
        "tx_ref": payment.tx_ref,
        "booking": payment.booking_id,
        "booking_reference": payment.booking.booking_reference,
        "booking_status": payment.booking.status,
        "payment_method": payment.payment_method,
        "amount": float(payment.amount),
        "currency": payment.currency,
        "status": payment.status,
        "provider_reference": payment.provider_reference,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
    }


class PaymentListCreateAPIView(APIView):
    """
    GET  /api/payments/      — list payments visible to the caller.
    POST /api/payments/      — initialize a Chapa payment for an APPROVED booking.

    POST body: {"booking": <id>, "payment_method": "chapa"}.
    The amount is taken from the booking; the client value is ignored.
    Returns the local transaction plus a Chapa checkout URL.
    """

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def _visible_queryset(self, user):
        qs = PaymentTransaction.objects.select_related("booking").order_by("-created_at")
        if user.role == User.Role.ADMIN:
            return qs
        if user.role == User.Role.OWNER:
            from properties.models import Property

            managed = Property.objects.filter(
                owner=user
            ).values_list("id", flat=True)
            return qs.filter(booking__property__in=managed)
        return qs.filter(payer=user)

    def get(self, request):
        qs = self._visible_queryset(request.user)
        booking_filter = request.query_params.get("booking")
        status_filter = request.query_params.get("status")
        if booking_filter:
            qs = qs.filter(booking_id=booking_filter)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(
            {"results": [_payment_payload(p) for p in qs[:100]]},
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        booking_id = request.data.get("booking")
        payment_method = request.data.get("payment_method", PaymentTransaction.PaymentMethod.CHAPA)

        from bookings.models import Booking

        try:
            booking = Booking.objects.select_related("property", "renter").get(pk=booking_id)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.renter_id != request.user.pk:
            return Response(
                {"detail": "You can only pay for your own bookings."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if booking.status != Booking.BookingStatus.APPROVED:
            return Response(
                {"detail": "Payment is only available once the owner approves the booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if payment_method != PaymentTransaction.PaymentMethod.CHAPA:
            return Response(
                {"detail": "Only the Chapa payment method is supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not services.has_chapa_configured():
            return Response(
                {"detail": "Payment gateway is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            payment = services.create_payment_transaction(
                booking=booking,
                payer=request.user,
                payment_method=PaymentTransaction.PaymentMethod.CHAPA,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = services.chapa_initialize(
                tx_ref=payment.tx_ref,
                amount=payment.amount,
                currency=payment.currency,
                email=booking.renter.email,
                first_name=booking.renter.first_name,
                last_name=booking.renter.last_name,
                callback_url=services_callback_url(),
                return_url=services_return_url(),
            )
        except services.ChapaError as exc:
            # Initialization failed; mark this attempt FAILED without overwriting
            # previous attempts on the same booking.
            payment.status = PaymentTransaction.PaymentStatus.FAILED
            payment.save(update_fields=["status", "updated_at"])
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        payload = _payment_payload(payment)
        payload["checkout_url"] = result["checkout_url"]
        return Response(payload, status=status.HTTP_201_CREATED)


def _get_owned_payment(request, pk):
    try:
        payment = PaymentTransaction.objects.select_related("booking").get(pk=pk)
    except PaymentTransaction.DoesNotExist:
        return None
    if request.user.role != User.Role.ADMIN:
        if payment.payer_id != request.user.pk:
            return None
    return payment


class PaymentDetailAPIView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, pk):
        payment = _get_owned_payment(request, pk)
        if payment is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_payment_payload(payment), status=status.HTTP_200_OK)


class PaymentStatusAPIView(APIView):
    """GET /api/payments/{id}/status/ — current payment + booking status (no verification)."""

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, pk):
        payment = _get_owned_payment(request, pk)
        if payment is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        payload = _payment_payload(payment)
        payload.pop("checkout_url", None)
        return Response(payload, status=status.HTTP_200_OK)


class PaymentLookupAPIView(APIView):
    """GET /api/payments/lookup/?tx_ref=... — resolve a booking from a transaction reference.

    This is the reconciliation entry point the frontend hits when the renter
    returns from Chapa's hosted checkout. It ONLY reads local DB state — it
    never verifies with Chapa and never confirms anything — so the Chapa
    browser-return ``status`` query parameter is never trusted here or in React.
    The authoritative confirmation happens exclusively through the webhook /
    callback / verify flow.
    """

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request):
        tx_ref = request.query_params.get("tx_ref") or request.query_params.get("trx_ref")
        if not tx_ref:
            return Response({"detail": "tx_ref is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = PaymentTransaction.objects.select_related("booking").get(
                tx_ref=tx_ref,
                payment_method=PaymentTransaction.PaymentMethod.CHAPA,
            )
        except PaymentTransaction.DoesNotExist:
            return Response({"detail": "Unknown transaction."}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role != User.Role.ADMIN and payment.payer_id != request.user.pk:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        booking = payment.booking
        return Response(
            {
                "booking": booking.pk,
                "booking_reference": booking.booking_reference,
                "booking_status": booking.status,
                "tx_ref": payment.tx_ref,
                "payment_id": payment.pk,
                "payment_status": payment.status,
            },
            status=status.HTTP_200_OK,
        )


class PaymentVerifyAPIView(APIView):
    """POST /api/payments/{id}/verify/ — authoritative server-side Chapa verification."""

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def post(self, request, pk):
        payment = _get_owned_payment(request, pk)
        if payment is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            booking = services.verify_and_confirm(payment)
        except services.ChapaError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        payment.refresh_from_db()
        payload = _payment_payload(payment)
        payload["booking_status"] = booking.status
        return Response(payload, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class ChapaWebhookAPIView(APIView):
    """POST /api/payments/webhook/ — Chapa server-to-server notification.

    The body's ``status`` is NOT trusted on its own. The signature is verified
    with HMAC-SHA256 using CHAPA_WEBHOOK_SECRET, then an authoritative Chapa
    verification is performed. Returns 200 even on transient verification
    failures so Chapa does not flood retries; confirmation only happens after a
    successful verification.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        secret = _chapa_webhook_secret()
        if not secret:
            return Response({"detail": "Webhook not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        raw = request.body
        # Chapa documents the signature header both as "Chapa-Signature" and
        # "x-chapa-signature". If more than one is present, at least one valid
        # signature is sufficient.
        signatures = []
        for header in ("Chapa-Signature", "x-chapa-signature"):
            value = request.headers.get(header)
            if value:
                signatures.append(value.strip())

        if not signatures:
            _audit_webhook_rejected(request, "missing_signature")
            return Response({"detail": "Signature is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not any(_valid_signature(secret, raw, sig) for sig in signatures):
            _audit_webhook_rejected(request, "invalid_signature")
            return Response({"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tx_ref = request.data.get("tx_ref") or request.data.get("trx_ref")
        except Exception:
            _audit_webhook_rejected(request, "malformed_payload")
            return Response({"detail": "Malformed payload."}, status=status.HTTP_400_BAD_REQUEST)

        if not tx_ref:
            _audit_webhook_rejected(request, "missing_tx_ref")
            return Response({"detail": "tx_ref is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = PaymentTransaction.objects.get(
                tx_ref=tx_ref,
                payment_method=PaymentTransaction.PaymentMethod.CHAPA,
            )
        except PaymentTransaction.DoesNotExist:
            _audit_webhook_rejected(request, "unknown_tx_ref")
            return Response({"detail": "Unknown transaction."}, status=status.HTTP_404_NOT_FOUND)

        try:
            services.verify_and_confirm(payment)
        except services.ChapaError:
            # Transient Chapa/network failure: signal a retry instead of
            # returning 200 (which would acknowledge the webhook forever).
            return Response({"detail": "Verification temporarily unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError:
            # Definite outcome (Chapa reports failure, or amount mismatch): the
            # webhook was received and processed; no retry is meaningful.
            pass

        payment.refresh_from_db()
        self._audit_webhook_received(request, payment, tx_ref)
        return Response({"status": "ok", "payment_status": payment.status}, status=status.HTTP_200_OK)

    def _audit_webhook_received(self, request, payment, tx_ref):
        from audit.models import AuditLog as _AuditLog
        from audit.services import audit_event

        audit_event(
            actor=None,
            action="PAYMENT_WEBHOOK_RECEIVED",
            category=_AuditLog.Category.PAYMENT,
            severity=_AuditLog.Severity.INFO,
            result=_AuditLog.Result.SUCCESS,
            target_type="payment",
            target_id=payment.pk,
            target_display=payment.transaction_reference,
            description=(
                f"Chapa webhook processed for tx_ref={tx_ref}; "
                f"payment status is {payment.status}."
            ),
            metadata={
                "tx_ref": tx_ref,
                "payment_id": payment.pk,
                "payment_status": payment.status,
                "booking_status": payment.booking.status,
            },
            request=request,
        )


@method_decorator(csrf_exempt, name="dispatch")
class ChapaCallbackAPIView(APIView):
    """Chapa callback — reconciles the payment after the user returns.

    Chapa's real redirect fires a GET to the callback_url with query params
    ``trx_ref``, ``ref_id`` and ``status``. The documented/legacy POST form with
    a JSON body is also accepted for robustness during development.

    The reported ``status`` is NEVER trusted as evidence of payment. This view
    only extracts the transaction reference and triggers an authoritative
    backend verification of that transaction; only a successful Chapa
    verification (``services.verify_and_confirm``) sets the transaction
    SUCCESSFUL and the booking CONFIRMED.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def _extract_reference(self, request):
        """Return the transaction reference from query params or JSON body.

        Prefers ``trx_ref`` (the documented Chapa GET param), falling back to
        ``tx_ref`` for compatibility with the legacy POST form.
        """
        raw = None
        if getattr(request, "data", None):
            try:
                raw = request.data.get("trx_ref") or request.data.get("tx_ref")
            except Exception:
                raw = None
        if not raw and request.query_params:
            raw = (
                request.query_params.get("trx_ref")
                or request.query_params.get("tx_ref")
            )
        if isinstance(raw, str):
            raw = raw.strip()
        return raw or None

    def _handle_callback(self, request):
        tx_ref = self._extract_reference(request)

        if not tx_ref:
            self._audit_callback(request, action="PAYMENT_CALLBACK", result="failed",
                                 severity=AuditLog.Severity.WARNING,
                                 description="Chapa callback received without a transaction reference.",
                                 metadata={"received_status": self._query_status(request)})
            return Response({"detail": "trx_ref is required."}, status=status.HTTP_400_BAD_REQUEST)

        self._audit_callback(
            request,
            action="PAYMENT_CALLBACK",
            description=f"Chapa callback received for tx_ref={tx_ref}.",
            metadata={
                "tx_ref": tx_ref,
                "received_status": self._query_status(request),
            },
        )

        try:
            payment = PaymentTransaction.objects.select_related("booking").get(
                tx_ref=tx_ref,
                payment_method=PaymentTransaction.PaymentMethod.CHAPA,
            )
        except PaymentTransaction.DoesNotExist:
            self._audit_callback(request, action="PAYMENT_CALLBACK", result="failed",
                                 severity=AuditLog.Severity.WARNING,
                                 description=f"Chapa callback referenced unknown tx_ref={tx_ref}.",
                                 metadata={"tx_ref": tx_ref})
            return Response({"detail": "Unknown transaction."}, status=status.HTTP_404_NOT_FOUND)

        self._audit_callback(
            request,
            action="PAYMENT_CALLBACK",
            description=f"Chapa callback matched payment {payment.transaction_reference} for tx_ref={tx_ref}.",
            metadata={"tx_ref": tx_ref, "payment_id": payment.pk,
                      "payment_status": payment.status, "booking_status": payment.booking.status,
                      "booking_id": payment.booking_id},
        )

        try:
            services.verify_and_confirm(payment)
        except services.ChapaError as exc:
            self._audit_callback(
                request, action="PAYMENT_CALLBACK", result="failed",
                severity=AuditLog.Severity.ERROR,
                description=f"Chapa callback: authoritative verification unavailable for tx_ref={tx_ref}.",
                metadata={"tx_ref": tx_ref, "detail": str(exc)},
            )
            return Response(
                {"detail": "Verification temporarily unavailable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except ValueError as exc:
            self._audit_callback(
                request, action="PAYMENT_CALLBACK", result="failed",
                severity=AuditLog.Severity.WARNING,
                description=f"Chapa callback: verification reported failure for tx_ref={tx_ref}.",
                metadata={"tx_ref": tx_ref, "detail": str(exc)},
            )

        payment.refresh_from_db()
        return Response(_payment_payload(payment), status=status.HTTP_200_OK)

    def _query_status(self, request):
        """Return the callback ``status`` query/body value for auditing only.

        This is never used as evidence of payment.
        """
        try:
            return request.data.get("status") if getattr(request, "data", None) else None
        except Exception:
            return None

    def _audit_callback(self, request, *, action, result="success",
                        severity=AuditLog.Severity.INFO, description, metadata=None):
        from audit.models import AuditLog as _AuditLog
        from audit.services import audit_event

        audit_event(
            actor=None,
            action=action,
            category=_AuditLog.Category.PAYMENT,
            severity=severity,
            result=_AuditLog.Result.SUCCESS if result == "success" else _AuditLog.Result.FAILED,
            target_type="payment",
            description=description,
            metadata=metadata or {},
            request=request,
        )

    def get(self, request):
        return self._handle_callback(request)

    def post(self, request):
        return self._handle_callback(request)


def _audit_webhook_rejected(request, reason):
    from audit.models import AuditLog
    from audit.services import audit_event

    audit_event(
        actor=None,
        action="PAYMENT_WEBHOOK_REJECTED",
        category=AuditLog.Category.PAYMENT,
        severity=AuditLog.Severity.WARNING if reason != "invalid_signature" else AuditLog.Severity.ERROR,
        result=AuditLog.Result.FAILED,
        target_type="payment",
        description=f"Rejected Chapa webhook: {reason}.",
        metadata={"reason": reason, "ip_address": request.META.get("REMOTE_ADDR", "")},
        request=request,
    )


def _chapa_webhook_secret():
    try:
        from django.conf import settings

        return settings.CHAPA_WEBHOOK_SECRET
    except Exception:
        return ""


def _valid_signature(secret, body, provided):
    if isinstance(body, str):
        body = body.encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, provided.strip().lower())


def _require_config(name):
    from django.conf import settings

    value = getattr(settings, name, "")
    if not value:
        raise services.ChapaError(f"{name} is not configured.")
    return value


def services_callback_url():
    """Publicly reachable callback URL for Chapa.

    Chapa cannot reach localhost, so this must be a tunneled/production HTTPS
    URL provided via CHAPA_CALLBACK_URL. Fail clearly instead of silently
    pretending localhost works.
    """
    return _require_config("CHAPA_CALLBACK_URL")


def services_return_url():
    """Publicly reachable return URL (React page the user lands on after paying)."""
    return _require_config("CHAPA_RETURN_URL")
