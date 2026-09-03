from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import Q

from accounts.models import User
from properties.models import Property

from .models import Booking
from .permissions import BookingPermission, _user_manages_property
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingStatusUpdateSerializer,
)


class BookingViewSet(viewsets.ModelViewSet):
    """
    Booking API.

    POST   /api/bookings/          — create booking (renter = authenticated user)
    GET    /api/bookings/          — list bookings visible to the user
    GET    /api/bookings/{id}/     — retrieve booking
    PATCH  /api/bookings/{id}/     — update status (owner/admin)
    DELETE /api/bookings/{id}/     — cancel pending booking (renter/admin)
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
        )

        if user.role == User.Role.ADMIN:
            return queryset

        managed_property_ids = Property.objects.filter(
            Q(owner=user) | Q(company__managers=user)
        ).values_list("pk", flat=True)

        return queryset.filter(
            Q(renter=user) | Q(property_id__in=managed_property_ids)
        ).distinct()

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
            booking.status = Booking.BookingStatus.CANCELLED
            booking.save(update_fields=["status", "updated_at"])
            return Response(status=status.HTTP_204_NO_CONTENT)
        if request.user.role == User.Role.ADMIN:
            return Response(
                {"detail": "Booking history cannot be deleted; change its status instead."},
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
            )
        return Response({"detail": "Only the renter can cancel this booking."}, status=status.HTTP_403_FORBIDDEN)
