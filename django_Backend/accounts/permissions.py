from rest_framework import exceptions
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from django.utils import timezone
from site_settings.models import SiteSettings


class CookieJWTAuthentication(JWTAuthentication):
    """Read JWT from an HttpOnly cookie when the Authorization header is absent."""

    def authenticate(self, request):
        try:
            result = super().authenticate(request)
        except exceptions.AuthenticationFailed:
            result = None

        if result is not None:
            user, validated_token = result
        else:
            access_token = request.COOKIES.get("access_token")
            if not access_token:
                return None

            try:
                validated_token = self.get_validated_token(access_token)
                user = self.get_user(validated_token)
            except (TokenError, ValueError, exceptions.AuthenticationFailed):
                return None

        if user.login_blocked:
            return None

        started = validated_token.get("session_started")
        if started:
            security = SiteSettings.objects.filter(pk=1).first()
            timeout = validated_token.get("session_timeout_minutes")
            if timeout is None:
                timeout = security.session_timeout_minutes if security else 30
            if timezone.now().timestamp() - started >= timeout * 60:
                return None

        return user, validated_token


class IsAuthenticatedCookie(IsAuthenticated):
    """Allow only authenticated requests that are validated through the cookie auth class."""

    pass
