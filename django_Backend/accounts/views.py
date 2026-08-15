from django.contrib.auth import get_user_model
from django.http import JsonResponse
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
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
    UpdateProfileSerializer,
    BecomeOwnerSerializer,
    OwnerProfileSerializer,
    FullUserSerializer,
)
from .services import clear_auth_cookies, create_tokens, set_auth_cookies
from .models import Profile, OwnerProfile,OwnerVerificationDocument

User = get_user_model()


def home(request):
    data = {
        "message": "Welcome to Property Rental System",
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


# ============================================================
# LOGOUT API VIEW
# ============================================================

class LogoutAPIView(APIView):
    """Clear the JWT cookies so the browser session is fully signed out."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = Response({"message": "Logout successful."}, status=status.HTTP_200_OK)
        clear_auth_cookies(response)
        return response


# ============================================================
# GOOGLE AUTH API VIEW
# ============================================================

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
    """
    Get or update the current authenticated user's profile.
    Uses the new Profile model for personal information.
    """

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, *args, **kwargs):
        """Return the current user with nested profile data."""
        # Ensure Profile exists (create if missing)
        Profile.objects.get_or_create(user=request.user)
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        """
        Update the user's profile fields.
        Uses UpdateProfileSerializer for the Profile model.
        """
        user = request.user
        profile, created = Profile.objects.get_or_create(user=user)

        serializer = UpdateProfileSerializer(
            profile,
            data=request.data,
            partial=False,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Return full user data with updated profile
        user_serializer = UserSerializer(user)
        return Response(
            {
                "user": user_serializer.data,
                "message": "Profile updated successfully.",
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, *args, **kwargs):
        """
        Partially update the user's profile fields.
        """
        user = request.user
        profile, created = Profile.objects.get_or_create(user=user)

        serializer = UpdateProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        user_serializer = UserSerializer(user)
        return Response(
            {
                "user": user_serializer.data,
                "message": "Profile updated successfully.",
            },
            status=status.HTTP_200_OK,
        )

class BecomeOwnerAPIView(APIView):
    """
    Upgrade a user to an owner.
    - Updates Profile with personal info (city, country, address, DOB, phone)
    - Creates OwnerProfile with PENDING status
    - Creates OwnerVerificationDocument from uploaded data
    """
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]
    parser_classes = [MultiPartParser, FormParser]  # Required for file uploads

    def post(self, request, *args, **kwargs):
        user = request.user

        # ─── 1. Check if already an owner ──────────────────────────
        if hasattr(user, 'owner_profile'):
            return Response(
                {"message": "You are already an owner or have a pending application."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ─── 2. Validate required fields ───────────────────────────
        required_fields = ['city', 'country', 'date_of_birth', 'phone_number']
        missing = [f for f in required_fields if not request.data.get(f)]
        if missing:
            return Response(
                {"error": f"Missing required fields: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ─── 3. Get or create Profile ──────────────────────────────
        profile, _ = Profile.objects.get_or_create(user=user)

        # ─── 4. Update Profile fields ──────────────────────────────
        profile.city = request.data.get('city')
        profile.country = request.data.get('country')
        profile.address = request.data.get('address', '')
        profile.date_of_birth = request.data.get('date_of_birth')
        profile.phone_number = request.data.get('phone_number')

        # Profile image upload (optional)
        if request.FILES.get('profile_image'):
            profile.profile_image = request.FILES['profile_image']

        profile.save()

        # ─── 5. Create OwnerProfile ─────────────────────────────────
        owner_profile = OwnerProfile.objects.create(
            user=user,
            verification_status=OwnerProfile.VerificationStatus.PENDING,
            can_post_property=False,
        )

        # ─── 6. Update user role ────────────────────────────────────
        user.role = User.Role.OWNER
        user.save(update_fields=["role"])

        # ─── 7. Handle Verification Document ────────────────────────
        document_type = request.data.get('document_type')
        document_number = request.data.get('document_number')  # optional
        document_image = request.FILES.get('document_image')

        if document_type and document_image:
            # Validate document_type against allowed choices
            allowed_types = ['national_id', 'passport', 'driving_license', 'other']
            if document_type not in allowed_types:
                return Response(
                    {"error": f"Invalid document_type. Allowed: {', '.join(allowed_types)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate that document_image is an image file
            if not document_image.content_type.startswith('image/'):
                return Response(
                    {"error": "Document image must be a valid image file (JPEG, PNG, etc.)."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            OwnerVerificationDocument.objects.create(
                owner_profile=owner_profile,
                document_type=document_type,
                document_number=document_number or '',  # optional – save empty if not provided
                document_image=document_image,
            )

        # ─── 8. Return response ──────────────────────────────────────
        return Response(
            {
                "message": "You are now a property owner! Your account is pending verification.",
                "user": UserSerializer(user).data,
                "owner_profile": OwnerProfileSerializer(owner_profile).data,
            },
            status=status.HTTP_201_CREATED,
        )

class OwnerStatusAPIView(APIView):
    """
    Get the current user's owner status and verification details.
    """
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, *args, **kwargs):
        user = request.user

        if hasattr(user, "owner_profile"):
            return Response(
                {
                    "is_owner": user.role == User.Role.OWNER,
                    "verification_status": user.owner_profile.verification_status,
                    "can_post_property": user.owner_profile.can_post_property,
                    "rejection_reason": user.owner_profile.rejection_reason,
                    "approved_at": user.owner_profile.approved_at,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "is_owner": False,
                "verification_status": None,
                "can_post_property": False,
                "rejection_reason": None,
                "approved_at": None,
            },
            status=status.HTTP_200_OK,
        )




class FullUserDetailAPIView(APIView):
    """
    Get full user details including verification documents.
    For admin/staff use only.
    """
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, user_id=None, *args, **kwargs):
        # Only admin or staff can access this
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"detail": "You do not have permission to view this data."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FullUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================
# COOKIE TOKEN REFRESH VIEW
# ============================================================

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