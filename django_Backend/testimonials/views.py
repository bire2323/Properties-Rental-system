from django.db.models import Exists, OuterRef, Q, Subquery
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from bookings.models import Booking
from interactions.models import PropertyRating

from .models import Testimonial
from .serializers import (
    TestimonialAdminSerializer,
    TestimonialPublicSerializer,
)
from .services import TestimonialModerationError, moderate_testimonial

VERIFIED_RENTER_STATUSES = ["approved", "confirmed", "completed"]


def _annotate_testimonial_queryset(queryset):
    """Annotate rating + verified-renter flag to avoid N+1 queries.

    `_rating` reads the user's star rating for the reviewed property from
    `interactions.PropertyRating`; `_is_verified` proves a real booking.
    """
    return queryset.annotate(
        _rating=Subquery(
            PropertyRating.objects.filter(
                property_id=OuterRef("review__property_id"),
                user_id=OuterRef("review__user_id"),
            ).values("rating")[:1]
        ),
        _is_verified=Exists(
            Booking.objects.filter(
                property_id=OuterRef("review__property_id"),
                renter_id=OuterRef("review__user_id"),
                status__in=VERIFIED_RENTER_STATUSES,
            )
        ),
        _booking_ref=Subquery(
            Booking.objects.filter(
                property_id=OuterRef("review__property_id"),
                renter_id=OuterRef("review__user_id"),
            )
            .order_by("-created_at")
            .values("booking_reference")[:1]
        ),
        _booking_status=Subquery(
            Booking.objects.filter(
                property_id=OuterRef("review__property_id"),
                renter_id=OuterRef("review__user_id"),
            )
            .order_by("-created_at")
            .values("status")[:1]
        ),
    )


def _is_admin(request):
    return (
        request.user
        and request.user.is_authenticated
        and request.user.role == User.Role.ADMIN
    )


def _admin_base_queryset():
    return (
        Testimonial.objects.select_related(
            "review",
            "review__user",
            "review__user__profile",
            "review__property",
            "approved_by",
        )
        .prefetch_related("review__property__images")
    )


def _admin_queryset(request):
    return _annotate_testimonial_queryset(_admin_base_queryset())


def _permission_denied():
    return Response(
        {"detail": "You do not have permission to access this resource."},
        status=status.HTTP_403_FORBIDDEN,
    )


class TestimonialListAPIView(APIView):
    """Public homepage testimonials — approved (and therefore published) only."""

    permission_classes = [AllowAny]

    def get(self, request):
        queryset = (
            Testimonial.objects.filter(status=Testimonial.Status.APPROVED)
            .select_related(
                "review",
                "review__user",
                "review__user__profile",
                "review__property",
            )
            .prefetch_related("review__property__images")
            .order_by(
                "-is_featured",
                "display_order",
                "-approved_at",
                "-created_at",
            )
        )
        queryset = _annotate_testimonial_queryset(queryset)
        return Response(TestimonialPublicSerializer(queryset, many=True).data)


class AdminTestimonialListAPIView(APIView):
    """Admin moderation queue with status/feature/search filters + pagination."""

    def get(self, request):
        if not _is_admin(request):
            return _permission_denied()

        queryset = _admin_queryset(request)
        params = request.query_params

        counts = {
            "all": queryset.count(),
            "pending": queryset.filter(status=Testimonial.Status.PENDING).count(),
            "approved": queryset.filter(status=Testimonial.Status.APPROVED).count(),
            "rejected": queryset.filter(status=Testimonial.Status.REJECTED).count(),
            "hidden": queryset.filter(status=Testimonial.Status.HIDDEN).count(),
            "featured": queryset.filter(is_featured=True).count(),
        }

        status_filter = (params.get("status") or "").strip().lower()
        if status_filter in Testimonial.Status.values:
            queryset = queryset.filter(status=status_filter)

        featured_filter = (params.get("featured") or "").strip().lower()
        if featured_filter == "true":
            queryset = queryset.filter(is_featured=True)
        elif featured_filter == "false":
            queryset = queryset.filter(is_featured=False)

        search = (params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(review__user_name__icontains=search)
                | Q(review__user__email__icontains=search)
                | Q(review__property__property_name__icontains=search)
                | Q(review__review_text__icontains=search)
            )

        try:
            page = max(1, int(params.get("page", 1)))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = min(100, max(1, int(params.get("page_size", 20))))
        except (TypeError, ValueError):
            page_size = 20

        ordering = (params.get("ordering") or "").strip()
        if ordering == "oldest":
            queryset = queryset.order_by("created_at")
        elif ordering == "rating_high":
            queryset = queryset.order_by("-rating")
        elif ordering == "rating_low":
            queryset = queryset.order_by("rating")
        else:
            queryset = queryset.order_by("-created_at")

        total_count = queryset.count()
        page_qs = list(queryset[(page - 1) * page_size : page * page_size])

        serializer = TestimonialAdminSerializer(page_qs, many=True)

        return Response(
            {
                "results": serializer.data,
                "counts": counts,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": (total_count + page_size - 1) // page_size,
            },
            status=status.HTTP_200_OK,
        )


class AdminTestimonialDetailAPIView(APIView):
    """Admin viewing + moderation (approve / reject / hide / feature / order)."""

    def _get_testimonial(self, request, testimonial_id):
        if not _is_admin(request):
            return None, _permission_denied()
        try:
            obj = _admin_base_queryset().get(pk=testimonial_id)
        except Testimonial.DoesNotExist:
            return None, Response(
                {"detail": "Testimonial not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return obj, None

    def get(self, request, testimonial_id):
        obj, error_response = self._get_testimonial(request, testimonial_id)
        if error_response is not None:
            return error_response
        obj = _annotate_testimonial_queryset(
            Testimonial.objects.filter(pk=obj.pk)
        ).get()
        return Response(TestimonialAdminSerializer(obj).data, status=status.HTTP_200_OK)

    def patch(self, request, testimonial_id):
        obj, error_response = self._get_testimonial(request, testimonial_id)
        if error_response is not None:
            return error_response

        payload = request.data if isinstance(request.data, dict) else {}
        try:
            updated = moderate_testimonial(
                obj,
                actor=request.user,
                request=request,
                status=payload.get("status"),
                is_featured=payload.get("is_featured"),
                display_order=payload.get("display_order"),
                admin_note=payload.get("admin_note"),
            )
        except TestimonialModerationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        updated.refresh_from_db()
        annotated = _annotate_testimonial_queryset(
            Testimonial.objects.filter(pk=updated.pk)
        ).get()
        return Response(
            TestimonialAdminSerializer(annotated).data, status=status.HTTP_200_OK
        )