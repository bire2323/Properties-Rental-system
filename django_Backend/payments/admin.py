from django.contrib import admin
from .models import PaymentTransaction, Refund, OwnerPayout


class RefundInline(admin.TabularInline):
    model = Refund
    extra = 0
    readonly_fields = ("refund_reference", "created_at", "processed_at")
    fields = (
        "refund_reference",
        "amount",
        "currency",
        "status",
        "provider_refund_reference",
        "created_at",
    )


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "transaction_reference",
        "booking",
        "payer",
        "payment_method",
        "amount",
        "currency",
        "status",
        "created_at",
    )
    list_filter = ("status", "payment_method", "currency", "created_at")
    search_fields = (
        "transaction_reference",
        "tx_ref",
        "provider_reference",
        "payer__email",
        "payer__first_name",
        "payer__last_name",
        "booking__booking_reference",
    )
    readonly_fields = ("transaction_reference", "created_at", "updated_at")
    raw_id_fields = ("booking", "payer")
    date_hierarchy = "created_at"
    inlines = [RefundInline]

    fieldsets = (
        (
            "Transaction Info",
            {
                "fields": (
                    "transaction_reference",
                    "status",
                    "booking",
                    "payer",
                )
            },
        ),
        (
            "Payment Provider Details",
            {"fields": ("payment_method", "provider_reference")},
        ),
        (
            "Financial Details",
            {"fields": ("amount", "currency")},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = (
        "refund_reference",
        "payment",
        "amount",
        "currency",
        "status",
        "created_at",
        "processed_at",
    )
    list_filter = ("status", "currency", "created_at", "processed_at")
    search_fields = (
        "refund_reference",
        "provider_refund_reference",
        "payment__transaction_reference",
    )
    readonly_fields = ("refund_reference", "created_at")
    raw_id_fields = ("payment",)
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Refund Details",
            {
                "fields": (
                    "refund_reference",
                    "payment",
                    "status",
                    "amount",
                    "currency",
                    "reason",
                )
            },
        ),
        (
            "Provider Reference",
            {"fields": ("provider_refund_reference",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "processed_at")},
        ),
    )


@admin.register(OwnerPayout)
class OwnerPayoutAdmin(admin.ModelAdmin):
    list_display = (
        "payout_reference",
        "get_recipient",
        "booking",
        "amount",
        "currency",
        "status",
        "processed_at",
        "created_at",
    )
    list_filter = ("status", "currency", "created_at", "processed_at")
    search_fields = (
        "payout_reference",
        "booking__booking_reference",
        "owner__email",
        "company__name",
    )
    readonly_fields = ("payout_reference", "created_at", "updated_at")
    raw_id_fields = ("booking", "owner", "company")
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Payout Overview",
            {
                "fields": (
                    "payout_reference",
                    "status",
                    "booking",
                )
            },
        ),
        (
            "Recipient (Select One Only)",
            {
                "fields": ("owner", "company"),
                "description": "Ensure exactly one recipient is chosen (either Individual Owner or Company).",
            },
        ),
        (
            "Financial Details",
            {"fields": ("amount", "currency")},
        ),
        (
            "Timestamps",
            {
                "fields": ("processed_at", "created_at", "updated_at"),
            },
        ),
    )

    @admin.display(description="Recipient")
    def get_recipient(self, obj):
        if obj.owner:
            return f"Owner: {obj.owner.email}"
        elif obj.company:
            return f"Company: {obj.company.name}"
        return "No Recipient"