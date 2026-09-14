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


def _send_rendered_email(subject, template_name, context, recipients):
    if not recipients:
        return

    try:
        html_body = render_to_string(f"emails/{template_name}.html", context)
    except Exception:
        html_body = None
    try:
        text_body = render_to_string(f"emails/{template_name}.txt", context)
    except Exception:
        text_body = None

    if not html_body and not text_body:
        logger.warning("Email %s: no template rendered.", subject)
        return

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body or "",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipients,
    )
    if html_body:
        message.attach_alternative(html_body, "text/html")
    try:
        message.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send %s email to %s", subject, ", ".join(recipients))


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


def send_registration_success_emails(user):
    """Notify the new user and configured administrators after registration."""
    if not user or not getattr(user, "email", None):
        return

    from accounts.models import User
    from site_settings.models import SiteSettings

    admin_recipients = set(
        User.objects.filter(is_active=True, is_staff=True)
        .exclude(email__iexact=user.email)
        .values_list("email", flat=True)
    )
    site_email = SiteSettings.objects.values_list("email", flat=True).first()
    if site_email:
        admin_recipients.add(site_email)

    user_context = {
        "site_name": getattr(settings, "DEFAULT_FROM_NAME", "Property Rental System"),
        "user_name": user.get_full_name().strip() or user.email,
        "email": user.email,
        "role": user.get_role_display() if hasattr(user, "get_role_display") else user.role,
        "is_owner": user.role == user.Role.OWNER,
    }
    admin_context = {
        **user_context,
        "registered_email": user.email,
        "registered_name": user.get_full_name().strip() or user.email,
    }

    def send():
        _send_rendered_email(
            "Registration successful",
            "registration/success",
            user_context,
            [user.email],
        )
        _send_rendered_email(
            "New user registration",
            "registration/admin_notification",
            admin_context,
            sorted(admin_recipients),
        )

    transaction.on_commit(send)


def send_owner_verification_status_email(user, status_value, rejection_reason=""):
    """Notify an owner when their verification status changes."""
    if not user or not getattr(user, "email", None):
        return

    status_labels = {
        "pending": "under review",
        "approved": "approved",
        "rejected": "rejected",
        "suspended": "suspended",
    }
    context = {
        "site_name": getattr(settings, "DEFAULT_FROM_NAME", "Property Rental System"),
        "user_name": user.get_full_name().strip() or user.email,
        "email": user.email,
        "status": status_value,
        "status_label": status_labels.get(status_value, status_value),
        "rejection_reason": rejection_reason or "No reason was provided.",
    }

    def send():
        _send_rendered_email(
            f"Owner verification {status_labels.get(status_value, status_value)}",
            "registration/owner_verification",
            context,
            [user.email],
        )

    transaction.on_commit(send)


def send_user_deleted_email(user, deleted_by_email=""):
    """Notify a user that an administrator deleted their account."""
    if not user or not getattr(user, "email", None):
        return

    context = {
        "site_name": getattr(settings, "DEFAULT_FROM_NAME", "Property Rental System"),
        "user_name": user.get_full_name().strip() or user.email,
        "email": user.email,
        "deleted_by_email": deleted_by_email,
    }
    recipient = user.email

    def send():
        _send_rendered_email(
            "Your account was deleted",
            "registration/account_deleted",
            context,
            [recipient],
        )

    transaction.on_commit(send)