from rest_framework import permissions

from accounts.models import User


class BookingPermission(permissions.BasePermission):
    """
    - Authenticated users can create bookings (renter is set server-side).
    - Renters can read their own bookings.
    - Property owners / company managers can read and update status for their listings.
    - Admins have full access.
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if view.action == "create":
            return request.user.role in {User.Role.TENANT, User.Role.OWNER, User.Role.ADMIN}

        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == User.Role.ADMIN:
            return True

        # Audit trail should be visible to anyone who can see the booking itself.
        if view.action == "audit":
            if obj.renter_id == user.pk:
                return True
            return _user_manages_property(user, obj.property)

        # Admin-only exceptional actions.
        if view.action in {"admin_cancel", "admin_expire", "admin_complete", "admin_reports"}:
            return False

        if view.action in ("retrieve", "list"):
            if obj.renter_id == user.pk:
                return True
            return _user_manages_property(user, obj.property)

        if view.action in ("partial_update", "update"):
            return _user_manages_property(user, obj.property)

        if view.action == "destroy":
            if obj.renter_id == user.pk and obj.status in {obj.BookingStatus.PENDING, obj.BookingStatus.APPROVED}:
                return True
            return user.role == User.Role.ADMIN

        return False


def _user_manages_property(user, property_obj):
    if property_obj.owner_id == user.pk:
        return True
    if property_obj.company_id and property_obj.company.managers.filter(pk=user.pk).exists():
        return True
    return False
