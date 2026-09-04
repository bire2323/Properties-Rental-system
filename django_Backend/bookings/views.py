from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connection, transaction
from django.db.models import Q, Count, OuterRef, Subquery, Sum

from accounts.models import User
from properties.models import Property

from .models import Booking
from .permissions import BookingPermission, _user_manages_property
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingStatusUpdateSerializer,
    AdminBookingActionSerializer,
    BookingAuditEventSerializer,
)


class BookingViewSet(viewsets.ModelViewSet):
    """
    Booking API.

    POST   /api/bookings/          — create booking (renter = authenticated user)
    GET    /api/bookings/          — list bookings visible to the user (admins see all)
    GET    /api/bookings/{id}/     — retrieve booking
    PATCH  /api/bookings/{id}/     — update status (owner/admin)
    DELETE /api/bookings/{id}/     — cancel pending booking (renter/admin)

    Admin-only exceptional actions:
    POST   /api/bookings/{id}/admin/cancel/    — admin cancellation (reason required)
    POST   /api/bookings/{id}/admin/expire/    — admin expiry (reason required)
    POST   /api/bookings/{id}/admin/complete/  — admin completion (reason required)
    GET    /api/bookings/{id}/audit/           — audit history
    GET    /api/bookings/admin/reports/        — booking administrative statistics
    """

    permission_classes = [BookingPermission]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user

        queryset = Booking.objects.select_related(
            "property",
            "property__company",
            "renter",
            "recipient_owner",
            "recipient_company",
        ).prefetch_related("payment_transactions")

        # Payment annotations: the "latest" payment is deterministic (newest
        # by created_at, then id). Attempt count counts every transaction row.
        from payments.models import PaymentTransaction

        latest_qs = PaymentTransaction.objects.filter(booking=OuterRef("pk")).order_by("-created_at", "-id")
        queryset = queryset.annotate(
            payment_attempt_count=Count("payment_transactions", distinct=True),
            latest_payment_status=Subquery(latest_qs.values("status")[:1]),
            latest_payment_method=Subquery(latest_qs.values("payment_method")[:1]),
            latest_payment_reference=Subquery(latest_qs.values("transaction_reference")[:1]),
            latest_payment_provider_reference=Subquery(latest_qs.values("provider_reference")[:1]),
            latest_payment_created_at=Subquery(latest_qs.values("created_at")[:1]),
        )

        queryset = queryset.order_by("-created_at", "-id")

        if user.role == User.Role.ADMIN:
            queryset = self._apply_admin_filters(queryset)
            return queryset

        managed_property_ids = Property.objects.filter(
            Q(owner=user) | Q(company__managers=user)
        ).values_list("pk", flat=True)

        return queryset.filter(
            Q(renter=user) | Q(property_id__in=managed_property_ids)
        ).distinct()

    def _apply_admin_filters(self, queryset):
        params = self.request.query_params

        status_value = params.get("status")
        if status_value:
            queryset = queryset.filter(status=status_value)

        listing_type = params.get("listing_type")
        if listing_type:
            queryset = queryset.filter(property__listing_type=listing_type)

        rental_type = params.get("rental_type")
        if rental_type:
            queryset = queryset.filter(rental_type=rental_type)

        property_id = params.get("property")
        if property_id and property_id.isdigit():
            queryset = queryset.filter(property_id=int(property_id))

        renter = params.get("renter")
        if renter and renter.isdigit():
            queryset = queryset.filter(renter_id=int(renter))

        owner = params.get("owner") or params.get("recipient")
        if owner and owner.isdigit():
            queryset = queryset.filter(
                Q(recipient_owner_id=int(owner)) | Q(property__owner_id=int(owner))
            )

        start_from = params.get("start_date_from")
        if start_from:
            queryset = queryset.filter(start_date__gte=start_from)

        start_to = params.get("start_date_to")
        if start_to:
            queryset = queryset.filter(start_date__lte=start_to)

        end_from = params.get("end_date_from")
        if end_from:
            queryset = queryset.filter(end_date__isnull=False).filter(end_date__gte=end_from)

        end_to = params.get("end_date_to")
        if end_to:
            queryset = queryset.filter(end_date__isnull=False).filter(end_date__lte=end_to)

        search = params.get("search")
        if search:
            queryset = queryset.filter(booking_reference__icontains=search.strip())

        payment_status = params.get("payment_status")
        if payment_status:
            from payments.models import PaymentTransaction

            latest_status_qs = (
                PaymentTransaction.objects.filter(booking=OuterRef("pk"))
                .order_by("-created_at", "-id")
                .values("status")[:1]
            )
            queryset = queryset.annotate(
                _latest_payment_status=Subquery(latest_status_qs)
            ).filter(_latest_payment_status=payment_status)

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        if self.action in ("partial_update", "update"):
            return BookingStatusUpdateSerializer
        return BookingSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        output = BookingSerializer(booking, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        booking = self.get_object()
        if not _user_manages_property(request.user, booking.property) and request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "Only the property owner or an admin can update booking status."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(booking, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BookingSerializer(booking, context={"request": request}).data)

    def destroy(self, request, *args, **kwargs):
        booking = self.get_object()
        if request.user.role == User.Role.ADMIN:
            with transaction.atomic():
                with connection.cursor() as schema_cursor:
                    notification_columns = {
                        column.name
                        for column in connection.introspection.get_table_description(
                            schema_cursor, "accounts_notification"
                        )
                    }
                if "booking_id" in notification_columns:
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "UPDATE accounts_notification SET booking_id = NULL WHERE booking_id = %s",
                            [booking.pk],
                        )
                booking.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        if booking.renter_id == request.user.pk:
            cancellable = {
                Booking.BookingStatus.PENDING,
                Booking.BookingStatus.APPROVED,
            }
            if booking.status not in cancellable:
                return Response(
                    {"detail": "Only pending or approved bookings awaiting payment can be cancelled by the renter."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            previous_status = booking.status
            with transaction.atomic():
                booking.status = Booking.BookingStatus.CANCELLED
                booking.save(update_fields=["status", "updated_at"])
                _record_admin_audit(
                    booking, "cancelled", request.user, previous_status, booking.status,
                    "",  # renter cancellation has no reason
                )
                _notify_and_email_cancelled(booking, cancelled_for="tenant", reason="")
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Only the renter can cancel this booking."}, status=status.HTTP_403_FORBIDDEN)

    # ─── ADMIN EXCEPTIONAL ACTIONS ────────────────────────────────────────

    def _admin_only(self):
        user = self.request.user
        if not user or user.role != User.Role.ADMIN:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def _require_action_reason(self, request):
        serializer = AdminBookingActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data.get("reason", "")

    @action(detail=True, methods=["post"], url_path="admin/cancel")
    def admin_cancel(self, request, *args, **kwargs):
        forbidden = self._admin_only()
        if forbidden:
            return forbidden

        booking = self.get_object()
        reason = self._require_action_reason(request)

        cancellable = {
            Booking.BookingStatus.PENDING,
            Booking.BookingStatus.APPROVED,
            Booking.BookingStatus.CONFIRMED,
        }
        if booking.status not in cancellable:
            return Response(
                {"detail": f"Booking in '{booking.status}' status cannot be cancelled by an admin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_status = booking.status
        with transaction.atomic():
            booking.status = Booking.BookingStatus.CANCELLED
            booking.save(update_fields=["status", "updated_at"])
            _record_admin_audit(
                booking, "cancelled", request.user, previous_status, booking.status,
                reason,
            )
            _notify_and_email_cancelled(booking, cancelled_for="owner", reason=reason)
        return Response({"detail": "Booking cancelled.", "status": booking.status})

    @action(detail=True, methods=["post"], url_path="admin/expire")
    def admin_expire(self, request, *args, **kwargs):
        forbidden = self._admin_only()
        if forbidden:
            return forbidden

        booking = self.get_object()
        reason = self._require_action_reason(request)

        if booking.status not in {Booking.BookingStatus.PENDING, Booking.BookingStatus.APPROVED}:
            return Response(
                {"detail": f"Booking in '{booking.status}' status cannot be expired by an admin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_status = booking.status
        with transaction.atomic():
            booking.status = Booking.BookingStatus.EXPIRED
            booking.save(update_fields=["status", "updated_at"])
            _record_admin_audit(
                booking, "expired", request.user, previous_status, booking.status,
                reason,
            )
            _notify_and_email_expired(booking)
        return Response({"detail": "Booking marked as expired.", "status": booking.status})

    @action(detail=True, methods=["post"], url_path="admin/complete")
    def admin_complete(self, request, *args, **kwargs):
        forbidden = self._admin_only()
        if forbidden:
            return forbidden

        booking = self.get_object()
        reason = self._require_action_reason(request)

        if booking.status not in {Booking.BookingStatus.CONFIRMED, Booking.BookingStatus.APPROVED}:
            return Response(
                {"detail": f"Booking in '{booking.status}' status cannot be completed by an admin."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_status = booking.status
        with transaction.atomic():
            booking.status = Booking.BookingStatus.COMPLETED
            booking.save(update_fields=["status", "updated_at"])
            _record_admin_audit(
                booking, "completed", request.user, previous_status, booking.status,
                reason,
            )
            _notify_and_email_completed(booking)
        return Response({"detail": "Booking marked as completed.", "status": booking.status})

    @action(detail=True, methods=["get"])
    def audit(self, request, *args, **kwargs):
        booking = self.get_object()
        events = (
            booking.audit_events
            .select_related("actor")
            .order_by("-created_at", "-id")
        )
        serializer = BookingAuditEventSerializer(events, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="admin/reports")
    def admin_reports(self, request, *args, **kwargs):
        forbidden = self._admin_only()
        if forbidden:
            return forbidden

        queryset = Booking.objects.all()

        listing_type = request.query_params.get("listing_type")
        if listing_type:
            queryset = queryset.filter(property__listing_type=listing_type)

        start_from = request.query_params.get("start_date_from")
        if start_from:
            queryset = queryset.filter(start_date__gte=start_from)

        start_to = request.query_params.get("start_date_to")
        if start_to:
            queryset = queryset.filter(start_date__lte=start_to)

        created_from = request.query_params.get("created_from")
        if created_from:
            queryset = queryset.filter(created_at__date__gte=created_from)

        created_to = request.query_params.get("created_to")
        if created_to:
            queryset = queryset.filter(created_at__date__lte=created_to)

        total = queryset.count()

        def status_count(name):
            return queryset.filter(status=name).count()

        aggregates = queryset.aggregate(
            revenue=Sum("total_amount"),
            platform_fee=Sum("platform_fee_amount"),
            owner_payout=Sum("owner_payout_amount"),
        )

        from payments.models import PaymentTransaction

        payment_statuses = {
            key: PaymentTransaction.objects.filter(
                booking__in=queryset, status=key
            ).count()
            for key in PaymentTransaction.PaymentStatus.values
        }

        return Response(
            {
                "total_bookings": total,
                "by_status": {
                    "pending": status_count(Booking.BookingStatus.PENDING),
                    "approved": status_count(Booking.BookingStatus.APPROVED),
                    "confirmed": status_count(Booking.BookingStatus.CONFIRMED),
                    "rejected": status_count(Booking.BookingStatus.REJECTED),
                    "cancelled": status_count(Booking.BookingStatus.CANCELLED),
                    "completed": status_count(Booking.BookingStatus.COMPLETED),
                    "expired": status_count(Booking.BookingStatus.EXPIRED),
                },
                "financial_totals": {
                    "total_amount": _to_number(aggregates["revenue"]),
                    "platform_fee": _to_number(aggregates["platform_fee"]),
                    "owner_payout": _to_number(aggregates["owner_payout"]),
                },
                "payments": {
                    "payment_transaction_count": PaymentTransaction.objects.filter(
                        booking__in=queryset
                    ).count(),
                    "by_status": payment_statuses,
                },
            },
            status=status.HTTP_200_OK,
        )


def _to_number(value):
    if value is None:
        return 0.0
    return float(value)


def _record_admin_audit(booking, action, actor, previous_status, new_status, reason):
    from .services import record_audit_event

    record_audit_event(
        booking=booking,
        action=action,
        actor=actor,
        previous_status=previous_status,
        new_status=new_status,
        reason=reason,
        metadata={},
    )


def _notify_and_email_cancelled(booking, *, cancelled_for, reason):
    from .email_service import send_booking_cancelled_email
    from .notifications import create_booking_notification

    try:
        send_booking_cancelled_email(
            booking,
            cancelled_for=cancelled_for,
            reason=reason,
        )
    except Exception:
        pass
    try:
        create_booking_notification(
            booking=booking,
            title="Booking cancelled",
            details=f"Booking {booking.booking_reference} was cancelled.",
            info="Booking cancelled",
            sender=None,
        )
    except Exception:
        pass


def _notify_and_email_expired(booking):
    from .email_service import send_booking_expired_email
    from .notifications import create_booking_notification

    try:
        send_booking_expired_email(booking)
    except Exception:
        pass
    try:
        create_booking_notification(
            booking=booking,
            title="Booking expired",
            details=f"Booking {booking.booking_reference} expired without payment.",
            info="Booking expired",
            sender=None,
        )
    except Exception:
        pass


def _notify_and_email_completed(booking):
    from .email_service import send_booking_completed_email
    from .notifications import create_booking_notification

    try:
        send_booking_completed_email(booking)
    except Exception:
        pass
    try:
        create_booking_notification(
            booking=booking,
            title="Booking completed",
            details=f"Booking {booking.booking_reference} was completed.",
            info="Booking completed",
            sender=None,
        )
    except Exception:
        pass
