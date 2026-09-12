"""
Email OTP dispatch for the manual login flow.

Reuses the same safety guarantees as booking emails: dispatch never raises,
is deferred until the DB transaction commits, and renders both HTML and plain
text so a template problem can never block an authentication response.
"""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_login_otp_email(user, code):
    """Email a login verification code to the user. Never raises."""
    if not user or not getattr(user, "email", None):
        return

    context = {
        "site_name": getattr(settings, "DEFAULT_FROM_NAME", "Property Rental System"),
        "user_name": user.get_full_name().strip() or user.email,
        "email": user.email,
        "code": code,
        "expiry_minutes": 5,
    }

    def send():
        try:
            html_body = render_to_string("emails/login/otp.html", context)
        except Exception:
            html_body = None
        try:
            text_body = render_to_string("emails/login/otp.txt", context)
        except Exception:
            text_body = None

        if not html_body and not text_body:
            logger.warning("Login OTP email: no template rendered for %s.", user.email)
            return

        message = EmailMultiAlternatives(
            subject="Your login verification code",
            body=text_body or "",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        if html_body:
            message.attach_alternative(html_body, "text/html")
        try:
            message.send(fail_silently=False)
        except Exception:
            # A failed email must never turn a valid login into an error.
            logger.exception("Failed to send login OTP email to %s", user.email)

    transaction.on_commit(send)


def send_password_reset_otp_email(user, code):
    """Email a password reset code to the user. Never raises."""
    if not user or not getattr(user, "email", None):
        return

    context = {
        "site_name": getattr(settings, "DEFAULT_FROM_NAME", "Property Rental System"),
        "user_name": user.get_full_name().strip() or user.email,
        "email": user.email,
        "code": code,
        "expiry_minutes": 10,
    }

    def send():
        try:
            html_body = render_to_string("emails/password_reset/otp.html", context)
        except Exception:
            html_body = None
        try:
            text_body = render_to_string("emails/password_reset/otp.txt", context)
        except Exception:
            text_body = None

        if not html_body and not text_body:
            logger.warning("Password reset OTP email: no template rendered for %s.", user.email)
            return

        message = EmailMultiAlternatives(
            subject="Your password reset code",
            body=text_body or "",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        if html_body:
            message.attach_alternative(html_body, "text/html")
        try:
            message.send(fail_silently=False)
        except Exception:
            logger.exception("Failed to send password reset OTP email to %s", user.email)

    transaction.on_commit(send)