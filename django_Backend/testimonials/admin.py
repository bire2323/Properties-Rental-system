from django.contrib import admin

from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "summary",
        "status",
        "is_featured",
        "display_order",
        "approved_at",
        "created_at",
    )
    list_filter = ("status", "is_featured")
    list_editable = ("is_featured", "display_order")
    search_fields = (
        "review__user_name",
        "review__user__email",
        "review__property__property_name",
        "review__review_text",
    )
    readonly_fields = ("review", "approved_by", "approved_at", "created_at", "updated_at")
    ordering = ("status", "-created_at")

    @admin.display(description="Testimonial")
    def summary(self, obj):
        return f"{obj.review.user_name} — {obj.review.property.property_name}"