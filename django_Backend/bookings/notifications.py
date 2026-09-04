"""
In-app booking notifications, reusing the existing accounts.Notification feed.

Notifications are deliberately separate from the Audit Log and from email:
they populate the existing admin/global notification feed using the same
snapshot fields and shape as bookings/signals.py. This module centralizes
notification emission for the later booking lifecycle events (approve, reject,
cancel, confirm, complete, expire) so they all flow through one helper,
avoiding a second, competing notification system.
"""
from __future__ import annotations

import logging

from accounts.models import Notification

logger = logging.getLogger(__name__)


def _phone_for(user):
    profile = getattr(user, "profile", None)
    return getattr(profile, "phone_number", "") or ""


def create_booking_notification(*, booking, title, details, info, sender=None, status=Notification.NotificationStatus.NEW):
    """Record a booking lifecycle event in the existing notification feed."""
    renter = booking.renter
    property_obj = booking.property
    renter_name = renter.get_full_name().strip() or renter.email

    Notification.objects.create(
        type=Notification.NotificationType.BOOKING,
        status=status,
        title=title,
        details=details,
        info=info,
        sender=getattr(sender, "pk", None) or renter,
        sender_name=renter_name,
        sender_email=renter.email,
        sender_phone=_phone_for(renter),
        property_obj=property_obj,
        property_title=property_obj.property_name,
        property_owner=(
            property_obj.owner.get_full_name().strip() or property_obj.owner.email
            if property_obj.owner_id
            else (property_obj.company.name if property_obj.company_id else "")
        ),
        property_address=", ".join(filter(None, [
            property_obj.address,
            property_obj.city.name if property_obj.city else None,
            property_obj.region.name if property_obj.region else None,
        ])),
        property_status=property_obj.get_status_display(),
        property_added_date=(
            property_obj.created_at.strftime("%b %d, %Y")
            if property_obj.created_at
            else ""
        ),
        tenant_name=renter_name,
        tenant_phone=_phone_for(renter),
        check_in_date=booking.start_date.strftime("%b %d, %Y"),
        check_out_date=(
            booking.end_date.strftime("%b %d, %Y")
            if booking.end_date
            else "Open-ended (month-to-month)"
        ),
        total_amount=f"{booking.currency} {booking.total_amount}",
        payment_status=booking.get_status_display(),
    )
