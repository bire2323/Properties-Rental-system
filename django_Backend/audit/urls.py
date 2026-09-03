from django.urls import path

from .views import (
    AdminAuditLogDetailAPIView,
    AdminAuditLogListAPIView,
    AdminAuditLogSummaryAPIView,
)

urlpatterns = [
    path(
        "admin/audit-logs/",
        AdminAuditLogListAPIView.as_view(),
        name="admin-audit-log-list",
    ),
    path(
        "admin/audit-logs/<int:event_id>/",
        AdminAuditLogDetailAPIView.as_view(),
        name="admin-audit-log-detail",
    ),
    path(
        "admin/audit-logs/summary/",
        AdminAuditLogSummaryAPIView.as_view(),
        name="admin-audit-log-summary",
    ),
]
