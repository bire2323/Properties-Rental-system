from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .services import verify_google_token

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serialize registration input and create a new user account."""

    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.Role.choices, required=True)

    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "password",
            "confirm_password",
            "role",
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
        password = validated_data.pop("password")
        validated_data.pop("confirm_password")

        user = User.objects.create_user(
            password=password,
            auth_provider=User.AuthProvider.EMAIL,
            is_verified=False,
            **validated_data,
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


class UserSerializer(serializers.ModelSerializer):
    """Return the safe profile payload required by the frontend."""

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
        )


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

        attrs["user"] = user
        return attrs
