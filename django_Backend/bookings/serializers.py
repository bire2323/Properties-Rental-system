from rest_framework import serializers
from django.utils import timezone

from properties.models import Property, ListingType
from accounts.models import User
from .models import Booking, BookingAuditEvent, BookingApplicantDetails, BookingApplicantDocument
from . import services
from .permissions import _user_manages_property


class BookingApplicantDocumentSerializer(serializers.ModelSerializer):
    """Read-only serialized identity document."""
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = BookingApplicantDocument
        fields = [
            "id",
            "document_type",
            "original_filename",
            "document_url",
            "uploaded_at",
        ]
        read_only_fields = fields

    def get_document_url(self, obj):
        request = self.context.get("request")
        if obj.document:
            rel = f"/api/bookings/documents/{obj.pk}/"
            return request.build_absolute_uri(rel) if request else rel
        return ""


class BookingApplicantDetailsSerializer(serializers.ModelSerializer):
    """Nested applicant information embedded in a booking payload."""

    documents = BookingApplicantDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = BookingApplicantDetails
        fields = [
            "id",
            "contact_name",
            "contact_phone",
            "contact_email",
            "date_of_birth",
            "gender",
            "id_type",
            "id_number",
            "emergency_name",
            "emergency_phone",
            "emergency_relationship",
            "number_of_tenants",
            "pickup_time",
            "return_time",
            "pickup_purpose",
            "information_confirmed",
            "terms_accepted",
            "documents",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class BookingApplicantDetailsCreateSerializer(serializers.ModelSerializer):
    """Writable applicant details for the booking creation endpoint."""

    class Meta:
        model = BookingApplicantDetails
        fields = [
            "contact_name",
            "contact_phone",
            "contact_email",
            "date_of_birth",
            "gender",
            "id_type",
            "id_number",
            "emergency_name",
            "emergency_phone",
            "emergency_relationship",
            "number_of_tenants",
            "pickup_time",
            "return_time",
            "pickup_purpose",
            "information_confirmed",
            "terms_accepted",
        ]

    def validate_date_of_birth(self, value):
        if value is None:
            return value
        today = timezone.localdate()
        if value > today:
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def validate_number_of_tenants(self, value):
        if value is None:
            return value
        try:
            value = int(value)
        except (TypeError, ValueError):
            raise serializers.ValidationError("Number of tenants must be a valid whole number.")
        if value < 1:
            raise serializers.ValidationError("Number of tenants must be at least 1.")
        if value > 100:
            raise serializers.ValidationError("Number of tenants cannot exceed 100.")
        return value

    def validate_contact_phone(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Contact phone is required.")
        if len(value) > 50:
            raise serializers.ValidationError("Contact phone is too long.")
        return value

    def validate_id_number(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("ID number is required.")
        if len(value) > 255:
            raise serializers.ValidationError("ID number is too long.")
        return value

    def validate_id_type(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("ID type is required.")
        return value

    def validate_contact_email(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Contact email is required.")
        return value


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
    applicant_details = BookingApplicantDetailsCreateSerializer(
        required=False,
        allow_null=True,
    )

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

        # Cross-field applicant validation driven by the listing type.
        applicant = data.get("applicant_details")
        if applicant is not None:
            self._validate_applicant(property_obj, applicant)

        data["resolved_rental_type"] = rental_type
        return data

    def _validate_applicant(self, property_obj, applicant):
        errors = {}

        id_type = (applicant.get("id_type") or "").strip()
        if not id_type:
            errors["id_type"] = "ID type is required."

        id_number = (applicant.get("id_number") or "").strip()
        if not id_number:
            errors["id_number"] = "ID number is required."

        email = (applicant.get("contact_email") or "").strip()
        if not email:
            errors["contact_email"] = "Contact email is required."

        phone = (applicant.get("contact_phone") or "").strip()
        if not phone:
            errors["contact_phone"] = "Contact phone is required."

        name = (applicant.get("contact_name") or "").strip()
        if not name:
            errors["contact_name"] = "Contact name is required."

        terms = applicant.get("terms_accepted") is True
        confirmed = applicant.get("information_confirmed") is True
        if not confirmed or not terms:
            errors["non_field_errors"] = errors.get("non_field_errors", [])
            if not confirmed:
                errors["non_field_errors"].append("Information must be confirmed.")
            if not terms:
                errors["non_field_errors"].append("Terms must be accepted.")

        # Vehicle (car) bookings require pickup/return time fields.
        if property_obj.listing_type == ListingType.CAR:
            if not applicant.get("pickup_time"):
                errors["pickup_time"] = "Pickup time is required for vehicle bookings."
            if not applicant.get("return_time"):
                errors["return_time"] = "Return time is required for vehicle bookings."
            pickup_purpose = applicant.get("pickup_purpose") or ""
            if not pickup_purpose.strip():
                errors["pickup_purpose"] = "Rental purpose is required for vehicle bookings."

        if errors:
            raise serializers.ValidationError({"applicant_details": errors})

    def create(self, validated_data, **kwargs):
        property_obj = validated_data["property"]
        renter = self.context["request"].user
        rental_type = validated_data["resolved_rental_type"]
        start_date = validated_data["start_date"]
        end_date = validated_data.get("end_date")
        applicant_data = validated_data.get("applicant_details")
        # DRF's Serializer.save(**kwargs) merges extra kwargs into
        # validated_data rather than passing them to create(), so the
        # applicant documents arrive inside validated_data.
        applicant_documents = (
            validated_data.pop("applicant_documents", None)
            or kwargs.get("applicant_documents")
            or []
        )

        try:
            return services.create_booking(
                renter=renter,
                property_id=property_obj.pk,
                rental_type=rental_type,
                start_date=start_date,
                end_date=end_date,
                applicant_data=applicant_data,
                applicant_documents=applicant_documents,
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

    applicant_details = BookingApplicantDetailsSerializer(read_only=True)
    property_image = serializers.SerializerMethodField()

    def get_property_image(self, obj):
        value = obj.property_image
        if not value:
            image = obj.property.images.first()
            if image:
                value = image.image.url
        return value or ""

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
            "property_image",
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
            "applicant_details",
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
