from datetime import date, datetime, timedelta

from django.db.models import Q
from rest_framework import serializers

from .models import AuditLog


class AuditLogListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views. Light on nested lookups."""

    actor_user_id = serializers.IntegerField(source="actor.id", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "created_at",
            "action",
            "category",
            "severity",
            "result",
            "actor",
            "actor_user_id",
            "actor_role",
            "actor_email",
            "actor_display",
            "target_type",
            "target_id",
            "target_display",
            "description",
            "correlation_id",
        ]
        read_only_fields = fields


class AuditLogDetailSerializer(serializers.ModelSerializer):
    """Full detail for a single audit event."""

    actor_user_id = serializers.IntegerField(source="actor.id", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "created_at",
            "action",
            "category",
            "severity",
            "result",
            "actor",
            "actor_user_id",
            "actor_role",
            "actor_email",
            "actor_display",
            "target_type",
            "target_id",
            "target_display",
            "description",
            "previous_state",
            "new_state",
            "reason",
            "metadata",
            "ip_address",
            "user_agent",
            "correlation_id",
            "error_message",
        ]
        read_only_fields = fields


def apply_audit_query_filters(queryset, request):
    """
    Apply shared server-side filters used by the admin audit list endpoint.

    Supports: search, category, action, severity, result, actor,
              target_type, date_from, date_to, range (today/7d/30d),
              booking_ref, payment_ref, target_id
    """
    params = request.query_params

    # Search across useful textual fields
    search = params.get("search", "").strip()
    if search:
        queryset = queryset.filter(
            Q(description__icontains=search)
            | Q(action__icontains=search)
            | Q(actor_email__icontains=search)
            | Q(actor_display__icontains=search)
            | Q(target_id__icontains=search)
            | Q(target_display__icontains=search)
            | Q(target_type__icontains=search)
        )

    category = params.get("category", "").strip()
    if category:
        queryset = queryset.filter(category=category.lower())

    action = params.get("action", "").strip()
    if action:
        queryset = queryset.filter(action=action)

    severity = params.get("severity", "").strip()
    if severity:
        queryset = queryset.filter(severity=severity.lower())

    result = params.get("result", "").strip()
    if result:
        queryset = queryset.filter(result=result.lower())

    actor = params.get("actor", "").strip()
    if actor:
        if actor.isdigit():
            queryset = queryset.filter(actor_id=int(actor))
        else:
            # Allow 'system' or a role-like string
            normalized = actor.lower()
            if normalized == AuditLog.actor_role:
                pass
            queryset = queryset.filter(
                Q(actor_role__icontains=normalized)
                | Q(actor_display__icontains=normalized)
                | Q(actor_email__icontains=normalized)
            )

    target_type = params.get("target_type", "").strip()
    if target_type:
        queryset = queryset.filter(target_type=target_type.lower())

    target_id = params.get("target_id", "").strip()
    if target_id:
        queryset = queryset.filter(target_id=target_id)

    booking_ref = params.get("booking_ref", "").strip()
    if booking_ref:
        queryset = queryset.filter(
            Q(target_id=booking_ref) | Q(target_display__icontains=booking_ref)
        )

    payment_ref = params.get("payment_ref", "").strip()
    if payment_ref:
        queryset = queryset.filter(
            Q(target_id=payment_ref) | Q(target_display__icontains=payment_ref)
        )

    # Date range filtering
    range_param = params.get("range", "").strip()
    if range_param:
        today = date.today()
        if range_param == "today":
            start = datetime.combine(today, datetime.min.time())
            queryset = queryset.filter(created_at__gte=start)
        elif range_param == "7d":
            start = today - timedelta(days=7)
            queryset = queryset.filter(created_at__date__gte=start)
        elif range_param == "30d":
            start = today - timedelta(days=30)
            queryset = queryset.filter(created_at__date__gte=start)

    date_from = params.get("date_from", "").strip()
    if date_from:
        try:
            queryset = queryset.filter(created_at__date__gte=date_from)
        except (ValueError, TypeError):
            pass

    date_to = params.get("date_to", "").strip()
    if date_to:
        try:
            queryset = queryset.filter(created_at__date__lte=date_to)
        except (ValueError, TypeError):
            pass

    return queryset
