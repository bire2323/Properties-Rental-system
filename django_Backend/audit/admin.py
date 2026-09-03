from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "category", "severity", "result", "actor_display", "actor_role", "target_display")
    list_filter = ("category", "severity", "result", "actor_role")
    search_fields = ("action", "description", "actor_email", "actor_display", "target_display", "target_id")
    readonly_fields = [field.name for field in AuditLog._meta.fields]
    date_hierarchy = "created_at"
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        # Audit records are created internally only.
        return False

    def has_change_permission(self, request, obj=None):
        # Audit records are immutable.
        return False
