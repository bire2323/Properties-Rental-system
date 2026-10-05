from rest_framework import serializers

from config.cloudinary_helpers import public_asset_url
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.property_name', read_only=True)
    listing_type = serializers.CharField(source='property.listing_type', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    profile_image = serializers.SerializerMethodField()
    property_image = serializers.SerializerMethodField()

    def get_profile_image(self, obj):
        profile = getattr(obj.user, "profile", None)
        return public_asset_url(profile.profile_image) if profile else None

    def get_property_image(self, obj):
        image = obj.property.images.first()
        return public_asset_url(image.image) if image and image.image else None

    class Meta:
        model = Review
        fields = [
            'id', 'property', 'property_name', 'listing_type', 'user', 'user_name',
            'user_email', 'user_role', 'profile_image', 'property_image', 'review_text', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'property', 'user', 'user_name', 'user_email',
            'created_at', 'updated_at',
        ]

    def validate_review_text(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Review text cannot be blank.')
        return value