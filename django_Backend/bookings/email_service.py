"""
Transactional booking emails.

Emails are a separate concern from the Audit Log and the in-app Notification
feed. They are triggered only from the authoritative booking state-transition
points (services / serializers / views) and are dispatched after the database
transaction commits, so a failed email never rolls back a successful status
change and a rolled-back status change never leaks an email.

Safety rules enforced here:
  * Dispatch never raises -- an email failure must not break the booking flow.
  * Sending is deferred with django.db.transaction.on_commit, so emails are
    only emitted once the status change is durably committed.
  * Recipients are deduplicated and any recipient without an email is skipped.
  * Tenant-facing templates never include platform fee / owner payout amounts.
"""
from __future__ import annotations

import logging

from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives

from .models import Booking

logger = logging.getLogger(__name__)


# Maps each booking status to the notification title used by the in-app feed.
STATUS_TITLES = {
    Booking.BookingStatus.PENDING: "New booking request",
    Booking.BookingStatus.APPROVED: "Booking approved",
    Booking.BookingStatus.REJECTED: "Booking rejected",
    Booking.BookingStatus.CANCELLED: "Booking cancelled",
    Booking.BookingStatus.CONFIRMED: "Booking confirmed",
    Booking.BookingStatus.COMPLETED: "Booking completed",
    Booking.BookingStatus.EXPIRED: "Booking expired",
}


def _display_date(value):
    return value.strftime("%b %d, %Y") if value else "Open-ended (month-to-month)"


def _owner_destination_emails(booking) -> list:
    """Emails for the property owner / company managers who manage the listing."""
    emails = set()
    if booking.recipient_company_id:
        for manager in booking.recipient_company.managers.all():
            if manager.email:
                emails.add(manager.email)
        if booking.recipient_company.contact_email:
            emails.add(booking.recipient_company.contact_email)
    elif booking.recipient_owner_id and booking.recipient_owner.email:
        emails.add(booking.recipient_owner.email)
    return sorted(emails)


def _tenant_destination_emails(booking) -> list:
    if booking.renter_id and booking.renter.email:
        return [booking.renter.email]
    return []


def _build_context(booking) -> dict:
    """Shared, tenant-safe context for email templates."""
    property_obj = booking.property
    return {
        "booking": booking,
        "booking_reference": booking.booking_reference,
        "property_name": property_obj.property_name,
        "start_date": _display_date(booking.start_date),
        "end_date": _display_date(booking.end_date),
        "currency": booking.currency,
        "total_amount": f"{booking.currency} {booking.total_amount}",
        "base_price": f"{booking.currency} {booking.base_price}",
        "security_deposit": f"{booking.currency} {booking.security_deposit}",
        "site_name": getattr(settings, "DEFAULT_FROM_NAME", "Property Rental System"),
        "frontend_base_url": settings.FRONTEND_BASE_URL.rstrip("/"),
        "tenant_name": (booking.renter.get_full_name().strip() or booking.renter.email),
        "owner_name": (
            booking.recipient_owner.get_full_name().strip() or booking.recipient_owner.email
            if booking.recipient_owner_id
            else (booking.recipient_company.name if booking.recipient_company_id else "")
        ),
    }


def _subject_line(action: str, booking) -> str:
    title = STATUS_TITLES.get(booking.status, action.replace("_", " ").title())
    return f"[{title}] {booking.property.property_name} · {booking.booking_reference}"


def _dispatch(booking, *, recipients, template_name, subject, context=None):
    """Send an email without raising; scheduled on commit."""
    recipients = [r for r in (recipients or []) if r]
    if not recipients:
        return

    ctx = dict(_build_context(booking))
    if context:
        ctx.update(context)

    def send():
        try:
            html_body = render_to_string(f"emails/booking/{template_name}.html", ctx)
        except Exception:
            html_body = None
        try:
            text_body = render_to_string(f"emails/booking/{template_name}.txt", ctx)
        except Exception:
            text_body = None

        if not html_body and not text_body:
            logger.warning("Booking email %s: no template rendered.", template_name)
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
            # Email delivery must never break a committed booking state change.
            logger.exception("Failed to send booking email template=%s", template_name)

    transaction.on_commit(send)


# ── Public per-event helpers ─────────────────────────────────────────────

def send_booking_created_email(booking):
    _dispatch(
        booking,
        recipients=_owner_destination_emails(booking),
        template_name="created",
        subject=_subject_line("created", booking),
    )


def send_booking_approved_email(booking):
    _dispatch(
        booking,
        recipients=_tenant_destination_emails(booking),
        template_name="approved",
        subject=_subject_line("approved", booking),
        context={"cta_url": f"{settings.FRONTEND_BASE_URL.rstrip('/')}/properties/{booking.property_id}/book/payment"},
    )


def send_booking_rejected_email(booking, reason=""):
    _dispatch(
        booking,
        recipients=_tenant_destination_emails(booking),
        template_name="rejected",
        subject=_subject_line("rejected", booking),
        context={"reason": reason or "No reason was provided."},
    )


def send_booking_cancelled_email(booking, *, cancelled_for, reason=""):
    """
    cancelled_for == "tenant" -> inform the owner side.
    cancelled_for == "owner"  -> inform the tenant.
    """
    if cancelled_for == "tenant":
        recipients = _owner_destination_emails(booking)
        template_name = "cancelled"
        context = {"reason": reason or "No reason was provided.", "by": "tenant"}
    else:
        recipients = _tenant_destination_emails(booking)
        template_name = "cancelled"
        context = {"reason": reason or "No reason was provided.", "by": "owner"}
    _dispatch(
        booking,
        recipients=recipients,
        template_name=template_name,
        subject=_subject_line("cancelled", booking),
        context=context,
    )


def send_booking_confirmed_email(booking):
    _dispatch(
        booking,
        recipients=_tenant_destination_emails(booking),
        template_name="confirmed",
        subject=_subject_line("confirmed", booking),
        context={"cta_url": f"{settings.FRONTEND_BASE_URL.rstrip('/')}/tenant/bookings"},
    )


def send_booking_completed_email(booking):
    _dispatch(
        booking,
        recipients=list(set(_tenant_destination_emails(booking) + _owner_destination_emails(booking))),
        template_name="completed",
        subject=_subject_line("completed", booking),
    )


def send_booking_expired_email(booking):
    _dispatch(
        booking,
        recipients=list(set(_tenant_destination_emails(booking) + _owner_destination_emails(booking))),
        template_name="expired",
        subject=_subject_line("expired", booking),
    )
