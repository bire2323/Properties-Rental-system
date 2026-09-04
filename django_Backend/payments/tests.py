"""Chapa payment gateway tests.

Covers authentication, ownership, state guards, server-side amount sourcing,
verification transitions, amount/currency mismatch handling, webhook signature
validation, idempotency (webhook + callback + verify => one confirmation), the
audit trail, and confirmation email wording.

Uses TransactionTestCase + locmem email backend so confirm_booking_from_payment's
on_commit-dispatched email is observable, mirroring bookings/test_emails.py.
"""
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core import mail
from django.test import TransactionTestCase, override_settings
from django.test.utils import override_settings as ovr
from rest_framework.test import APIClient

from accounts.models import User
from audit.models import AuditLog
from properties.models import ListingType, ListingStatus, Property, RentalUnit
from site_settings.models import SiteSettings

from bookings.models import Booking
from payments.models import PaymentTransaction


def _success_verify(tx_ref):
    return {"status": "success", "amount": "300.00", "currency": "ETB", "reference": "CHAPA-PROVIDER-REF-1"}


@ovr(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
@override_settings(
    CHAPA_SECRET_KEY="test-secret",
    CHAPA_WEBHOOK_SECRET="test-webhook",
    CHAPA_CALLBACK_URL="https://tunnel.example.com/api/payments/callback/",
    CHAPA_RETURN_URL="https://tunnel.example.com/tenant/bookings",
)
class ChapaPaymentTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        SiteSettings.objects.create(site_name="Test", house_commission_percent=Decimal("10.00"))
        self.owner = User.objects.create_user("owner@example.com", password="x", role=User.Role.OWNER, first_name="Owner", last_name="One")
        self.renter = User.objects.create_user("renter@example.com", password="x", first_name="Renter", last_name="One")
        self.other = User.objects.create_user("other@example.com", password="x", first_name="Other", last_name="One")

        self.car = Property.objects.create(
            owner=self.owner, property_name="Family Sedan", description="Car",
            listing_type=ListingType.CAR, price=Decimal("100.00"),
            rental_unit=RentalUnit.DAILY, currency="ETB",
            status=ListingStatus.ACTIVE, is_available=True,
            security_deposit=Decimal("0.00"),
        )

    def _booking(self, status=Booking.BookingStatus.APPROVED, renter=None):
        renter = renter or self.renter
        start = date.today() + timedelta(days=1)
        b = Booking.objects.create(
            property=self.car,
            renter=renter,
            rental_type=Booking.RentalType.FIXED_TERM,
            start_date=start,
            end_date=start + timedelta(days=3),
            base_price=Decimal("300.00"),
            security_deposit=Decimal("0.00"),
            currency="ETB",
            platform_commission_rate=Decimal("5.00"),
            platform_fee_amount=Decimal("15.00"),
            owner_payout_amount=Decimal("285.00"),
            total_amount=Decimal("300.00"),
            recipient_owner=self.owner,
            status=status,
        )
        return b

    def _client(self, user=None):
        client = APIClient()
        if user:
            client.force_authenticate(user=user)
        return client

    def _payment(self, booking=None, payer=None):
        booking = booking or self._booking()
        payer = payer or booking.renter
        return PaymentTransaction.objects.create(
            booking=booking,
            payer=payer,
            payment_method=PaymentTransaction.PaymentMethod.CHAPA,
            amount=booking.total_amount,
            currency=booking.currency,
            tx_ref="CHAPA-TEST123",
            status=PaymentTransaction.PaymentStatus.INITIATED,
        )

    # ─── Authentication & ownership ─────────────────────────────────────

    def test_create_requires_auth(self):
        booking = self._booking()
        res = self._client().post("/api/payments/", {"booking": booking.pk}, format="json")
        self.assertIn(res.status_code, (401, 403))

    def test_cannot_pay_another_persons_booking(self):
        booking = self._booking(renter=self.other)
        res = self._client(self.renter).post("/api/payments/", {"booking": booking.pk}, format="json")
        self.assertEqual(res.status_code, 403)
        self.assertFalse(PaymentTransaction.objects.filter(booking=booking).exists())

    def test_verify_requires_ownership(self):
        other_booking = self._booking(renter=self.other)
        payment = self._payment(booking=other_booking, payer=self.other)
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            res = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        self.assertEqual(res.status_code, 404)

    # ─── State guards ───────────────────────────────────────────────────

    def test_cannot_pay_pending_booking(self):
        booking = self._booking(status=Booking.BookingStatus.PENDING)
        res = self._client(self.renter).post("/api/payments/", {"booking": booking.pk}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("owner approves", res.data["detail"].lower())

    # ─── Initialize: server-side amount + checkout URL ──────────────────

    def test_initialize_uses_server_amount_and_returns_checkout_url(self):
        booking = self._booking()
        with patch(
            "payments.services.chapa_initialize",
            return_value={"checkout_url": "https://checkout.chapa.example/abc", "reference": "ref1"},
        ) as mock_init:
            res = self._client(self.renter).post(
                "/api/payments/",
                {"booking": booking.pk, "payment_method": "chapa", "amount": 1.00},
                format="json",
            )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["amount"], float(booking.total_amount))
        self.assertEqual(res.data["currency"], "ETB")
        self.assertEqual(res.data["status"], PaymentTransaction.PaymentStatus.INITIATED)
        self.assertEqual(res.data["checkout_url"], "https://checkout.chapa.example/abc")
        # tx_ref was passed to Chapa with the server amount, not the client one.
        _, kwargs = mock_init.call_args
        self.assertEqual(str(kwargs["amount"]), "300.00")

    def test_initialize_customization_title_within_chapa_limit(self):
        """Chapa rejects customization.title > 16 chars; this guards the limit."""
        from payments import services

        class _FakeResponse:
            status_code = 200

            def json(self):
                return {"data": {"checkout_url": "https://checkout.chapa.example/x", "reference": "r1"}}

        with patch("requests.post", return_value=_FakeResponse()) as mock_post:
            result = services.chapa_initialize(
                tx_ref="CHAPA-TITLE-TEST",
                amount="300.00",
                currency="ETB",
                email="renter@example.com",
                first_name="Renter",
                last_name="One",
                callback_url="https://tunnel.example.com/api/payments/callback/",
                return_url="https://tunnel.example.com/tenant/bookings",
            )
        self.assertEqual(result["checkout_url"], "https://checkout.chapa.example/x")
        payload = mock_post.call_args.kwargs["json"]
        title = payload["customization"]["title"]
        self.assertLessEqual(len(title), 16)

    def test_initialize_failure_marks_attempt_failed(self):
        from payments.services import ChapaError

        booking = self._booking()
        with patch("payments.services.chapa_initialize", side_effect=ChapaError("down")):
            res = self._client(self.renter).post("/api/payments/", {"booking": booking.pk, "payment_method": "chapa"}, format="json")
        self.assertEqual(res.status_code, 502)
        payment = PaymentTransaction.objects.get(booking=booking)
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.FAILED)
        # Booking stays APPROVED; NOT confirmed from an unverified init.
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.BookingStatus.APPROVED)

    # ─── Verification transitions ───────────────────────────────────────

    def test_verify_success_confirms_booking(self):
        booking = self._booking()
        payment = self._payment(booking=booking)
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            res = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        self.assertEqual(res.status_code, 200)
        payment.refresh_from_db()
        booking.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.SUCCESSFUL)
        self.assertEqual(booking.status, Booking.BookingStatus.CONFIRMED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("payment received", mail.outbox[0].body.lower())
        self.assertIn("300.00", mail.outbox[0].body)

    def test_verify_failure_marks_failed_and_keeps_approved(self):
        booking = self._booking()
        payment = self._payment(booking=booking)
        with patch("payments.services.chapa_verify", return_value={"status": "failed", "amount": "300.00", "currency": "ETB"}):
            res = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        self.assertEqual(res.status_code, 400)
        payment.refresh_from_db()
        booking.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.FAILED)
        self.assertEqual(booking.status, Booking.BookingStatus.APPROVED)
        self.assertEqual(len(mail.outbox), 0)

    # ─── Amount / currency mismatch ─────────────────────────────────────

    def test_amount_mismatch_does_not_confirm(self):
        booking = self._booking()
        payment = self._payment(booking=booking)

        def _mismatch(tx_ref):
            return {"status": "success", "amount": "10.00", "currency": "ETB"}

        with patch("payments.services.chapa_verify", side_effect=_mismatch):
            res = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        self.assertEqual(res.status_code, 400)
        payment.refresh_from_db()
        booking.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.FAILED)
        self.assertEqual(booking.status, Booking.BookingStatus.APPROVED)
        self.assertEqual(len(mail.outbox), 0)
        mismatch = AuditLog.objects.filter(action="PAYMENT_MISMATCH", target_display=payment.transaction_reference)
        self.assertTrue(mismatch.exists())

    def test_currency_mismatch_does_not_confirm(self):
        booking = self._booking()
        payment = self._payment(booking=booking)

        def _mismatch(tx_ref):
            return {"status": "success", "amount": "300.00", "currency": "USD"}

        with patch("payments.services.chapa_verify", side_effect=_mismatch):
            res = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        self.assertEqual(res.status_code, 400)
        payment.refresh_from_db()
        booking.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.FAILED)
        self.assertEqual(booking.status, Booking.BookingStatus.APPROVED)

    # ─── Webhook signature ──────────────────────────────────────────────

    def _signed_payload(self, tx_ref, secret="test-webhook"):
        import hashlib
        import hmac
        import json

        body = json.dumps({"tx_ref": tx_ref, "status": "success"}).encode("utf-8")
        sig = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        return body, sig

    def test_webhook_rejects_missing_signature(self):
        payment = self._payment()
        body, _ = self._signed_payload(payment.tx_ref)
        res = self._client().post("/api/payments/webhook/", body, content_type="application/json")
        self.assertEqual(res.status_code, 400)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.INITIATED)

    def test_webhook_rejects_bad_signature(self):
        payment = self._payment()
        body, _ = self._signed_payload(payment.tx_ref)
        res = self._client().post(
            "/api/payments/webhook/", body, content_type="application/json",
            HTTP_CHAPA_SIGNATURE="deadbeef",
        )
        self.assertEqual(res.status_code, 400)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.INITIATED)

    def test_webhook_valid_signature_confirms(self):
        payment = self._payment()
        body, sig = self._signed_payload(payment.tx_ref)
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            res = self._client().post(
                "/api/payments/webhook/", body, content_type="application/json",
                HTTP_CHAPA_SIGNATURE=sig,
            )
        self.assertEqual(res.status_code, 200)
        payment.refresh_from_db()
        booking = payment.booking
        booking.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.SUCCESSFUL)
        self.assertEqual(booking.status, Booking.BookingStatus.CONFIRMED)
        self.assertEqual(len(mail.outbox), 1)

    def test_webhook_accepts_when_at_least_one_of_two_signatures_valid(self):
        """Chapa documents both Chapa-Signature and x-chapa-signature.

        When both are present, at least one valid signature must be sufficient.
        """
        payment = self._payment()
        body, sig = self._signed_payload(payment.tx_ref)
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            res = self._client().post(
                "/api/payments/webhook/", body, content_type="application/json",
                HTTP_CHAPA_SIGNATURE="not-valid",
                HTTP_X_CHAPA_SIGNATURE=sig,
            )
        self.assertEqual(res.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.SUCCESSFUL)

    def test_callback_get_trx_ref_does_not_trust_status(self):
        """Even with ?status=success, confirmation only follows authoritative verify."""
        payment = self._payment()
        with patch(
            "payments.services.chapa_verify",
            return_value={"status": "failed", "amount": "300.00", "currency": "ETB"},
        ):
            res = self._client().get(
                f"/api/payments/callback/?trx_ref={payment.tx_ref}&ref_id=ref2&status=success"
            )
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.FAILED)
        self.assertEqual(payment.booking.status, Booking.BookingStatus.APPROVED)

    def test_webhook_unknown_txref_rejected(self):
        body, sig = self._signed_payload("CHAPA-DOES-NOT-EXIST")
        res = self._client().post(
            "/api/payments/webhook/", body, content_type="application/json",
            HTTP_CHAPA_SIGNATURE=sig,
        )
        self.assertEqual(res.status_code, 404)

    # ─── Callback (real Chapa: GET + trx_ref query param) ───────────────

    def test_callback_get_with_trx_ref_confirms(self):
        """Real Chapa fires a GET with ?trx_ref=...&ref_id=...&status=success."""
        payment = self._payment()
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            res = self._client().get(
                f"/api/payments/callback/?trx_ref={payment.tx_ref}&ref_id=ref2&status=success"
            )
        self.assertEqual(res.status_code, 200)
        payment.refresh_from_db()
        booking = payment.booking
        booking.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.SUCCESSFUL)
        self.assertEqual(booking.status, Booking.BookingStatus.CONFIRMED)
        self.assertEqual(len(mail.outbox), 1)

    def test_callback_get_with_tx_ref_confirms(self):
        """Also accept tx_ref in the GET query for backwards/field compatibility."""
        payment = self._payment()
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            res = self._client().get(f"/api/payments/callback/?tx_ref={payment.tx_ref}")
        self.assertEqual(res.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.SUCCESSFUL)
        self.assertEqual(payment.booking.status, Booking.BookingStatus.CONFIRMED)

    def test_callback_accepts_legacy_post_json_tx_ref(self):
        """The documented POST+JSON tx_ref form still works (a GET always precedes it)."""
        payment = self._payment()
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            res = self._client().post(
                "/api/payments/callback/",
                {"tx_ref": payment.tx_ref, "status": "success"},
                format="json",
            )
        self.assertEqual(res.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.SUCCESSFUL)
        self.assertEqual(payment.booking.status, Booking.BookingStatus.CONFIRMED)

    def test_callback_missing_reference_rejected(self):
        self._payment()
        res = self._client().get("/api/payments/callback/?ref_id=1&status=success")
        self.assertEqual(res.status_code, 400)

    def test_callback_unknown_reference_rejected(self):
        res = self._client().get("/api/payments/callback/?trx_ref=DOES-NOT-EXIST")
        self.assertEqual(res.status_code, 404)

    def test_failed_callback_is_terminal_and_does_not_confirm(self):
        """A reported 'failed' status must not confirm the booking; the attempt is terminal."""
        payment = self._payment()

        def _fail_verify(tx_ref):
            return {"status": "failed", "amount": "300.00", "currency": "ETB", "reference": "r-fail"}

        with patch("payments.services.chapa_verify", side_effect=_fail_verify):
            res = self._client().get(f"/api/payments/callback/?trx_ref={payment.tx_ref}&status=failed")
        self.assertEqual(res.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.FAILED)
        self.assertEqual(payment.booking.status, Booking.BookingStatus.APPROVED)
        self.assertEqual(len(mail.outbox), 0)

    # ─── Idempotency ────────────────────────────────────────────────────

    def test_verify_twice_produces_single_confirmation(self):
        booking = self._booking()
        payment = self._payment(booking=booking)
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            r1 = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
            r2 = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r2.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.SUCCESSFUL)
        # One confirmation email, one PAYMENT_VERIFIED audit.
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(AuditLog.objects.filter(action="PAYMENT_VERIFIED", target_display=payment.transaction_reference).count(), 1)

    def test_webhook_then_verify_single_confirmation(self):
        payment = self._payment()
        body, sig = self._signed_payload(payment.tx_ref)
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            res = self._client().post(
                "/api/payments/webhook/", body, content_type="application/json",
                HTTP_CHAPA_SIGNATURE=sig,
            )
            self.assertEqual(res.status_code, 200)
            res2 = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
            self.assertEqual(res2.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.SUCCESSFUL)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(AuditLog.objects.filter(action="PAYMENT_VERIFIED", target_display=payment.transaction_reference).count(), 1)

    # ─── Audit ──────────────────────────────────────────────────────────

    def test_audit_on_success(self):
        booking = self._booking()
        payment = self._payment(booking=booking)
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        # Signal audit (PAYMENT_SUCCESS) + service audit (PAYMENT_VERIFIED).
        self.assertTrue(AuditLog.objects.filter(action="PAYMENT_SUCCESS", target_display=payment.transaction_reference).exists())
        self.assertTrue(AuditLog.objects.filter(action="PAYMENT_VERIFIED", target_display=payment.transaction_reference).exists())

    # ─── Confirmation email wording ─────────────────────────────────────

    def test_confirmation_email_says_payment_received(self):
        booking = self._booking()
        payment = self._payment(booking=booking)
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        message = mail.outbox[0]
        self.assertEqual(message.to, ["renter@example.com"])
        body = message.body
        html = "".join(c[0] for c in message.alternatives if c[1] == "text/html") or ""
        for text in (body, html):
            self.assertIn("payment received", text.lower())
            self.assertIn("300.00", text)
            self.assertIn("confirmed", text.lower())
            # A confirmed booking is paid, so never "amount due" / "waiting for payment".
            self.assertNotIn("amount due", text.lower())
            self.assertNotIn("waiting for payment", text.lower())

    def test_verify_success_stores_provider_reference(self):
        booking = self._booking()
        payment = self._payment(booking=booking)
        self.assertTrue(payment.provider_reference is None or payment.provider_reference == "")
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        payment.refresh_from_db()
        self.assertEqual(payment.provider_reference, "CHAPA-PROVIDER-REF-1")
        # Internal reference is stable and distinct from the Chapa reference.
        self.assertTrue(payment.transaction_reference.startswith("TXN-"))

    # ─── Chapa unavailable / malformed handled ──────────────────────────

    def test_chapa_unavailable_verify_returns_502(self):
        from payments.services import ChapaError

        booking = self._booking()
        payment = self._payment(booking=booking)
        with patch("payments.services.chapa_verify", side_effect=ChapaError("gateway down")):
            res = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        self.assertEqual(res.status_code, 502)
        payment.refresh_from_db()
        booking.refresh_from_db()
        # No state change: we do NOT mark FAILED just because Chapa was unreachable.
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.INITIATED)
        self.assertEqual(booking.status, Booking.BookingStatus.APPROVED)

    def test_webhook_chapa_unavailable_returns_503_for_retry(self):
        from payments.services import ChapaError

        payment = self._payment()
        body, sig = self._signed_payload(payment.tx_ref)
        with patch("payments.services.chapa_verify", side_effect=ChapaError("gateway down")):
            res = self._client().post(
                "/api/payments/webhook/", body, content_type="application/json",
                HTTP_CHAPA_SIGNATURE=sig,
            )
        # Transient failure -> 503 so Chapa retries (not silently acked).
        self.assertEqual(res.status_code, 503)

    # ─── Webhook cannot process a non-Chapa transaction ─────────────────

    def test_webhook_cannot_process_non_chapa_transaction(self):
        booking = self._booking()
        other = PaymentTransaction.objects.create(
            booking=booking,
            payer=self.renter,
            payment_method=PaymentTransaction.PaymentMethod.TELEBIRR,
            amount=booking.total_amount,
            currency=booking.currency,
            tx_ref="TELEBIRR-XYZ",
            status=PaymentTransaction.PaymentStatus.INITIATED,
        )
        body, sig = self._signed_payload(other.tx_ref)
        res = self._client().post(
            "/api/payments/webhook/", body, content_type="application/json",
            HTTP_CHAPA_SIGNATURE=sig,
        )
        self.assertEqual(res.status_code, 404)
        other.refresh_from_db()
        self.assertEqual(other.status, PaymentTransaction.PaymentStatus.INITIATED)

    # ─── Idempotency: duplicate webhook ─────────────────────────────────

    def test_duplicate_webhook_single_confirmation(self):
        payment = self._payment()
        body, sig = self._signed_payload(payment.tx_ref)
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            r1 = self._client().post(
                "/api/payments/webhook/", body, content_type="application/json",
                HTTP_CHAPA_SIGNATURE=sig,
            )
            r2 = self._client().post(
                "/api/payments/webhook/", body, content_type="application/json",
                HTTP_CHAPA_SIGNATURE=sig,
            )
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r2.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.SUCCESSFUL)
        self.assertEqual(payment.booking.status, Booking.BookingStatus.CONFIRMED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(AuditLog.objects.filter(action="PAYMENT_VERIFIED", target_display=payment.transaction_reference).count(), 1)

    # ─── Failed attempt is terminal (no resurrection) ───────────────────

    def test_failed_payment_remains_failed(self):
        booking = self._booking()
        payment = self._payment(booking=booking)
        with patch("payments.services.chapa_verify", return_value={"status": "failed", "amount": "300.00", "currency": "ETB"}):
            r1 = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        self.assertEqual(r1.status_code, 400)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.FAILED)
        # A later "success" must NOT resurrect a FAILED attempt.
        with patch("payments.services.chapa_verify", side_effect=_success_verify):
            r2 = self._client(self.renter).post(f"/api/payments/{payment.pk}/verify/", {}, format="json")
        self.assertEqual(r2.status_code, 400)
        payment.refresh_from_db()
        booking.refresh_from_db()
        self.assertEqual(payment.status, PaymentTransaction.PaymentStatus.FAILED)
        self.assertEqual(booking.status, Booking.BookingStatus.APPROVED)
        self.assertEqual(len(mail.outbox), 0)

    # ─── Multiple attempts preserved ────────────────────────────────────

    def test_previous_failed_attempts_preserved(self):
        from payments.services import ChapaError

        booking = self._booking()
        with patch("payments.services.chapa_initialize", side_effect=ChapaError("down")):
            r1 = self._client(self.renter).post("/api/payments/", {"booking": booking.pk, "payment_method": "chapa"}, format="json")
        self.assertEqual(r1.status_code, 502)

        with patch("payments.services.chapa_initialize", return_value={"checkout_url": "https://checkout.chapa.example/2", "reference": "r2"}):
            r2 = self._client(self.renter).post("/api/payments/", {"booking": booking.pk, "payment_method": "chapa"}, format="json")
        self.assertEqual(r2.status_code, 201)

        attempts = list(PaymentTransaction.objects.filter(booking=booking).order_by("id"))
        self.assertEqual(len(attempts), 2)
        self.assertEqual(attempts[0].status, PaymentTransaction.PaymentStatus.FAILED)
        self.assertEqual(attempts[1].status, PaymentTransaction.PaymentStatus.INITIATED)
        self.assertNotEqual(attempts[0].tx_ref, attempts[1].tx_ref)
        # Attempt 1 was not overwritten by attempt 2.
        self.assertTrue(attempts[0].tx_ref)
        self.assertTrue(attempts[1].tx_ref)

    # ─── Secrets never exposed ──────────────────────────────────────────

    def test_secrets_not_exposed_in_api(self):
        booking = self._booking()
        with patch("payments.services.chapa_initialize", return_value={"checkout_url": "https://checkout.chapa.example/x", "reference": "rx"}):
            res = self._client(self.renter).post(
                "/api/payments/",
                {"booking": booking.pk, "payment_method": "chapa"},
                format="json",
            )
        self.assertEqual(res.status_code, 201)
        text = res.rendered_content.decode("utf-8")
        self.assertNotIn("test-secret", text)
        self.assertNotIn("Bearer", text)
        self.assertNotIn("CHAPA_WEBHOOK_SECRET", text)
        self.assertNotIn("test-webhook", text)
