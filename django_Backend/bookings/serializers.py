from rest_framework import serializers
from django.utils import timezone

from properties.models import Property, ListingType
from .models import Booking
from . import services


class BookingCreateSerializer(serializers.Serializer):
    """
    Create-only serializer. Financial fields and renter are set by the backend.
    """
    property = serializers.PrimaryKeyRelatedField(queryset=Property.objects.all())
    rental_type = serializers.ChoiceField(
        choices=Booking.RentalType.choices,
        required=False,
        allow_null=True,
    )
    start_date = serializers.DateField()
    end_date = serializers.DateField(required=False, allow_null=True)

    def validate(self, data):
        property_obj = data["property"]
        start_date = data["start_date"]
        end_date = data.get("end_date")

        if start_date < timezone.localdate():
            raise serializers.ValidationError({"start_date": "Start date cannot be in the past."})
        if property_obj.owner_id == self.context["request"].user.pk:
            raise serializers.ValidationError({"property": "You cannot book your own listing."})

        bookable_errors = services.validate_property_bookable(property_obj)
        if bookable_errors:
            raise serializers.ValidationError(bookable_errors)

        try:
            rental_type = services.resolve_rental_type(
                property_obj,
                data.get("rental_type"),
            )
        except ValueError as exc:
            raise serializers.ValidationError({"rental_type": str(exc)}) from exc

        date_errors = services.validate_booking_dates(
            property_obj,
            rental_type,
            start_date,
            end_date,
        )
        if date_errors:
            raise serializers.ValidationError(date_errors)

        overlap_errors = services.validate_no_overlap(
            property_obj.pk,
            start_date,
            end_date,
        )
        if overlap_errors:
            raise serializers.ValidationError(overlap_errors)

        data["resolved_rental_type"] = rental_type
        return data

    def create(self, validated_data):
        property_obj = validated_data["property"]
        renter = self.context["request"].user
        rental_type = validated_data["resolved_rental_type"]
        start_date = validated_data["start_date"]
        end_date = validated_data.get("end_date")

        try:
            return services.create_booking(
                renter=renter,
                property_id=property_obj.pk,
                rental_type=rental_type,
                start_date=start_date,
                end_date=end_date,
            )
        except ValueError as exc:
            raise serializers.ValidationError({"non_field_errors": [str(exc)]}) from exc


class BookingSerializer(serializers.ModelSerializer):
    listing_type = serializers.CharField(source="property.listing_type", read_only=True)
    property_name = serializers.CharField(source="property.property_name", read_only=True)
    renter_email = serializers.EmailField(source="renter.email", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "booking_reference",
            "property",
            "property_name",
            "listing_type",
            "renter",
            "renter_email",
            "rental_type",
            "start_date",
            "end_date",
            "base_price",
            "security_deposit",
            "currency",
            "platform_commission_rate",
            "platform_fee_amount",
            "owner_payout_amount",
            "total_amount",
            "recipient_owner",
            "recipient_company",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["status"]

    def validate_status(self, value):
        booking = self.instance
        if value == Booking.BookingStatus.CONFIRMED:
            raise serializers.ValidationError("Bookings are confirmed only by successful payment verification.")
        if value == Booking.BookingStatus.REJECTED:
            if booking.status != Booking.BookingStatus.PENDING:
                raise serializers.ValidationError("Only pending bookings can be rejected.")
        elif value == Booking.BookingStatus.CANCELLED:
            if booking.status not in {Booking.BookingStatus.PENDING, Booking.BookingStatus.CONFIRMED}:
                raise serializers.ValidationError("Only pending or confirmed bookings can be cancelled.")
        else:
            raise serializers.ValidationError("Only rejection or cancellation is available through this endpoint.")
        return value
