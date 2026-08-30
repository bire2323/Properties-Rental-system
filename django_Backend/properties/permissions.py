from rest_framework import permissions

from accounts.models import User


class AdminRolePermission(permissions.BasePermission):
    """Allow access only to authenticated admin-role users."""

    message = "You do not have permission to access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class PropertyPermission(permissions.BasePermission):
    """Authorization for the Property API."""

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.method == 'POST':
            return request.user.role in {User.Role.OWNER, User.Role.ADMIN}

        return request.method in {'PUT', 'PATCH', 'DELETE'}

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role != User.Role.OWNER:
            return False

        if obj.owner == request.user:
            return True

        return bool(
            obj.company and obj.company.managers.filter(pk=request.user.pk).exists()
        )


class CompanyPermission(permissions.BasePermission):
    """Authorization for the Company API."""

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.method == 'POST':
            return request.user.role in {User.Role.OWNER, User.Role.ADMIN}

        return request.method in {'PUT', 'PATCH', 'DELETE'}

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == User.Role.ADMIN:
            return True

        return obj.managers.filter(pk=request.user.pk).exists()


class CompanyDocumentPermission(permissions.BasePermission):
    """Authorization for company verification documents."""

    message = "You do not have permission to manage this company document."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.method == 'POST':
            return request.user.role in {User.Role.OWNER, User.Role.ADMIN}

        return request.method in {'PUT', 'PATCH', 'DELETE'}

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == User.Role.ADMIN:
            return True

        return obj.company.managers.filter(pk=request.user.pk).exists()
