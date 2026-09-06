from django.contrib import admin
from django.utils.html import format_html
from .models import Booking, BookingApplicantDetails, BookingApplicantDocument


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


class BookingApplicantDocumentInline(admin.TabularInline):
    model = BookingApplicantDocument
    extra = 0
    readonly_fields = ("document", "document_type", "original_filename", "uploaded_at")


@admin.register(BookingApplicantDetails)
class BookingApplicantDetailsAdmin(admin.ModelAdmin):
    list_display = (
        "booking",
        "contact_name",
        "contact_phone",
        "contact_email",
        "id_type",
        "number_of_tenants",
        "created_at",
    )
    list_filter = ("id_type", "created_at")
    search_fields = (
        "booking__booking_reference",
        "contact_name",
        "contact_phone",
        "contact_email",
        "id_number",
    )
    raw_id_fields = ("booking",)
    inlines = [BookingApplicantDocumentInline]
    readonly_fields = ("created_at", "updated_at")

    def document_count(self, obj):
        count = obj.documents.count()
        return count

    document_count.short_description = "Documents"
