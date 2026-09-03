from django.contrib.auth import get_user_model
from datetime import timedelta
from django.http import JsonResponse
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

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
    NotificationSerializer,
)
from .services import clear_auth_cookies, create_tokens, set_auth_cookies
from .models import Profile, OwnerProfile, OwnerVerificationDocument, Notification
from bookings.models import Booking
from properties.models import Property
from site_settings.models import SiteSettings

User = get_user_model()


def home(request):
    data = {
        "message": "Welcome to Property Rental System",
    }
    return JsonResponse(data)


def build_media_url(request, value):
    if not value:
        return None

    if hasattr(value, 'url'):
        value = value.url

    if value.startswith('http://') or value.startswith('https://'):
        return value

    return request.build_absolute_uri(value if value.startswith('/') else f'/{value}')


def normalize_verification_status(value):
    status_map = {
        'pending': 'Pending',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'suspended': 'Suspended',
    }
    return status_map.get(value, 'Pending')


def serialize_owner_verification_user(user, request):
    profile = getattr(user, 'profile', None)
    owner_profile = getattr(user, 'owner_profile', None)
    document = None
    document_front= None
    document_back= None

    if owner_profile:
        document = owner_profile.verification_documents.order_by('-created_at').first()

    full_name = f"{user.first_name} {user.last_name}".strip()
    status_value = owner_profile.verification_status if owner_profile else 'pending'
    profile_image_url = build_media_url(request, getattr(profile, 'profile_image', None))
    
    document_image_url = build_media_url(request, getattr(document, 'document_image', None))
    
    document_front_image_url = build_media_url(request, getattr(document_front, 'document_front_image', None))
    
    document_back_image_url = build_media_url(request, getattr(document_back, 'document_back_image', None))

    if profile and profile.date_of_birth:
        date_of_birth = profile.date_of_birth.isoformat()
    else:
        date_of_birth = None

    return {
        'id': user.id,
        'owner': full_name or user.email.split('@')[0],
        'email': user.email,
        'phone': profile.phone_number if profile and profile.phone_number else 'N/A',
        'city': profile.city if profile and profile.city else 'N/A',
        'country': profile.country if profile and profile.country else 'N/A',
        'address': profile.address if profile and profile.address else 'N/A',
        'document': document.get_document_type_display() if document else 'N/A',
        'document_number': document.document_number if document else 'N/A',
        'document_id': document.id if document else None,
        'document_image': document_image_url,
        "document_front_image": document_front_image_url,
        "document_back_image": document_back_image_url,
        'registeredDate': (
            owner_profile.created_at.isoformat() if owner_profile and owner_profile.created_at else user.created_at.isoformat() if user.created_at else None
        ),
        'status': normalize_verification_status(status_value),
        'status_value': status_value,
        'image': profile_image_url,
        'date_of_birth': date_of_birth,
        'rejection_reason': owner_profile.rejection_reason if owner_profile else None,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'approved_at': owner_profile.approved_at.isoformat() if owner_profile and owner_profile.approved_at else None,
    }


class RegisterAPIView(GenericAPIView):
    """Register a new user account and return the profile payload."""

    authentication_classes = []
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        site_settings = SiteSettings.objects.filter(pk=1).first()
        if site_settings is None or site_settings.new_user_registration:
            Notification.objects.create(
                type=Notification.NotificationType.SYSTEM,
                status=Notification.NotificationStatus.NEW,
                title="New user registration",
                details=f"{user.get_full_name().strip() or user.email} created a new account.",
                info="User registration",
                sender=user,
                sender_name=user.get_full_name().strip() or user.email,
                sender_email=user.email,
            )

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

    authentication_classes = []
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
                "session_timeout_minutes": getattr(SiteSettings.objects.filter(pk=1).first(), "session_timeout_minutes", 30),
                "message": "Login successful.",
            },
            status=status.HTTP_200_OK,
        )
        set_auth_cookies(response, tokens["access"], tokens["refresh"])
        return response



