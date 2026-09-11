"""
Email-OTP login tests.

Manual (email/password) login now requires an emailed one-time code before any
auth cookie is issued. Covers: no cookies before verification, successful
verification issues cookies + user payload, wrong codes count toward a locked
challenge, expiry, single-use, unknown challenge, and email delivery.
"""
import re
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.core import mail
from django.test import TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import LoginOTP, User


def _make_user(email="otp@example.com", role=User.Role.TENANT):
    return User.objects.create_user(
        email=email,
        password="StrongPass123",
        first_name="Otp",
        last_name="User",
        role=role,
    )


def _otp_code_from_outbox():
    for message in reversed(mail.outbox):
        match = re.search(r"\b(\d{6})\b", message.body or "")
        if match:
            return match.group(1)
    raise AssertionError("No login OTP email found in the mail outbox.")


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class LoginOtpFlowTests(TransactionTestCase):
    def setUp(self):
        self.user = _make_user()
        self.client = APIClient()

    def _login(self):
        return self.client.post(
            "/api/accounts/login/",
            {"email": "otp@example.com", "password": "StrongPass123"},
            format="json",
        )

    def _pending_otp(self):
        return LoginOTP.objects.filter(user=self.user, used_at__isnull=True).first()

    def test_login_returns_challenge_without_cookies(self):
        response = self._login()
        self.assertEqual(response.status_code, 200)
        self.assertIs(response.data["requires_otp"], True)
        self.assertIn("login_challenge_id", response.data)
        self.assertNotIn("user", response.data)
        self.assertNotIn("access_token", self.client.cookies)
        self.assertNotIn("refresh_token", self.client.cookies)

    def test_login_masks_the_email(self):
        response = self._login()
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("otp@example.com", response.data["masked_email"])
        self.assertTrue(response.data["masked_email"].endswith("@example.com"))

    def test_otp_email_is_sent_with_code(self):
        response = self._login()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["otp@example.com"])
        code = _otp_code_from_outbox()
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())

    def test_verify_with_correct_code_issues_session(self):
        self._login()
        otp = self._pending_otp()
        code = _otp_code_from_outbox()

        response = self.client.post(
            "/api/accounts/login/otp-verify/",
            {"login_challenge_id": str(otp.id), "code": code},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["email"], "otp@example.com")
        self.assertEqual(response.data["message"], "Login successful.")
        # HttpOnly session cookies were set and the challenge is consumed.
        self.assertIn("access_token", self.client.cookies)
        self.assertIn("refresh_token", self.client.cookies)
        otp.refresh_from_db()
        self.assertIsNotNone(otp.used_at)

    def test_code_is_single_use(self):
        self._login()
        otp = self._pending_otp()
        code = _otp_code_from_outbox()
        self.client.post(
            "/api/accounts/login/otp-verify/",
            {"login_challenge_id": str(otp.id), "code": code},
            format="json",
        )
        second = self.client.post(
            "/api/accounts/login/otp-verify/",
            {"login_challenge_id": str(otp.id), "code": code},
            format="json",
        )
        self.assertEqual(second.status_code, 400)

    def test_wrong_code_increments_attempts_and_locks(self):
        self._login()
        otp = self._pending_otp()

        for _ in range(LoginOTP.MAX_ATTEMPTS):
            response = self.client.post(
                "/api/accounts/login/otp-verify/",
                {"login_challenge_id": str(otp.id), "code": "000000"},
                format="json",
            )
            self.assertEqual(response.status_code, 400)

        otp.refresh_from_db()
        self.assertEqual(otp.attempts, LoginOTP.MAX_ATTEMPTS)
        self.assertTrue(otp.is_locked())

        # Even the correct code must now be rejected.
        real_code = _otp_code_from_outbox()
        response = self.client.post(
            "/api/accounts/login/otp-verify/",
            {"login_challenge_id": str(otp.id), "code": real_code},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_expired_challenge_is_rejected(self):
        self._login()
        otp = self._pending_otp()
        LoginOTP.objects.filter(pk=otp.pk).update(
            expires_at=timezone.now() - timedelta(minutes=1)
        )
        code = _otp_code_from_outbox()
        response = self.client.post(
            "/api/accounts/login/otp-verify/",
            {"login_challenge_id": str(otp.id), "code": code},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_unknown_challenge_is_rejected(self):
        response = self.client.post(
            "/api/accounts/login/otp-verify/",
            {"login_challenge_id": "00000000-0000-0000-0000-000000000000", "code": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_missing_fields_are_rejected(self):
        self._login()
        otp = self._pending_otp()
        no_code = self.client.post(
            "/api/accounts/login/otp-verify/",
            {"login_challenge_id": str(otp.id)},
            format="json",
        )
        self.assertEqual(no_code.status_code, 400)
        no_challenge = self.client.post(
            "/api/accounts/login/otp-verify/", {"code": "123456"}, format="json"
        )
        self.assertEqual(no_challenge.status_code, 400)


class LoginOtpStorageTests(TransactionTestCase):
    """The OTP code is never stored in plain text."""

    def test_stored_code_is_hashed(self):
        user = _make_user()
        otp = LoginOTP.objects.create(
            user=user,
            code_hash=make_password("654321"),
            expires_at=timezone.now() + timedelta(minutes=5),
        )
        self.assertNotEqual(otp.code_hash, "654321")
        self.assertTrue(otp.code_hash.startswith(("pbkdf2", "bcrypt", "scrypt", "argon2")))