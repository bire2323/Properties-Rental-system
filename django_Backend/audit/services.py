"""
Reusable audit recording service.

All audit events across the platform funnel through `audit_event(...)`.
This keeps a single authoritative place for audit creation and avoids
duplicate events from multiple layers (view + serializer + signal).
"""
from __future__ import annotations

import logging
import uuid

from django.contrib.auth import get_user_model
from django.db import transaction

from .models import AuditLog

logger = logging.getLogger(__name__)

User = get_user_model()

SYSTEM_ACTOR_ROLE = "system"


def _client_ip(request) -> str | None:
    """Best-effort IP extraction from a request (handling proxies)."""
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _user_agent(request) -> str:
    if request is None:
        return ""
    return (request.META.get("HTTP_USER_AGENT") or "")[:500]


def _correlation_id(request, default=None) -> str:
    """Reuse an inbound correlation id or generate one for the request."""
    if request is not None:
        header = request.META.get("HTTP_X_CORRELATION_ID")
        if header:
            return header[:100]
    return default or uuid.uuid4().hex


def audit_event(
    *,
    actor=None,
    action: str,
    category: str,
    severity: str = AuditLog.Severity.INFO,
    result: str = AuditLog.Result.SUCCESS,
    target_type: str = "",
    target_id=None,
    target_display: str = "",
    description: str = "",
    previous_state=None,
    new_state=None,
    reason: str = "",
    metadata=None,
    request=None,
    correlation_id: str | None = None,
    error_message: str = "",
) -> AuditLog | None:
    """
    Record a single audit event. Never raises.

    Designed to be safe: if audit logging hits an unexpected error it logs
    and returns None rather than breaking the caller's business flow.
    """
    try:
        actor_role = ""
        actor_email = ""
        actor_display = ""
        if actor is not None:
            actor_role = getattr(actor, "role", "") or ""
            actor_email = getattr(actor, "email", "") or ""
            actor_display = (
                actor.get_full_name().strip()
                if hasattr(actor, "get_full_name")
                else ""
            ) or actor_email
        else:
            actor_role = SYSTEM_ACTOR_ROLE
            actor_display = "System"

        if not target_type and target_id is not None:
            target_type = "generic"

        target_id_str = str(target_id) if target_id is not None else ""

        with transaction.atomic():
            event = AuditLog.objects.create(
                actor=actor,
                actor_role=actor_role,
                actor_email=actor_email,
                actor_display=actor_display,
                action=action,
                category=category,
                severity=severity,
                result=result,
                target_type=target_type,
                target_id=target_id_str,
                target_display=target_display or target_id_str,
                description=description,
                previous_state=previous_state or {},
                new_state=new_state or {},
                reason=reason or "",
                metadata=metadata or {},
                ip_address=_client_ip(request),
                user_agent=_user_agent(request),
                correlation_id=_correlation_id(request, correlation_id),
                error_message=error_message or "",
            )
        return event
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Audit logging failed: %s", exc)
        return None


def audit_system_event(
    *,
    action: str,
    category: str,
    severity: str = AuditLog.Severity.INFO,
    result: str = AuditLog.Result.SUCCESS,
    target_type: str = "",
    target_id=None,
    target_display: str = "",
    description: str = "",
    previous_state=None,
    new_state=None,
    reason: str = "",
    metadata=None,
    correlation_id: str | None = None,
    error_message: str = "",
) -> AuditLog | None:
    """
    Convenience wrapper for SYSTEM events (actor is NULL / SYSTEM).
    """
    return audit_event(
        actor=None,
        action=action,
        category=category,
        severity=severity,
        result=result,
        target_type=target_type,
        target_id=target_id,
        target_display=target_display,
        description=description,
        previous_state=previous_state,
        new_state=new_state,
        reason=reason,
        metadata=metadata,
        request=None,
        correlation_id=correlation_id,
        error_message=error_message,
    )
