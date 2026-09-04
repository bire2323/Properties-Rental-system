from rest_framework import serializers
from django.utils import timezone

from properties.models import Property, ListingType
from accounts.models import User
from .models import Booking, BookingAuditEvent
from . import services
from .permissions import _user_manages_property


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
    renter_name = serializers.CharField(source="renter.get_full_name", read_only=True)

    property_address = serializers.CharField(source="property.address", read_only=True)
    property_city = serializers.CharField(source="property.city.name", read_only=True, default="")
    property_region = serializers.CharField(source="property.region.name", read_only=True, default="")
    property_is_available = serializers.BooleanField(source="property.is_available", read_only=True)
    property_status = serializers.CharField(source="property.status", read_only=True)
    property_owner_email = serializers.EmailField(source="property.owner.email", read_only=True)
    property_company_name = serializers.CharField(source="property.company.name", read_only=True, default="")

    recipient_owner_email = serializers.EmailField(source="recipient_owner.email", read_only=True, default="")
    recipient_company_name = serializers.CharField(source="recipient_company.name", read_only=True, default="")

    # Annotated payment fields (see BookingViewSet.get_queryset)
    payment_attempt_count = serializers.IntegerField(read_only=True, default=0)
    latest_payment_status = serializers.CharField(read_only=True, allow_null=True, required=False)
    latest_payment_method = serializers.CharField(read_only=True, allow_null=True, required=False)
    latest_payment_reference = serializers.CharField(read_only=True, allow_null=True, required=False)
    latest_payment_provider_reference = serializers.CharField(read_only=True, allow_null=True, required=False)
    latest_payment_created_at = serializers.DateTimeField(read_only=True, allow_null=True, required=False)

    latest_payment_status_display = serializers.SerializerMethodField()
    latest_payment_method_display = serializers.SerializerMethodField()

    def get_latest_payment_status_display(self, obj):
        value = getattr(obj, "latest_payment_status", None)
        if not value:
            return ""
        try:
            from payments.models import PaymentTransaction

            return dict(PaymentTransaction.PaymentStatus.choices).get(value, value)
        except Exception:
            return value

    def get_latest_payment_method_display(self, obj):
        value = getattr(obj, "latest_payment_method", None)
        if not value:
            return ""
        try:
            from payments.models import PaymentTransaction

            return dict(PaymentTransaction.PaymentMethod.choices).get(value, value)
        except Exception:
            return value

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
            "renter_name",
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
            "recipient_owner_email",
            "recipient_company",
            "recipient_company_name",
            "status",
            "property_address",
            "property_city",
            "property_region",
            "property_is_available",
            "property_status",
            "property_owner_email",
            "property_company_name",
            "payment_attempt_count",
            "latest_payment_status",
            "latest_payment_status_display",
            "latest_payment_method",
            "latest_payment_method_display",
            "latest_payment_reference",
            "latest_payment_provider_reference",
            "latest_payment_created_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["status"]

    def _requester_may_approve(self, booking):
        """Owner/company manager or admin may approve a pending booking."""
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == User.Role.ADMIN:
            return True
        return _user_manages_property(request.user, booking.property)

    def validate_status(self, value):
        booking = self.instance
        if value == Booking.BookingStatus.APPROVED:
            # The owner/manager's approval step: PENDING -> APPROVED. Adjusting
            # this endpoint to APPROVED (still awaiting payment) rather than
            # CONFIRMED, so CONFIRMED is reserved for verified payment only.
            if booking.status != Booking.BookingStatus.PENDING:
                raise serializers.ValidationError("Only pending bookings can be approved.")
            if not self._requester_may_approve(booking):
                raise serializers.ValidationError(
                    "Only the property owner, a company manager, or an admin can approve a booking."
                )
            return value
        if value == Booking.BookingStatus.CONFIRMED:
            # CONFIRMED is never settable through this endpoint; it is produced
            # exclusively by services.confirm_booking_from_payment after a
            # verified payment on an APPROVED booking.
            raise serializers.ValidationError(
                "Bookings are confirmed only by successful payment verification on an approved booking."
            )
        if value == Booking.BookingStatus.REJECTED:
            if booking.status != Booking.BookingStatus.PENDING:
                raise serializers.ValidationError("Only pending bookings can be rejected.")
        elif value == Booking.BookingStatus.CANCELLED:
            cancellable = {
                Booking.BookingStatus.PENDING,
                Booking.BookingStatus.APPROVED,
                Booking.BookingStatus.CONFIRMED,
            }
            if booking.status not in cancellable:
                raise serializers.ValidationError(
                    "Only pending, approved or confirmed bookings can be cancelled."
                )
        else:
            raise serializers.ValidationError(
                "Only approval, rejection or cancellation is available through this endpoint."
            )
        return value

    def update(self, instance, validated_data):
        from .services import record_audit_event
        from .email_service import (
            send_booking_approved_email,
            send_booking_rejected_email,
            send_booking_cancelled_email,
        )
        from .notifications import create_booking_notification as notify

        previous_status = instance.status
        new_status = validated_data.get("status", instance.status)
        request = self.context.get("request", None)
        actor = request.user if request and request.user.is_authenticated else None

        if new_status == previous_status:
            # No-op status update; never resend emails/notifications.
            return instance

        instance.status = new_status
        instance.save(update_fields=["status", "updated_at"])

        record_audit_event(
            booking=instance,
            action="approved" if new_status == Booking.BookingStatus.APPROVED
            else "rejected" if new_status == Booking.BookingStatus.REJECTED
            else "cancelled",
            actor=actor,
            previous_status=previous_status,
            new_status=new_status,
            reason="",
            metadata={},
        )

        # Emails and in-app notifications are separate concerns from the audit
        # trail. Never let them raise and break a committed status change.
        try:
            if new_status == Booking.BookingStatus.APPROVED:
                send_booking_approved_email(instance)
                notify(
                    booking=instance,
                    title="Booking approved",
                    details=f"Booking {instance.booking_reference} was approved.",
                    info="Booking status update",
                    sender=actor,
                )
            elif new_status == Booking.BookingStatus.REJECTED:
                send_booking_rejected_email(instance, reason="")
                notify(
                    booking=instance,
                    title="Booking rejected",
                    details=f"Booking {instance.booking_reference} was rejected.",
                    info="Booking status update",
                    sender=actor,
                )
            elif new_status == Booking.BookingStatus.CANCELLED:
                send_booking_cancelled_email(instance, cancelled_for="owner", reason="")
                notify(
                    booking=instance,
                    title="Booking cancelled",
                    details=f"Booking {instance.booking_reference} was cancelled.",
                    info="Booking status update",
                    sender=actor,
                )
        except Exception:
            pass
        return instance


class AdminBookingActionSerializer(serializers.Serializer):
    reason = serializers.CharField(allow_blank=False, trim_whitespace=True)

    def validate_reason(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("A reason is required.")
        if len(value) < 3:
            raise serializers.ValidationError("Reason must be at least 3 characters.")
        if len(value) > 1000:
            raise serializers.ValidationError("Reason must be 1000 characters or fewer.")
        return value


class BookingAuditEventSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True, default="")
    actor_name = serializers.CharField(source="actor.get_full_name", read_only=True, default="")

    class Meta:
        model = BookingAuditEvent
        fields = [
            "id",
            "booking_reference",
            "action",
            "previous_status",
            "new_status",
            "reason",
            "metadata",
            "actor",
            "actor_role",
            "actor_email",
            "actor_name",
            "created_at",
        ]
        read_only_fields = fields
