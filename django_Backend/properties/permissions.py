from rest_framework import permissions

from accounts.models import User


class PropertyPermission(permissions.BasePermission):
    """
    Authorization for the Property API.

    - SAFE_METHODS (GET/HEAD/OPTIONS) are publicly readable.
    - POST requires role owner or admin.
    - PUT/PATCH/DELETE delegate to has_object_permission which authorises:
        • Admin (any property)
        • The property owner
        • Any manager of the property's company
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.method == 'POST':
            return request.user.role in {User.Role.OWNER, User.Role.ADMIN}

        # PUT/PATCH/DELETE — defer to object-level check
        if request.method in {'PUT', 'PATCH', 'DELETE'}:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        # Admins can manage any property
        if request.user.role == User.Role.ADMIN:
            return True

        # Owners may manage their own property OR any company property
        # for which they are an authorised manager
        if request.user.role == User.Role.OWNER:
            if obj.owner == request.user:
                return True
            if obj.company is not None and obj.company.managers.filter(
                pk=request.user.pk
            ).exists():
                return True

        return False


class CompanyPermission(permissions.BasePermission):
    """
    Authorization for the Company API.

    - SAFE_METHODS are publicly readable.
    - POST requires authentication and role owner or admin.
    - PUT/PATCH/DELETE require the user to be an admin or a manager of
      the specific company.
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.method == 'POST':
            return request.user.role in {User.Role.OWNER, User.Role.ADMIN}

        # PUT/PATCH/DELETE — defer to object-level check
        if request.method in {'PUT', 'PATCH', 'DELETE'}:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == User.Role.ADMIN:
            return True

        # Company managers may update/delete their own company
        return obj.managers.filter(pk=request.user.pk).exists()
