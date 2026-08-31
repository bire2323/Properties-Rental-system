from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "booking_reference",
        "property",
        "renter",
        "rental_type",
        "status",
        "start_date",
        "end_date",
        "total_amount",
        "currency",
    )
    list_filter = ("status", "rental_type", "created_at", "property__listing_type")
    search_fields = (
        "booking_reference",
        "renter__email",
        "property__property_name",
    )
    readonly_fields = (
        "booking_reference",
        "base_price",
        "security_deposit",
        "currency",
        "platform_commission_rate",
        "platform_fee_amount",
        "owner_payout_amount",
        "total_amount",
        "recipient_owner",
        "recipient_company",
        "created_at",
        "updated_at",
    )
    raw_id_fields = ("property", "renter", "recipient_owner", "recipient_company")
    date_hierarchy = "start_date"
    ordering = ("-created_at",)
