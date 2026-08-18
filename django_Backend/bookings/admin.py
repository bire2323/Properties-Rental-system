# bookings/admin.py
from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "booking_reference",
        "property",
        "renter",
        "status",
        "start_date",
        "end_date",
        "total_amount",
    )
    list_filter = ("status", "created_at")
    search_fields = ("booking_reference", "renter__email", "property__property_name")
    readonly_fields = ("booking_reference", "created_at", "updated_at")