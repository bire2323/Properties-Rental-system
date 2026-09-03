from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """
    Platform-wide immutable audit trail.

    Records WHO did WHAT, WHEN, WHERE, and to WHICH OBJECT across the entire
    platform (user, booking, payment, property, admin, security, system).

    Records are append-only. They are never edited or deleted through normal
    application flows.
    """

    class Category(models.TextChoices):
        AUTHENTICATION = "authentication", "Authentication"
        USER = "user", "User"
        BOOKING = "booking", "Booking"
        PAYMENT = "payment", "Payment"
        PROPERTY = "property", "Property"
        VEHICLE = "vehicle", "Vehicle"
        ADMIN = "admin", "Admin"
        SECURITY = "security", "Security"
        SYSTEM = "system", "System"
        NOTIFICATION = "notification", "Notification"
        OTHER = "other", "Other"

    class Severity(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Warning"
        ERROR = "error", "Error"
        CRITICAL = "critical", "Critical"

    class Result(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    # Who
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
        help_text="User who performed the action. NULL indicates a SYSTEM event.",
    )
    actor_role = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Snapshot of the actor's role (tenant/owner/admin/system) at event time.",
    )
    actor_email = models.EmailField(
        blank=True,
        default="",
        help_text="Snapshot of the actor's email (safe for display). Redacted when not appropriate.",
    )
    actor_display = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Human-readable display name for the actor (e.g. 'John Doe', 'System').",
    )

    # What
    action = models.CharField(max_length=50, db_index=True)
    category = models.CharField(max_length=20, choices=Category.choices, db_index=True)
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.INFO,
        db_index=True,
    )
    result = models.CharField(
        max_length=20,
        choices=Result.choices,
        default=Result.SUCCESS,
        db_index=True,
    )

    # To which object
    target_type = models.CharField(max_length=50, blank=True, default="", db_index=True)
    target_id = models.CharField(max_length=100, blank=True, default="", db_index=True)
    target_display = models.CharField(max_length=255, blank=True, default="")

    # Details
    description = models.TextField(blank=True, default="")

    # State change
    previous_state = models.JSONField(default=dict, blank=True)
    new_state = models.JSONField(default=dict, blank=True)
    reason = models.TextField(blank=True, default="")

    # Metadata (never store secrets: passwords, tokens, card numbers, etc.)
    metadata = models.JSONField(default=dict, blank=True)

    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True, default="")
    correlation_id = models.CharField(max_length=100, blank=True, default="", db_index=True)

    # Error info (safe, redacted)
    error_message = models.CharField(max_length=500, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=["category", "created_at"]),
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["severity", "created_at"]),
            models.Index(fields=["result", "created_at"]),
            models.Index(fields=["actor", "created_at"]),
            models.Index(fields=["target_type", "target_id", "created_at"]),
        ]

    def __str__(self):
        return f"{self.created_at} {self.action} ({self.category}) [{self.result}]"
