
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


class SiteSettings(models.Model):
    site_name = models.CharField(max_length=100)
    site_tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    session_timeout_minutes = models.PositiveIntegerField(default=30, validators=[MinValueValidator(1)])
    login_attempts_limit = models.PositiveIntegerField(default=5, validators=[MinValueValidator(1)])
    booking_expiration_hours = models.PositiveIntegerField(default=24, validators=[MinValueValidator(1)])
    owner_commission_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=5,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    new_user_registration = models.BooleanField(default=True)
    property_listing_alerts = models.BooleanField(default=True)
    payment_notifications = models.BooleanField(default=True)
    user_report_alerts = models.BooleanField(default=True)

    contact_phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    copyright_text = models.CharField(
        max_length=255,
        blank=True,
        default="© 2026 Property Rental System. All rights reserved."
    )
    logo = models.ImageField(
        upload_to="site/logo/",
        blank=True,
        null=True
    )

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.site_name


class PaymentMethod(models.Model):
    site_settings = models.ForeignKey(SiteSettings, on_delete=models.CASCADE, related_name="payment_methods")
    name = models.CharField(max_length=100)
    account = models.CharField(max_length=100)
    holder = models.CharField(max_length=150)
    logo = models.ImageField(upload_to="site/payment-methods/", blank=True, null=True)
    description = models.TextField(blank=True)
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name", "id")