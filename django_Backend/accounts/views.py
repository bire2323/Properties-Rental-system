from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.db.models import Q
from django.utils import timezone
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
    NotificationSerializer,
)
from .services import clear_auth_cookies, create_tokens, set_auth_cookies
from .models import Profile, OwnerProfile, OwnerVerificationDocument, Notification

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

    if owner_profile:
        document = owner_profile.verification_documents.order_by('-created_at').first()

    full_name = f"{user.first_name} {user.last_name}".strip()
    status_value = owner_profile.verification_status if owner_profile else 'pending'
    profile_image_url = build_media_url(request, getattr(profile, 'profile_image', None))
    document_image_url = build_media_url(request, getattr(document, 'document_image', None))

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
        if role_filter and role_filter.upper() in [User.Role.TENANT, User.Role.OWNER]:
            queryset = queryset.filter(role=role_filter.upper())

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
                "status": "Active" if user.is_active else "Inactive",
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


class AdminNotificationListAPIView(APIView):
    """Return all notifications with optional filtering for admin dashboard."""

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

        queryset = Notification.objects.all().order_by("-created_at")

        if type_filter and type_filter != "All":
            queryset = queryset.filter(type=type_filter)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(details__icontains=search) |
                Q(sender_name__icontains=search) |
                Q(property_title__icontains=search) |
                Q(type__icontains=search)
            )

        # If no notifications exist, seed with sample data for first-time use
        if not queryset.exists():
            self._seed_sample_notifications()
            queryset = Notification.objects.all().order_by("-created_at")

        serializer = NotificationSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _seed_sample_notifications(self):
        Notification.objects.create(
            type=Notification.NotificationType.BOOKING,
            status=Notification.NotificationStatus.NEW,
            title="New Booking Request",
            info="Booking information",
            details="Abebe Kebede requested to book Modern Apartment for a short stay. Please review the booking and approve or reject it based on availability and guest details.",
            sender_name="Abebe Kebede",
            sender_email="abebe@gmail.com",
            sender_phone="+251 912 345 678",
            tenant_name="Abebe Kebede",
            tenant_phone="+251 912 345 678",
            check_in_date="Aug 25, 2024",
            check_out_date="Aug 30, 2024",
            total_amount="ETB 850.00",
            payment_method="Cash on Arrival",
            payment_status="Pending",
            property_title="Modern Apartment",
            property_status="Active",
            property_address="Bole Road, House No. 123, Addis Ababa, Ethiopia",
            property_bedrooms=2,
            property_bathrooms=2,
            property_size="1200 sqft",
            property_nightly_price="ETB 850 / night",
            property_image="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
            property_owner="Hana Tesfaye",
            property_added_date="Aug 15, 2024",
        )
        Notification.objects.create(
            type=Notification.NotificationType.PROPERTY,
            status=Notification.NotificationStatus.NEW,
            title="New Property Added",
            info="Listing was added successfully",
            details="A new property listing was published and is now visible to tenants on the platform.",
            sender_name="Hana Tesfaye",
            sender_email="hana@gmail.com",
            sender_phone="+251 911 561 220",
            property_title="Hana Residence",
            property_status="Published",
            property_address="Calle 45, Addis Ababa",
            property_bedrooms=3,
            property_bathrooms=2,
            property_size="1500 sqft",
            property_nightly_price="ETB 950 / night",
            property_image="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
            property_owner="Hana Tesfaye",
            property_added_date="Aug 17, 2024",
        )
        Notification.objects.create(
            type=Notification.NotificationType.PAYMENT,
            status=Notification.NotificationStatus.RECEIVED,
            title="Payment Received",
            info="Payment confirmation",
            details="Payment for booking ID BK-2024-125 was successfully processed and recorded in the system.",
            sender_name="System",
            sender_email="billing@system.com",
            total_amount="ETB 850.00",
            payment_method="Bank Transfer",
            payment_status="Paid",
            property_title="Modern Apartment",
            property_status="Active",
            property_address="Bole Road, Addis Ababa",
            property_bedrooms=2,
            property_bathrooms=2,
            property_size="1200 sqft",
            property_nightly_price="ETB 850 / night",
            property_image="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
            property_owner="Hana Tesfaye",
            property_added_date="Aug 12, 2024",
        )
        Notification.objects.create(
            type=Notification.NotificationType.SYSTEM,
            status=Notification.NotificationStatus.NEW,
            title="New User Registered",
            info="Welcome user created",
            details="A new user account was registered and is eligible to start browsing listings.",
            sender_name="System",
            sender_email="welcome@system.com",
        )
        Notification.objects.create(
            type=Notification.NotificationType.BOOKING,
            status=Notification.NotificationStatus.CONFIRMED,
            title="Booking Confirmed",
            info="Reservation was approved",
            details="The booking was confirmed and the guest has been notified with the reservation timeline.",
            sender_name="System",
            sender_email="booking@system.com",
        )
        Notification.objects.create(
            type=Notification.NotificationType.SYSTEM,
            status=Notification.NotificationStatus.INFO,
            title="System Maintenance",
            info="Scheduled maintenance",
            details="The platform will be under maintenance for routine system updates and service improvements.",
            sender_name="System",
            sender_email="ops@system.com",
        )


class AdminNotificationDetailAPIView(APIView):
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
            notification = Notification.objects.get(id=notification_id)
        except Notification.DoesNotExist:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)