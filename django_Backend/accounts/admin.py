from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User
from accounts.models import OwnerProfile

@admin.register(OwnerProfile)
class OwnerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'verification_status', 'can_post_property', 'created_at']
    list_filter = ['verification_status', 'can_post_property']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    actions = ['approve_owners']

    def approve_owners(self, request, queryset):
        queryset.update(verification_status='approved', can_post_property=True)
        self.message_user(request, f"{queryset.count()} owner(s) approved.")
    approve_owners.short_description = "Approve selected owners"
@admin.register(User)
class CustomUserAdmin(UserAdmin):

    actions = [
        "verify_users",
        "make_owner",
        "deactivate_users",
    ]

    def verify_users(self, request, queryset):
        queryset.update(is_verified=True)

    verify_users.short_description = "Verify selected users"

    def make_owner(self, request, queryset):
        queryset.update(role="owner")

    make_owner.short_description = "Make selected users owners"

    def deactivate_users(self, request, queryset):
        queryset.update(is_active=False)

    deactivate_users.short_description = "Deactivate selected users"


    ordering = ("email",)

    list_display = (
        "email",
        "first_name",
        "last_name",
        "role",
        "is_verified",
        "is_staff",
    )

    list_filter = (
        "role",
        "is_verified",
        "is_staff",
        "is_active",
    )

    fieldsets = (
        ("Authentication", {
            "fields": (
                "email",
                "password",
            )
        }),

        ("Personal Information", {
            "fields": (
                "first_name",
                "last_name",
                "phone_number",
                "profile_image",
                "address",
                "city",
                "country",
            )
        }),

        ("Role Information", {
            "fields": (
                "role",
                "is_verified",
            )
        }),

        ("Social Login", {
            "fields": (
                "auth_provider",
                "google_id",
                "telegram_id",
            )
        }),

        ("Permissions", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),

        ("Important Dates", {
            "fields": (
                "last_login",
                "date_joined",
                "created_at",
                "updated_at",
            )
        }),
    )


    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "role",
                    "phone_number",
                    "password1",
                    "password2",
                ),
            },
        ),
    )