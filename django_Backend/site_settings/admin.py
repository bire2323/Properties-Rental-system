from django.contrib import admin

from .models import PaymentMethod, SiteSettings


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
	list_display = ("name", "account", "holder", "enabled", "updated_at")
	list_filter = ("enabled",)


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
	list_display = ("site_name", "email", "updated_at")
	readonly_fields = ("updated_at",)

	def has_add_permission(self, request):
		return not SiteSettings.objects.exists()
