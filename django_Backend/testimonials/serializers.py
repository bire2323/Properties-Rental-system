from rest_framework import serializers

from .models import Testimonial


def _profile_image_url(user):
    """Return the user's profile image URL or None (never raises)."""
    profile = getattr(user, "profile", None)
    if profile and profile.profile_image:
        try:
            return profile.profile_image.url
        except (ValueError, OSError):
            return None
    return None


def _property_image_url(review):
    """Return the review's property main image URL or None."""
    image = review.property.images.first()
    if image and image.image:
        try:
            return image.image.url
        except (ValueError, OSError):
            return None
    return None


def _rating_value(obj):
    """Read the annotated rating, or query when un-annotated."""
    if hasattr(obj, "_rating"):
        return obj._rating
    from interactions.models import PropertyRating

    rating = PropertyRating.objects.filter(
        property_id=obj.review.property_id,
        user_id=obj.review.user_id,
    ).first()
    return rating.rating if rating else None


def _is_verified(obj):
    """Read the annotated 'verified renter' flag (booking backed)."""
    if hasattr(obj, "_is_verified"):
        return obj._is_verified
    from bookings.models import Booking

    return Booking.objects.filter(
        property_id=obj.review.property_id,
        renter_id=obj.review.user_id,
        status__in=["approved", "confirmed", "completed"],
    ).exists()


class TestimonialPublicSerializer(serializers.ModelSerializer):
    """
    Public home-page shape.

    Backwards-compatible with the previous manual-testimonial payload
    (`name`, `role`, `text`, `image`, `created_at`) plus richer fields so the
    homepage can render star rating, property context and a true
    'Verified renter' badge backed by a booking record.
    """

    name = serializers.CharField(source="review.user_name", read_only=True)
    role = serializers.SerializerMethodField()
    text = serializers.CharField(source="review.review_text", read_only=True)
    image = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    property_id = serializers.IntegerField(source="review.property_id", read_only=True)
    property_name = serializers.CharField(
        source="review.property.property_name", read_only=True
    )
    is_featured = serializers.BooleanField(read_only=True)
    is_verified_renter = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source="review.created_at", read_only=True)
    approved_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Testimonial
        fields = [
            "id",
            "name",
            "role",
            "text",
            "image",
            "rating",
            "property_id",
            "property_name",
            "is_featured",
            "is_verified_renter",
            "created_at",
            "approved_at",
        ]
        read_only_fields = fields

    def get_role(self, obj):
        return "Verified renter" if _is_verified(obj) else ""

    def get_image(self, obj):
        return _profile_image_url(obj.review.user) or _property_image_url(obj.review)

    def get_rating(self, obj):
        return _rating_value(obj)

    def get_is_verified_renter(self, obj):
        return bool(_is_verified(obj))


class TestimonialAdminSerializer(serializers.ModelSerializer):
    """
    Admin moderation shape: full feedback context plus moderation state.

    Never exposed through public endpoints.
    """

    review_id = serializers.IntegerField(source="review.id", read_only=True)
    review_text = serializers.CharField(source="review.review_text", read_only=True)
    rating = serializers.SerializerMethodField()
    is_verified_renter = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    property = serializers.SerializerMethodField()
    booking_reference = serializers.SerializerMethodField()
    booking_status = serializers.SerializerMethodField()
    submitted_at = serializers.DateTimeField(
        source="review.created_at", read_only=True
    )
    approved_by = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = [
            "id",
            "review_id",
            "review_text",
            "rating",
            "is_verified_renter",
            "user",
            "property",
            "booking_reference",
            "booking_status",
            "submitted_at",
            "status",
            "is_featured",
            "display_order",
            "admin_note",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_rating(self, obj):
        return _rating_value(obj)

    def get_is_verified_renter(self, obj):
        return bool(_is_verified(obj))

    def get_user(self, obj):
        user = obj.review.user
        return {
            "id": user.id,
            "name": obj.review.user_name,
            "email": user.email,
            "role": getattr(user, "role", ""),
            "profile_image": _profile_image_url(user),
        }

    def get_property(self, obj):
        property_obj = obj.review.property
        return {
            "id": property_obj.id,
            "name": property_obj.property_name,
            "listing_type": property_obj.listing_type,
            "image": _property_image_url(obj.review),
            "status": property_obj.status,
        }

    def get_booking_reference(self, obj):
        return self._latest_booking(obj).booking_reference if self._latest_booking(obj) else None

    def get_booking_status(self, obj):
        return self._latest_booking(obj).status if self._latest_booking(obj) else None

    def _latest_booking(self, obj):
        """Use pre-annotated booking reference/status when available (list views)."""
        if hasattr(obj, "_booking_ref") and obj._booking_ref:
            from types import SimpleNamespace

            return SimpleNamespace(  # avoids N+1 in list responses
                booking_reference=obj._booking_ref,
                status=getattr(obj, "_booking_status", ""),
            )
        if hasattr(obj, "_booking"):
            return obj._booking
        from bookings.models import Booking

        obj._booking = (
            Booking.objects.filter(
                property_id=obj.review.property_id,
                renter_id=obj.review.user_id,
            )
            .order_by("-created_at")
            .first()
        )
        return obj._booking

    def get_approved_by(self, obj):
        if not obj.approved_by:
            return None
        full = obj.approved_by.get_full_name().strip() or obj.approved_by.email
        return {"id": obj.approved_by_id, "name": full, "email": obj.approved_by.email}