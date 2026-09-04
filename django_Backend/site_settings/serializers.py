from rest_framework import serializers

from .models import PaymentMethod, SiteSettings


class PaymentMethodSerializer(serializers.ModelSerializer):
	class Meta:
		model = PaymentMethod
		fields = ("id", "name", "account", "holder", "logo", "description", "enabled", "created_at", "updated_at")
		read_only_fields = ("id", "created_at", "updated_at")


class SiteSettingsSerializer(serializers.ModelSerializer):
	class Meta:
		model = SiteSettings
		fields = (
			"id", "site_name", "site_tagline", "description", "about_us", "session_timeout_minutes",
			"login_attempts_limit", "booking_expiration_hours", "house_commission_percent",
			"car_vehicle_commission_percent", "new_user_registration", "property_listing_alerts",
			"payment_notifications", "user_report_alerts", "contact_phone",
			"email", "address", "copyright_text", "logo", "updated_at", "payment_methods",
		)
		read_only_fields = ("id", "updated_at", "payment_methods")

	payment_methods = PaymentMethodSerializer(many=True, read_only=True)
