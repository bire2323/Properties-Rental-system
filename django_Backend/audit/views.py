from datetime import date, datetime, timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User

from .models import AuditLog
from .serializers import (
    AuditLogDetailSerializer,
    AuditLogListSerializer,
    apply_audit_query_filters,
)
from .services import audit_event


def _is_admin(request) -> bool:
    return (
        request.user
        and request.user.is_authenticated
        and request.user.role == User.Role.ADMIN
    )


def _period_date_range(period: str) -> tuple[date | None, date | None]:
    """
    Resolve a bulk-deletion period into an inclusive [start, end] calendar-date
    range (server-side, authoritative).

    Semantics:
      today        -> the current calendar day
      7d           -> the previous 7 calendar days including today
      last_week    -> the previous *completed* calendar week (Mon-Sun)
      last_month   -> the previous *completed* calendar month (1st..last day)

    Returns (start_date, end_date) or (None, None) for an unknown period.
    """
    today = timezone.localdate()

    if period == "today":
        return today, today
    if period == "7d":
        return today - timedelta(days=6), today
    if period == "last_week":
        # ISO weekday: Monday=1 ... Sunday=7
        days_since_monday = today.weekday()
        current_week_start = today - timedelta(days=days_since_monday)
        return current_week_start - timedelta(days=7), current_week_start - timedelta(days=1)
    if period == "last_month":
        first_of_current_month = today.replace(day=1)
        start = (first_of_current_month - timedelta(days=1)).replace(day=1)
        end = first_of_current_month - timedelta(days=1)
        return start, end
    return None, None


def _period_display_name(period: str) -> str:
    return {
        "today": "Today",
        "7d": "Last 7 Days",
        "last_week": "Last Week",
        "last_month": "Last Month",
    }.get(period, period or "selected period")


class AdminAuditLogListAPIView(APIView):
    """
    List audit log events with server-side filtering, search, pagination.
    Returns the available action options for the dynamic action filter.
    """

    def get(self, request, *args, **kwargs):
        if not _is_admin(request):
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = AuditLog.objects.select_related("actor")

        # Dynamic action filter list (distinct actions across logs)
        actions = (
            queryset.order_by("action").values_list("action", flat=True).distinct()
        )

        queryset = apply_audit_query_filters(queryset, request)

        total_count = queryset.count()

        # Pagination
        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = min(100, max(1, int(request.query_params.get("page_size", 20))))
        except (TypeError, ValueError):
            page_size = 20

        page_qs = queryset.order_by("-created_at", "-id")[
            (page - 1) * page_size : page * page_size
        ]

        serializer = AuditLogListSerializer(page_qs, many=True)

        return Response(
            {
                "events": serializer.data,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": (total_count + page_size - 1) // page_size,
                "actions": list(actions),
            },
            status=status.HTTP_200_OK,
        )


class AdminAuditLogDetailAPIView(APIView):
    """Return or delete a single audit event (admin only)."""

    def get(self, request, event_id, *args, **kwargs):
        if not _is_admin(request):
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            event = AuditLog.objects.select_related("actor").get(pk=event_id)
        except AuditLog.DoesNotExist:
            return Response(
                {"detail": "Audit event not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            AuditLogDetailSerializer(event).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, event_id, *args, **kwargs):
        if not _is_admin(request):
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            event = AuditLog.objects.get(pk=event_id)
        except AuditLog.DoesNotExist:
            return Response(
                {"detail": "Audit event not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAuditLogBulkDeleteAPIView(APIView):
    """Delete a batch of audit log events grouped by a time period (admin only).

    The deletion is authoritative and performed as a single DB-level queryset
    delete (never per-row). The period is resolved on the server so the
    frontend never guesses individual records.
    """

    def delete(self, request, *args, **kwargs):
        if not _is_admin(request):
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        period = (request.data.get("period") or "").strip().lower()
        start, end = _period_date_range(period)

        if period not in {"today", "7d", "last_week", "last_month"} or start is None:
            return Response(
                {
                    "detail": "A valid 'period' is required. Expected one of: today, 7d, last_week, last_month."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = AuditLog.objects.all()
        queryset = queryset.filter(created_at__date__gte=start, created_at__date__lte=end)

        deleted_count, _ = queryset.delete()

        # Audit the deletion AFTER the affected records are removed so the
        # record of the deletion itself lives outside the deleted queryset.
        audit_event(
            actor=request.user,
            action="AUDIT_LOGS_BULK_DELETED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.WARNING,
            result=AuditLog.Result.SUCCESS,
            target_type="audit",
            target_display=f"Audit logs ({_period_display_name(period)})",
            description=(
                f"Admin bulk-deleted {deleted_count} audit log entr"
                f"{'y' if deleted_count == 1 else 'ies'} for {_period_display_name(period)}."
            ),
            metadata={
                "period": period,
                "deleted_count": deleted_count,
                "start": start.isoformat() if start else None,
                "end": end.isoformat() if end else None,
            },
            request=request,
        )

        return Response(
            {
                "deleted_count": deleted_count,
                "period": period,
            },
            status=status.HTTP_200_OK,
        )


class AdminAuditLogSummaryAPIView(APIView):
    """Summary counts for the audit log page header (admin only)."""

    def get(self, request, *args, **kwargs):
        if not _is_admin(request):
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from datetime import date, datetime, timedelta

        today_start = datetime.combine(date.today(), datetime.min.time())
        week_start = date.today() - timedelta(days=7)

        events_today = AuditLog.objects.filter(created_at__gte=today_start).count()
        failed_today = AuditLog.objects.filter(
            created_at__gte=today_start, result=AuditLog.Result.FAILED
        ).count()
        security_warnings = AuditLog.objects.filter(
            category__in=[AuditLog.Category.AUTHENTICATION, AuditLog.Category.SECURITY],
            created_at__date__gte=week_start,
        ).count()
        payment_errors = AuditLog.objects.filter(
            category=AuditLog.Category.PAYMENT,
            severity__in=[AuditLog.Severity.ERROR, AuditLog.Severity.CRITICAL],
            created_at__date__gte=week_start,
        ).count()
        admin_actions = AuditLog.objects.filter(
            category=AuditLog.Category.ADMIN,
            created_at__date__gte=week_start,
        ).count()
        system_errors = AuditLog.objects.filter(
            category=AuditLog.Category.SYSTEM,
            severity__in=[AuditLog.Severity.ERROR, AuditLog.Severity.CRITICAL],
            created_at__date__gte=week_start,
        ).count()

        return Response(
            {
                "events_today": events_today,
                "failed_today": failed_today,
                "security_warnings": security_warnings,
                "payment_errors": payment_errors,
                "admin_actions": admin_actions,
                "system_errors": system_errors,
            },
            status=status.HTTP_200_OK,
        )
