import os
from django.conf import settings
from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def create_tokens(user):
    """Generate an access token and refresh token pair for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def set_auth_cookies(response, access_token, refresh_token):
    """Store JWTs in HttpOnly cookies that the browser can safely send later."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="Lax",
        secure=False,
        max_age=60 * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="Lax",
        secure=False,
        max_age=60 * 60 * 24 * 7,
    )
    return response


def clear_auth_cookies(response):
    """Remove all authentication cookies from the browser."""
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response


def verify_google_token(token):
    """Verify a Google account credential and return the audience-validated payload."""
    google_client_id = getattr(settings, "GOOGLE_CLIENT_ID", "") or os.getenv("GOOGLE_CLIENT_ID", "")

    try:
        payload = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            google_client_id,
        )
        return payload
    except Exception:
        return None
