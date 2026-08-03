from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """Read JWT from an HttpOnly cookie when the Authorization header is absent."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            return result

        access_token = request.COOKIES.get("access_token")
        if not access_token:
            return None

        validated_token = self.get_validated_token(access_token)
        return self.get_user(validated_token), validated_token


class IsAuthenticatedCookie(IsAuthenticated):
    """Allow only authenticated requests that are validated through the cookie auth class."""

    pass
