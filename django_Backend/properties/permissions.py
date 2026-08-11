from rest_framework import permissions

from accounts.models import User


class PropertyPermission(permissions.BasePermission):
    """
    Use the application role model for Property API authorization.

    - SAFE_METHODS (GET/HEAD/OPTIONS) are publicly readable.
    - POST is only valid for users with role owner/admin.
    - PUT/PATCH/DELETE pass through to object-level checks, which
      authorize an admin for any property and an owner for only their
      own property. A tenant can never access these write operations.
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        # Property listings remain publicly viewable, matching the current
        # frontend API pattern and property discovery usage.
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        # POST /properties/ is only for owner/admin.
        if request.method == 'POST':
            return request.user.role in {User.Role.OWNER, User.Role.ADMIN}

        # PUT/PATCH/DELETE are object-level operations, so the view can
        # continue and let has_object_permission() decide authoritatively.
        if request.method in {'PUT', 'PATCH', 'DELETE'}:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        # GET/HEAD/OPTIONS stay readable for anyone.
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        # The business administrator is governed by the explicit role field.
        # is_staff/is_superuser are Django admin infrastructure flags; they do
        # not replace the application role policy for the Property API.
        if request.user.role == User.Role.ADMIN:
            return True

        # Owners may only modify/delete the property they own.
        if request.user.role == User.Role.OWNER:
            return obj.owner == request.user

        # Tenants are forbidden from creating, updating, or deleting properties.
        return False
