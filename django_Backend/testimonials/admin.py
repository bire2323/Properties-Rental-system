from django.contrib import admin

from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ["name", "role", "is_active", "order", "created_at"]
    list_filter = ["is_active"]
    list_editable = ["is_active", "order"]
    search_fields = ["name", "role", "text"]
    ordering = ["order", "-created_at"]