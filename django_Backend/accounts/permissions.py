from rest_framework import exceptions
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """Read JWT from an HttpOnly cookie when the Authorization header is absent."""

    def authenticate(self, request):
        try:
            result = super().authenticate(request)
        except exceptions.AuthenticationFailed:
            result = None

        if result is not None:
            return result

        access_token = request.COOKIES.get("access_token")
        if not access_token:
            return None

        try:
            validated_token = self.get_validated_token(access_token)
            user = self.get_user(validated_token)
        except (TokenError, ValueError, exceptions.AuthenticationFailed):
            return None

        return user, validated_token


class IsAuthenticatedCookie(IsAuthenticated):
    """Allow only authenticated requests that are validated through the cookie auth class."""

    pass
