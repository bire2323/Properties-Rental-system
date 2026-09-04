from django.db.models import Count
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


def _is_admin(request) -> bool:
    return (
        request.user
        and request.user.is_authenticated
        and request.user.role == User.Role.ADMIN
    )


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