class LogoutAPIView(APIView):
    """Clear the JWT cookies so the browser session is fully signed out."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = Response({"message": "Logout successful."}, status=status.HTTP_200_OK)
        clear_auth_cookies(response)
        return response

class GoogleAuthAPIView(GenericAPIView):
    """Verify a Google credential token, then create or log in the matching user."""

    authentication_classes = []
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
                "session_timeout_minutes": getattr(SiteSettings.objects.filter(pk=1).first(), "session_timeout_minutes", 30),
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
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, *args, **kwargs):
        """Return the current user with nested profile data."""
        # Ensure Profile exists (create if missing)
        Profile.objects.get_or_create(user=request.user)
        data = UserSerializer(request.user).data
        if request.user.role == User.Role.ADMIN:
            data["session_timeout_minutes"] = getattr(SiteSettings.objects.filter(pk=1).first(), "session_timeout_minutes", 30)
        return Response(data, status=status.HTTP_200_OK)

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
        required_fields = ['city', 'country', 'phone_number']
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
        document_front_image = request.FILES.get("document_front_image")
        document_back_image = request.FILES.get("document_back_image")

        if document_type and (document_image or document_front_image or document_back_image):
            allowed_types = ['national_id', 'passport', 'driving_license', 'other']
            if document_type not in allowed_types:
                return Response(
                    {"error": f"Invalid document_type. Allowed: {', '.join(allowed_types)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            primary_image = document_image or document_front_image or document_back_image
            if not primary_image.content_type.startswith('image/'):
                return Response(
                    {"error": "Document image must be a valid image file (JPEG, PNG, etc.)."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            OwnerVerificationDocument.objects.create(
                owner_profile=owner_profile,
                document_type=document_type,
                document_number=document_number or '',
                document_image=document_image or document_front_image or document_back_image,
                document_front_image=document_front_image,
                document_back_image=document_back_image,
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

    def delete(self, request, user_id=None, *args, **kwargs):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"detail": "You do not have permission to delete users."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if user.is_staff or user.is_superuser or user.role == User.Role.ADMIN:
            return Response(
                {"detail": "Administrator accounts cannot be deleted here."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserStatisticsAPIView(APIView):
    """
    Return user statistics for the admin dashboard.
    """
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        total_users = User.objects.exclude(role=User.Role.ADMIN).count()
        total_tenants = User.objects.filter(role=User.Role.TENANT).count()
        total_owners = User.objects.filter(role=User.Role.OWNER).count()

        return Response(
            {
                "total_users": total_users,
                "total_tenants": total_tenants,
                "total_owners": total_owners,
            },
            status=status.HTTP_200_OK,
        )


class AdminRecentUsersAPIView(APIView):
    """Return the most recently created users for the admin dashboard."""

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        users = User.objects.exclude(role=User.Role.ADMIN).order_by('-created_at')[:5]
        payload = []

        for user in users:
            full_name = f"{user.first_name} {user.last_name}".strip()
            profile_image_url = None
            if hasattr(user, 'profile') and user.profile.profile_image:
                profile_image_url = request.build_absolute_uri(user.profile.profile_image.url)
            payload.append({
                "id": user.id,
                "name": full_name or user.email.split('@')[0],
                "email": user.email,
                "role": user.role.title() if user.role else 'User',
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "profile_image": profile_image_url,
            })

        return Response(payload, status=status.HTTP_200_OK)


class AdminAllUsersAPIView(APIView):
    """Return all users with optional filtering and pagination for admin users page."""

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get query parameters for filtering and pagination
        search = request.query_params.get('search', '').strip()
        role_filter = request.query_params.get('role', '').strip()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))

        # Start with all non-admin users, excluding pending owner applications
        queryset = User.objects.exclude(role=User.Role.ADMIN).exclude(
            role=User.Role.OWNER,
            owner_profile__verification_status=OwnerProfile.VerificationStatus.PENDING,
        ).order_by('-created_at')

        # Apply role filter
        normalized_role = role_filter.lower()
        if normalized_role in [User.Role.TENANT, User.Role.OWNER]:
            queryset = queryset.filter(role=normalized_role)

        # Apply search filter (search by name, email, or phone)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(profile__phone_number__icontains=search)
            )

        # Get total count before pagination
        total_count = queryset.count()

        # Apply pagination
        start_idx = (page - 1) * page_size
        users_page = queryset[start_idx:start_idx + page_size]

        payload = []
        for user in users_page:
            full_name = f"{user.first_name} {user.last_name}".strip()
            phone = 'N/A'
            profile_image_url = None
            if hasattr(user, 'profile'):
                phone = user.profile.phone_number or 'N/A'
                if user.profile.profile_image:
                    profile_image_url = request.build_absolute_uri(user.profile.profile_image.url)
            payload.append({
                "id": user.id,
                "name": full_name or user.email.split('@')[0],
                "email": user.email,
                "phone": phone,
                "role": user.role.title() if user.role else 'User',
                "status": "Blocked" if user.login_blocked else "Active" if user.is_active else "Inactive",
                "login_blocked": user.login_blocked,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "profile_image": profile_image_url,
            })

        return Response({
            "users": payload,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size,
        }, status=status.HTTP_200_OK)


class AdminUserLoginResetAPIView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def patch(self, request, user_id, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to reset user login access."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user.failed_login_attempts = 0
        user.login_blocked = False
        user.save(update_fields=["failed_login_attempts", "login_blocked", "updated_at"])
        return Response(
            {"id": user.id, "login_blocked": False, "message": "User login access has been reset."},
            status=status.HTTP_200_OK,
        )


class AdminOwnerVerificationAPIView(APIView):
    """Return all PENDING owner verification submissions for admin review."""

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        search = request.query_params.get('search', '').strip()
        queryset = User.objects.filter(
            role=User.Role.OWNER,
            owner_profile__isnull=False,
            owner_profile__verification_status=OwnerProfile.VerificationStatus.PENDING
        ).order_by('-created_at')

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(profile__phone_number__icontains=search) |
                Q(owner_profile__verification_documents__document_number__icontains=search)
            ).distinct()

        payload = [serialize_owner_verification_user(user, request) for user in queryset]
        return Response(payload, status=status.HTTP_200_OK)


class AdminOwnerVerificationDecisionAPIView(APIView):
    """Approve, reject, or suspend an owner verification submission."""

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def patch(self, request, user_id, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        owner_profile = getattr(user, 'owner_profile', None)
        if not owner_profile:
            return Response({"detail": "This user does not have an owner verification profile."}, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get('status', owner_profile.verification_status)
        if status_value not in OwnerProfile.VerificationStatus.values:
            return Response({"detail": "Invalid verification status."}, status=status.HTTP_400_BAD_REQUEST)

        owner_profile.verification_status = status_value
        owner_profile.can_post_property = status_value == OwnerProfile.VerificationStatus.APPROVED
        owner_profile.rejection_reason = request.data.get('rejection_reason') if status_value == OwnerProfile.VerificationStatus.REJECTED else ''

        if status_value == OwnerProfile.VerificationStatus.APPROVED:
            user.role = User.Role.OWNER
            owner_profile.approved_at = timezone.now()
        elif status_value in [OwnerProfile.VerificationStatus.REJECTED, OwnerProfile.VerificationStatus.SUSPENDED]:
            if status_value == OwnerProfile.VerificationStatus.REJECTED:
                user.role = User.Role.TENANT
            owner_profile.approved_at = None

        user.save(update_fields=['role'])
        owner_profile.save()
        return Response(serialize_owner_verification_user(user, request), status=status.HTTP_200_OK)


class CookieTokenRefreshView(TokenRefreshView):
    """Use the refresh cookie for token rotation when the header is not available."""

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "Refresh token missing."}, status=status.HTTP_401_UNAUTHORIZED)

        request.data["refresh"] = refresh_token
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK and response.data.get("access"):
            security = SiteSettings.objects.filter(pk=1).first()
            timeout_minutes = security.session_timeout_minutes if security else 30
            access_token = RefreshToken(refresh_token).access_token
            access_token["session_started"] = int(timezone.now().timestamp())
            access_token["session_timeout_minutes"] = timeout_minutes
            access_token.set_exp(lifetime=timedelta(minutes=timeout_minutes))
            response.data["access"] = str(access_token)
            response.set_cookie(
                key="access_token",
                value=str(access_token),
                httponly=True,
                samesite="Lax",
                secure=False,
                max_age=60 * 60,
            )

        return response


class AdminNotificationListAPIView(APIView):
    """Return persisted admin notifications from the database."""

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        type_filter = request.query_params.get("type", "").strip()
        search = request.query_params.get("search", "").strip()

        entries = NotificationSerializer(
            Notification.objects.select_related("sender", "sender__profile", "sender__owner_profile")
            .filter(
                Q(type=Notification.NotificationType.PROPERTY, property_obj__isnull=False)
                | Q(
                    type=Notification.NotificationType.SYSTEM,
                    title="New user registration",
                )
            ),
            many=True,
        ).data
        if type_filter and type_filter != "All":
            entries = [entry for entry in entries if entry["type"] == type_filter]
        if search:
            search_value = search.lower()
            entries = [
                entry for entry in entries
                if search_value in " ".join(str(entry.get(key, "")) for key in ("title", "details", "sender", "property_title", "type")).lower()
            ]

        entries.sort(key=lambda entry: entry.get("created_at", ""), reverse=True)
        return Response(entries, status=status.HTTP_200_OK)

    def _payment_notifications(self):
        from payments.models import PaymentTransaction

        site_settings = SiteSettings.objects.filter(pk=1).first()
        if site_settings is not None and not site_settings.payment_notifications:
            return []

        payments = PaymentTransaction.objects.select_related(
            "payer", "booking", "booking__property"
        )
        return [
            {
                "id": f"payment-{payment.id}",
                "type": "Payment",
                "status": "New" if payment.status in {
                    PaymentTransaction.PaymentStatus.INITIATED,
                    PaymentTransaction.PaymentStatus.PENDING,
                } else "Info",
                "title": "New payment",
                "details": (
                    f"{payment.currency} {payment.amount} payment for "
                    f"{payment.booking.property.property_name}."
                ),
                "info": payment.get_payment_method_display(),
                "sender": payment.payer.get_full_name().strip() or payment.payer.email,
                "sender_name": payment.payer.get_full_name().strip() or payment.payer.email,
                "email": payment.payer.email,
                "payment_method": payment.get_payment_method_display(),
                "payment_status": payment.get_status_display(),
                "total_amount": f"{payment.currency} {payment.amount}",
                "created_at": payment.created_at.isoformat(),
            }
            for payment in payments
        ]

    def _property_fields(self, property_obj):
        house = getattr(property_obj, "house_detail", None)
        car = getattr(property_obj, "car_detail", None)
        image = property_obj.images.first()
        owner = property_obj.owner
        owner_name = f"{owner.first_name} {owner.last_name}".strip() or owner.email
        owner_phone = getattr(getattr(owner, "profile", None), "phone_number", "") or ""
        return {
            "property_title": property_obj.property_name,
            "property_status": property_obj.get_status_display(),
            "property_address": ", ".join(filter(None, [property_obj.address, property_obj.city, property_obj.region])),
            "property_bedrooms": getattr(house, "bedrooms", 0),
            "property_bathrooms": getattr(house, "bathrooms", 0),
            "property_size": f"{house.area_sqft} sqft" if house else "",
            "property_nightly_price": f"{property_obj.currency} {property_obj.price} / {property_obj.get_rental_unit_display().lower()}",
            "property_image": image.image.url if image else "",
            "property_images": [property_image.image.url for property_image in property_obj.images.all()],
            "property_owner": owner_name,
            "property_owner_phone": owner_phone,
            "property_added_date": property_obj.created_at.strftime("%b %d, %Y"),
            "listing_type": property_obj.listing_type,
            "car_brand": getattr(car, "brand", ""),
            "car_model": getattr(car, "model", ""),
            "car_year": getattr(car, "year", ""),
            "car_mileage": getattr(car, "mileage", ""),
            "car_fuel_type": getattr(car, "fuel_type", ""),
            "car_seating_capacity": getattr(car, "seating_capacity", ""),
        }

    def _booking_history(self):
        entries = []
        bookings = Booking.objects.select_related("property", "property__owner", "property__house_detail", "property__car_detail", "renter").prefetch_related("property__images")
        for booking in bookings:
            fields = self._property_fields(booking.property)
            renter_name = f"{booking.renter.first_name} {booking.renter.last_name}".strip() or booking.renter.email
            entry = {
                "id": f"booking-{booking.id}",
                "type": "Booking",
                "status": booking.get_status_display(),
                "title": f"Booking {booking.booking_reference}",
                "details": f"{renter_name} booked {booking.property.property_name}.",
                "info": "Booking history",
                "sender": renter_name,
                "sender_name": renter_name,
                "email": booking.renter.email,
                "phone": getattr(getattr(booking.renter, "profile", None), "phone_number", "") or "",
                "tenant_name": renter_name,
                "tenant_phone": getattr(getattr(booking.renter, "profile", None), "phone_number", "") or "",
                "check_in_date": booking.start_date.strftime("%b %d, %Y"),
                "check_out_date": booking.end_date.strftime("%b %d, %Y"),
                "total_amount": f"{booking.currency} {booking.total_amount}",
                "payment_status": booking.get_status_display(),
                "created_at": booking.created_at.isoformat(),
            }
            entry.update(fields)
            entries.append(entry)
        return entries

    def _property_history(self):
        entries = []
        properties = Property.objects.select_related("owner", "house_detail", "car_detail").prefetch_related("images")
        for property_obj in properties:
            fields = self._property_fields(property_obj)
            entry = {
                "id": f"property-{property_obj.id}",
                "type": "Property",
                "status": "Info",
                "title": f"Property Added: {property_obj.property_name}",
                "details": property_obj.description or "A property listing was added.",
                "info": "Property history",
                "sender": fields["property_owner"],
                "sender_name": fields["property_owner"],
                "created_at": property_obj.created_at.isoformat(),
            }
            entry.update(fields)
            entries.append(entry)
        return entries


class AdminNotificationDetailAPIView(AdminNotificationListAPIView):
    """Return detailed information for a specific notification."""

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, notification_id, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            notification = Notification.objects.filter(
                Q(type=Notification.NotificationType.PROPERTY, property_obj__isnull=False)
                | Q(type=Notification.NotificationType.SYSTEM, title="New user registration")
            ).select_related("sender", "sender__profile", "sender__owner_profile").get(id=notification_id)
        except (Notification.DoesNotExist, ValueError):
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)

    def delete(self, request, notification_id, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            notification = Notification.objects.filter(
                Q(type=Notification.NotificationType.PROPERTY, property_obj__isnull=False)
                | Q(type=Notification.NotificationType.SYSTEM, title="New user registration")
            ).get(id=notification_id)
        except (Notification.DoesNotExist, ValueError):
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.delete()
        return Response({"detail": "Notification deleted successfully."}, status=status.HTTP_200_OK)


class AdminPaymentsAPIView(APIView):
    """Return admin payments list (stub returning empty transactions)."""

    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticatedCookie]

    def get(self, request, *args, **kwargs):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            from payments.models import Transaction, Payment

            transactions_qs = Transaction.objects.select_related(
                "booking", "booking__property", "booking__renter"
            ).order_by("-created_at")[:100]

            transactions = []
            for i, tx in enumerate(transactions_qs):
                booking = getattr(tx, "booking", None)
                property_obj = getattr(booking, "property", None)
                renter = getattr(booking, "renter", None)
                transactions.append({
                    "id": getattr(tx, "id", f"tx-{i}"),
                    "transaction_id": getattr(tx, "transaction_id", getattr(tx, "reference", "")),
                    "amount": float(getattr(tx, "amount", 0)),
                    "currency": getattr(tx, "currency", "ETB"),
                    "status": getattr(tx, "status", "Pending"),
                    "payment_method": getattr(tx, "payment_method", getattr(tx, "method", "Bank Transfer")),
                    "property_name": property_obj.property_name if property_obj else (getattr(booking, "title", "") if booking else ""),
                    "tenant_name": (f"{renter.first_name} {renter.last_name}".strip() if renter else (getattr(renter, "email", "") if renter else "Unknown")),
                    "date": getattr(tx, "created_at", getattr(tx, "paid_at", None)),
                })
        except Exception:
            transactions = []

        return Response({"transactions": transactions}, status=status.HTTP_200_OK)