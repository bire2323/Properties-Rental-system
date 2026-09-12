"""Testimonial moderation service.

All state transitions (approve / reject / hide / restore, feature toggle,
display order, admin note) flow through `moderate_testimonial(...)` which keeps
a single authoritative place for the state change + audit log entry.
"""
from __future__ import annotations

from rest_framework import serializers

from audit.models import AuditLog
from audit.services import audit_event

from .models import Testimonial

# Actions recorded in the platform audit log (UPPER_SNAKE, matching project
# conventions used by bookings/payments/properties admin actions).
AUDIT_ACTION_BY_STATUS = {
    Testimonial.Status.APPROVED: "TESTIMONIAL_APPROVED",
    Testimonial.Status.REJECTED: "TESTIMONIAL_REJECTED",
    Testimonial.Status.HIDDEN: "TESTIMONIAL_HIDDEN",
    Testimonial.Status.PENDING: "TESTIMONIAL_RESTORED",
}


class TestimonialModerationError(serializers.ValidationError):
    """Raised for invalid moderation requests (400)."""


def moderate_testimonial(
    testimonial: Testimonial,
    *,
    actor,
    request=None,
    status: str | None = None,
    is_featured: bool | None = None,
    display_order: int | None = None,
    admin_note: str | None = None,
) -> Testimonial:
    """Apply a moderation change to a testimonial and audit it.

    Special rules:
      * `is_featured` is only valid while the testimonial is approved.
      * Leaving the approved state force-clears `is_featured`.
      * Moving to `approved` stamps approved_by / approved_at; moving away
        clears them.
    """
    original = {
        "status": testimonial.status,
        "is_featured": testimonial.is_featured,
        "display_order": testimonial.display_order,
    }
    changes = []

    if status is not None:
        if status not in Testimonial.Status.values:
            raise TestimonialModerationError(
                {"status": f"'{status}' is not a valid testimonial status."}
            )
        if status != testimonial.status:
            testimonial.status = status
            changes.append(("status", status))

    if is_featured is not None:
        if is_featured and testimonial.status != Testimonial.Status.APPROVED:
            raise TestimonialModerationError(
                {"is_featured": "Only approved testimonials can be featured."}
            )
        if is_featured != testimonial.is_featured:
            testimonial.is_featured = is_featured
            changes.append(("is_featured", is_featured))

    # Leaving the approved state force-clears the featured flag.
    if testimonial.status != Testimonial.Status.APPROVED and testimonial.is_featured:
        testimonial.is_featured = False
        changes.append(("is_featured", False))

    # Approval timestamps track the CURRENT approval.
    if testimonial.status == Testimonial.Status.APPROVED:
        if not testimonial.approved_by or not testimonial.approved_at:
            from django.utils import timezone

            testimonial.approved_by = actor
            testimonial.approved_at = timezone.now()
    else:
        testimonial.approved_by = None
        testimonial.approved_at = None

    if display_order is not None:
        try:
            display_order = int(display_order)
        except (TypeError, ValueError):
            raise TestimonialModerationError(
                {"display_order": "Display order must be an integer."}
            )
        if display_order < 0:
            raise TestimonialModerationError(
                {"display_order": "Display order cannot be negative."}
            )
        if display_order != testimonial.display_order:
            testimonial.display_order = display_order
            changes.append(("display_order", display_order))

    if admin_note is not None:
        if admin_note != testimonial.admin_note:
            testimonial.admin_note = admin_note
            changes.append(("admin_note", admin_note))

    if not changes:
        return testimonial

    testimonial.save()

    new_state = {
        "status": testimonial.status,
        "is_featured": testimonial.is_featured,
        "display_order": testimonial.display_order,
    }

    # Pick the strongest audit action for this change set. A status change
    # always takes priority (approve/reject/hide/restore); otherwise fall back
    # to feature toggles or generic detail updates.
    status_changed = any(key == "status" for key, _ in changes)
    if status_changed:
        action = AUDIT_ACTION_BY_STATUS.get(
            testimonial.status, "TESTIMONIAL_DETAILS_UPDATED"
        )
    elif any(key == "is_featured" and value for key, value in changes):
        action = "TESTIMONIAL_FEATURED"
    elif any(key == "is_featured" for key, _ in changes):
        action = "TESTIMONIAL_UNFEATURED"
    else:
        action = "TESTIMONIAL_DETAILS_UPDATED"

    review = testimonial.review
    actor_display = actor.get_full_name().strip() or actor.email
    audit_event(
        actor=actor,
        action=action,
        category=AuditLog.Category.ADMIN,
        severity=AuditLog.Severity.INFO,
        result=AuditLog.Result.SUCCESS,
        target_type="testimonial",
        target_id=testimonial.pk,
        target_display=f"{review.user_name} on {review.property.property_name}",
        description=(
            f"Admin {actor_display} {action.replace('_', ' ').lower()} "
            f"for '{review.user_name}' on '{review.property.property_name}'."
        ),
        previous_state=original,
        new_state=new_state,
        metadata={
            "review_id": review.pk,
            "property_id": review.property_id,
            "user_id": review.user_id,
            "admin_note": testimonial.admin_note,
        },
        request=request,
    )

    return testimonial