from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Profile, OwnerProfile, OwnerVerificationDocument
from .services import verify_google_token

User = get_user_model()



class ProfileSerializer(serializers.ModelSerializer):
    """Serialize Profile model for create, update, and read operations."""

    class Meta:
        model = Profile
        fields = (
            "phone_number",
            "profile_image",
            "date_of_birth",
            "address",
            "city",
            "country",
        )


class ProfileDetailSerializer(ProfileSerializer):
    """Extended Profile serializer with timestamps."""

    class Meta(ProfileSerializer.Meta):
        fields = ProfileSerializer.Meta.fields + (
            "created_at",
            "updated_at",
        )



class OwnerProfileSerializer(serializers.ModelSerializer):
    """Serialize OwnerProfile model."""

    class Meta:
        model = OwnerProfile
        fields = (
            "verification_status",
            "can_post_property",
            "rejection_reason",
            "approved_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "verification_status",
            "can_post_property",
            "rejection_reason",
            "approved_at",
            "created_at",
            "updated_at",
        )


class OwnerVerificationDocumentSerializer(serializers.ModelSerializer):
    """Serialize OwnerVerificationDocument model."""

    document_type_display = serializers.CharField(
        source="get_document_type_display",
        read_only=True
    )

    class Meta:
        model = OwnerVerificationDocument
        fields = (
            "id",
            "document_type",
            "document_type_display",
            "document_number",
            "document_image",
            "is_verified",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("is_verified", "created_at", "updated_at")



class UserSerializer(serializers.ModelSerializer):
    """
    Return the safe user profile payload required by the frontend.
    Includes nested Profile data, with flattened fields for backward compatibility.
    """

    # Flatten Profile fields to maintain backward compatibility
    phone_number = serializers.CharField(
        source="profile.phone_number",
        read_only=True,
        default=None
    )
    profile_image = serializers.ImageField(
        source="profile.profile_image",
        read_only=True,
        default=None
    )
    date_of_birth = serializers.DateField(
        source="profile.date_of_birth",
        read_only=True,
        default=None
    )
    address = serializers.CharField(
        source="profile.address",
        read_only=True,
        default=None
    )
    city = serializers.CharField(
        source="profile.city",
        read_only=True,
        default=None
    )
    country = serializers.CharField(
        source="profile.country",
        read_only=True,
        default=None
    )

    # Include full profile object (optional, for detailed views)
    profile = ProfileSerializer(read_only=True)

    # Owner profile data
    owner_profile = OwnerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_verified",
            "auth_provider",
            # Flattened Profile fields
            "phone_number",
            "profile_image",
            "date_of_birth",
            "address",
            "city",
            "country",
            # Nested objects
            "profile",
            "owner_profile",
        )



class RegisterSerializer(serializers.ModelSerializer):
    """Serialize registration input and create a new user account with Profile."""

    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.Role.choices, required=True)

  
    phone_number = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        allow_null=True
    )
    profile_image = serializers.ImageField(required=False, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    country = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "password",
            "confirm_password",
            "role",
            # Profile fields
            "phone_number",
            "profile_image",
            "date_of_birth",
            "address",
            "city",
            "country",
        )

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        if password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        email = attrs.get("email")
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        return attrs

    def create(self, validated_data):
        # Extract profile fields
        profile_data = {
            "phone_number": validated_data.pop("phone_number", None),
            "profile_image": validated_data.pop("profile_image", None),
            "date_of_birth": validated_data.pop("date_of_birth", None),
            "address": validated_data.pop("address", None),
            "city": validated_data.pop("city", None),
            "country": validated_data.pop("country", None),
        }

        # Remove None values from profile_data
        profile_data = {k: v for k, v in profile_data.items() if v is not None}

        password = validated_data.pop("password")
        validated_data.pop("confirm_password")

        # Create User
        user = User.objects.create_user(
            password=password,
            auth_provider=User.AuthProvider.EMAIL,
            is_verified=False,
            **validated_data,
        )

        # Create Profile
        Profile.objects.create(
            user=user,
            **profile_data
        )

        return user




class LoginSerializer(serializers.Serializer):
    """Serialize email/password login input."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        request = self.context.get("request")
        user = authenticate(request=request, email=email, password=password)

        if not user:
            raise serializers.ValidationError({"detail": "Invalid email or password."})

        attrs["user"] = user
        return attrs



class GoogleAuthSerializer(serializers.Serializer):
    """Verify a Google credential token and create or fetch the matching user."""

    credential = serializers.CharField(required=True)

    def validate(self, attrs):
        token = attrs.get("credential")
        payload = verify_google_token(token)

        if not isinstance(payload, dict):
            raise serializers.ValidationError({"credential": "Invalid Google token."})

        email = payload.get("email")
        if not email:
            raise serializers.ValidationError({"credential": "Google email is missing in token payload."})

        first_name = payload.get("given_name") or payload.get("name", "").split()[0]
        last_name = payload.get("family_name") or " ".join(payload.get("name", "").split()[1:])
        google_id = payload.get("sub")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name or "Google",
                "last_name": last_name or "User",
                "role": User.Role.TENANT,
                "is_verified": True,
                "auth_provider": User.AuthProvider.GOOGLE,
                "google_id": google_id,
            },
        )

        if not created:
            user.google_id = google_id or user.google_id
            user.auth_provider = User.AuthProvider.GOOGLE
            user.is_verified = True
            user.first_name = user.first_name or (first_name or "Google")
            user.last_name = user.last_name or (last_name or "User")
            user.save(update_fields=["google_id", "auth_provider", "is_verified", "first_name", "last_name"])

        Profile.objects.get_or_create(user=user)

        attrs["user"] = user
        return attrs



class BecomeOwnerSerializer(serializers.ModelSerializer):
 
    class Meta:
        model = OwnerProfile
        fields = (
            "verification_status",
            "can_post_property",
            "rejection_reason",
            "approved_at",
        )
        read_only_fields = (
            "verification_status",
            "can_post_property",
            "rejection_reason",
            "approved_at",
        )

    def validate(self, attrs):
        user = self.context.get("request").user

        # Check if user already has an OwnerProfile
        if hasattr(user, "owner_profile"):
            raise serializers.ValidationError({
                "detail": "You are already an owner or have a pending application."
            })

        # User must be at least a tenant
        if user.role == User.Role.ADMIN:
            raise serializers.ValidationError({
                "detail": "Admins cannot become owners."
            })

        return attrs

    def create(self, validated_data):
        user = self.context.get("request").user

        owner_profile = OwnerProfile.objects.create(
            user=user,
            verification_status=OwnerProfile.VerificationStatus.PENDING,
            can_post_property=False,
        )

        # Optionally update user role to OWNER
        user.role = User.Role.OWNER
        user.save(update_fields=["role"])

        return owner_profile




class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile data."""

    class Meta:
        model = Profile
        fields = (
            "phone_number",
            "profile_image",
            "date_of_birth",
            "address",
            "city",
            "country",
        )



class FullUserSerializer(UserSerializer):
    """
    Extended User serializer with all profile and owner data.
    Used for detailed user views.
    """

    profile = ProfileDetailSerializer(read_only=True)
    owner_profile = OwnerProfileSerializer(read_only=True)
    verification_documents = OwnerVerificationDocumentSerializer(
        source="owner_profile.verification_documents",
        many=True,
        read_only=True
    )

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + (
            "verification_documents",
        )