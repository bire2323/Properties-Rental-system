
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.parsers import MultiPartParser, FormParser

from .permissions import CookieJWTAuthentication, IsAuthenticatedCookie
from .serializers import (
    GoogleAuthSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .services import clear_auth_cookies, create_tokens, set_auth_cookies

User = get_user_model()


def home(request):
    data = {
        "message": "well come to property rental system",
    }
    return JsonResponse(data)


class RegisterAPIView(GenericAPIView):
    """Register a new user account and return the profile payload."""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        tokens = create_tokens(user)
        response = Response(
            {
                "user": UserSerializer(user).data,
                "message": "Registration successful.",
            },
            status=status.HTTP_201_CREATED,
        )
        set_auth_cookies(response, tokens["access"], tokens["refresh"])
        return response


class LoginAPIView(GenericAPIView):
    """Log in using email/password and store tokens in secure cookies."""

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        tokens = create_tokens(user)
        response = Response(
            {
                "user": UserSerializer(user).data,
                "message": "Login successful.",
            },
            status=status.HTTP_200_OK,
        )
        set_auth_cookies(response, tokens["access"], tokens["refresh"])
        return response


class LogoutAPIView(APIView):
    """Clear the JWT cookies so the browser session is fully signed out."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = Response({"message": "Logout successful."}, status=status.HTTP_200_OK)
        clear_auth_cookies(response)
        return response


class GoogleAuthAPIView(GenericAPIView):
    """Verify a Google credential token, then create or log in the matching user."""

    serializer_class = GoogleAuthSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        tokens = create_tokens(user)
        response = Response(
            {
                "user": UserSerializer(user).data,
                "message": "Google authentication successful.",
            },
            status=status.HTTP_200_OK,
        )
        set_auth_cookies(response, tokens["access"], tokens["refresh"])
        return response


class ProfileAPIView(APIView):
    """Return the current authenticated user profile from the JWT cookie auth layer."""

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, *args, **kwargs):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class CookieTokenRefreshView(TokenRefreshView):
    """Use the refresh cookie for token rotation when the header is not available."""

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "Refresh token missing."}, status=status.HTTP_401_UNAUTHORIZED)

        request.data["refresh"] = refresh_token
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK and response.data.get("access"):
            response.set_cookie(
                key="access_token",
                value=response.data["access"],
                httponly=True,
                samesite="Lax",
                secure=False,
                max_age=60 * 60,
            )

        return response

class BecomeOwnerAPIView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]
    parser_classes = [MultiPartParser, FormParser]  # For file upload

    def post(self, request, *args, **kwargs):
        user = request.user
        
        # 1. Check if already an owner
        if user.role == User.Role.OWNER:
            return Response(
                {"message": "You are already an owner."},
                status=status.HTTP_200_OK
            )
        
        # 2. Validate required fields
        required_fields = ['city', 'country', 'date_of_birth', 'phone_number']
        missing = [f for f in required_fields if not request.data.get(f)]
        if missing:
            return Response(
                {"error": f"Missing required fields: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 3. Update user fields
        user.role = User.Role.OWNER
        user.city = request.data.get('city')
        user.country = request.data.get('country')
        user.address = request.data.get('address', '')
        user.date_of_birth = request.data.get('date_of_birth')
        user.phone_number = request.data.get('phone_number')
        
        # 4. Handle profile image upload
        if request.FILES.get('profile_image'):
            user.profile_image = request.FILES['profile_image']
        
        user.save()
        
        # 5. Return updated user data
        return Response({
            "message": "You are now a property owner!",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "phone_number": user.phone_number,
                "city": user.city,
                "country": user.country,
                "address": user.address,
                "date_of_birth": user.date_of_birth,
                "profile_image": user.profile_image.url if user.profile_image else None,
                "is_verified": user.is_verified,
            }
        }, status=status.HTTP_200_OK)

