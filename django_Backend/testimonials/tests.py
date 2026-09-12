from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from audit.models import AuditLog
from bookings.models import Booking
from interactions.models import PropertyRating
from properties.models import ListingType, ListingStatus, Property, RentalUnit
from Review.models import Review
from site_settings.models import SiteSettings

from .models import Testimonial


def make_user(email, role=None, first="Test", last="User"):
    return User.objects.create_user(
        email,
        password="pass12345",
        role=role or User.Role.TENANT,
        first_name=first,
        last_name=last,
    )


class TestimonialTestCase(TestCase):
    def setUp(self):
        SiteSettings.objects.create(
            site_name="Test", house_commission_percent=Decimal("5.00")
        )
        self.admin = make_user("admin@x.com", User.Role.ADMIN, "Admin", "One")
        self.owner = make_user("owner@x.com", User.Role.OWNER, "Owner", "One")
        self.renter = make_user("renter@x.com", None, "Jane", "Doe")
        self.other = make_user("other@x.com", None, "Other", "User")

        self.property_obj = Property.objects.create(
            owner=self.owner,
            property_name="Modern 2 Bedroom Apartment",
            description="Nice place",
            listing_type=ListingType.HOUSE,
            price=Decimal("15000.00"),
            rental_unit=RentalUnit.MONTHLY,
            currency="ETB",
            status=ListingStatus.ACTIVE,
            is_available=True,
        )

        self.review = Review.objects.create(
            property=self.property_obj,
            user=self.renter,
            user_name="Jane Doe",
            user_email="renter@x.com",
            review_text="Very smooth booking experience and the home was spotless.",
        )
        self.testimonial = Testimonial.objects.create(
            review=self.review, status=Testimonial.Status.PENDING
        )

    def _create_booking(self, renter=None, status=None):
        start = date.today() - timedelta(days=30)
        end = start + timedelta(days=10)
        return Booking.objects.create(
            property=self.property_obj,
            renter=renter or self.renter,
            rental_type=Booking.RentalType.FIXED_TERM,
            start_date=start,
            end_date=end,
            base_price=Decimal("5000.00"),
            security_deposit=Decimal("0.00"),
            currency="ETB",
            platform_commission_rate=Decimal("5.00"),
            platform_fee_amount=Decimal("250.00"),
            owner_payout_amount=Decimal("4750.00"),
            total_amount=Decimal("5000.00"),
            recipient_owner=self.owner,
            status=status or Booking.BookingStatus.APPROVED,
        )

    def _admin_client(self):
        client = APIClient()
        client.force_authenticate(user=self.admin)
        return client

    def _renter_client(self):
        client = APIClient()
        client.force_authenticate(user=self.renter)
        return client


class PublicTestimonialAPITests(TestimonialTestCase):
    def test_pending_not_public(self):
        self.testimonial.status = Testimonial.Status.APPROVED
        self.testimonial.save()
        self.testimonial.status = Testimonial.Status.PENDING
        self.testimonial.save()
        response = self.client.get("/api/testimonials/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_only_approved_are_published(self):
        response = self.client.get("/api/testimonials/")
        self.assertEqual(response.data, [])

        self.testimonial.status = Testimonial.Status.APPROVED
        self.testimonial.save()
        self.testimonial.refresh_from_db()

        self.rejected = Testimonial.objects.create(
            review=Review.objects.create(
                property=self.property_obj,
                user=self.other,
                user_name="Other User",
                user_email="other@x.com",
                review_text="Not approved feedback.",
            ),
            status=Testimonial.Status.REJECTED,
        )

        response = self.client.get("/api/testimonials/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        item = response.data[0]
        self.assertEqual(item["name"], "Jane Doe")
        self.assertEqual(item["text"], self.review.review_text)
        self.assertEqual(item["property_name"], "Modern 2 Bedroom Apartment")

    def test_public_payload_fields(self):
        PropertyRating.objects.create(
            user=self.renter, property=self.property_obj, rating=5
        )
        self._create_booking(status=Booking.BookingStatus.CONFIRMED)
        self.testimonial.status = Testimonial.Status.APPROVED
        self.testimonial.save()

        response = self.client.get("/api/testimonials/")
        item = response.data[0]
        self.assertEqual(item["rating"], 5)
        self.assertTrue(item["is_verified_renter"])
        self.assertEqual(item["role"], "Verified renter")
        self.assertEqual(item["property_id"], self.property_obj.id)
        self.assertFalse(item["is_featured"])

    def test_featured_sort_first_and_disallows_leak_of_admin_note(self):
        t2 = Testimonial.objects.create(
            review=Review.objects.create(
                property=self.property_obj,
                user=self.other,
                user_name="Other User",
                user_email="other@x.com",
                review_text="Second approved review.",
            ),
            status=Testimonial.Status.APPROVED,
            display_order=99,
        )
        self.testimonial.status = Testimonial.Status.APPROVED
        self.testimonial.is_featured = True
        self.testimonial.admin_note = "INTERNAL NOTE - never leak"
        self.testimonial.save()

        response = self.client.get("/api/testimonials/")
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["id"], self.testimonial.id)
        for item in response.data:
            self.assertNotIn("admin_note", item)
            self.assertNotIn("user_email", item)


class AdminTestimonialAPITests(TestimonialTestCase):
    def test_non_admin_forbidden(self):
        response = self._renter_client().get("/api/testimonials/admin/")
        self.assertEqual(response.status_code, 403)
        response = self._renter_client().patch(
            f"/api/testimonials/admin/{self.testimonial.id}/", {"status": "approved"}
        )
        self.assertEqual(response.status_code, 403)

    def test_anonymous_forbidden(self):
        # Anonymous requests are rejected at the DRF auth layer (401).
        response = self.client.get("/api/testimonials/admin/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.testimonial.status, Testimonial.Status.PENDING)

    def test_admin_list_with_counts(self):
        response = self._admin_client().get("/api/testimonials/admin/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["counts"]["pending"], 1)
        self.assertEqual(response.data["total_count"], 1)

    def test_approve_flow(self):
        response = self._admin_client().patch(
            f"/api/testimonials/admin/{self.testimonial.id}/",
            {"status": "approved"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "approved")
        self.testimonial.refresh_from_db()
        self.assertEqual(self.testimonial.approved_by, self.admin)
        self.assertIsNotNone(self.testimonial.approved_at)
        self.assertTrue(
            AuditLog.objects.filter(
                action="TESTIMONIAL_APPROVED",
                target_id=str(self.testimonial.id),
            ).exists()
        )
        # Now visible on the public API.
        public = self.client.get("/api/testimonials/")
        self.assertEqual(len(public.data), 1)

    def test_reject_hides_from_homepage(self):
        self.testimonial.status = Testimonial.Status.APPROVED
        self.testimonial.save()
        response = self._admin_client().patch(
            f"/api/testimonials/admin/{self.testimonial.id}/",
            {"status": "rejected"},
            format="json",
        )
        self.assertEqual(response.data["status"], "rejected")
        self.assertTrue(
            AuditLog.objects.filter(action="TESTIMONIAL_REJECTED").exists()
        )
        self.assertEqual(self.client.get("/api/testimonials/").data, [])
        self.testimonial.refresh_from_db()
        self.assertIsNone(self.testimonial.approved_by)

    def test_hide_removes_from_homepage(self):
        self.testimonial.status = Testimonial.Status.APPROVED
        self.testimonial.is_featured = True
        self.testimonial.save()
        response = self._admin_client().patch(
            f"/api/testimonials/admin/{self.testimonial.id}/",
            {"status": "hidden"},
            format="json",
        )
        self.assertEqual(response.data["status"], "hidden")
        self.assertFalse(response.data["is_featured"])
        self.assertTrue(
            AuditLog.objects.filter(action="TESTIMONIAL_HIDDEN").exists()
        )
        self.assertEqual(self.client.get("/api/testimonials/").data, [])

    def test_restore_to_pending(self):
        self.testimonial.status = Testimonial.Status.REJECTED
        self.testimonial.save()
        response = self._admin_client().patch(
            f"/api/testimonials/admin/{self.testimonial.id}/",
            {"status": "pending"},
            format="json",
        )
        self.assertEqual(response.data["status"], "pending")
        self.assertTrue(
            AuditLog.objects.filter(action="TESTIMONIAL_RESTORED").exists()
        )

    def test_featured_requires_approved(self):
        response = self._admin_client().patch(
            f"/api/testimonials/admin/{self.testimonial.id}/",
            {"is_featured": True},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.testimonial.refresh_from_db()
        self.assertFalse(self.testimonial.is_featured)

    def test_feature_and_unfeature(self):
        self.testimonial.status = Testimonial.Status.APPROVED
        self.testimonial.save()

        response = self._admin_client().patch(
            f"/api/testimonials/admin/{self.testimonial.id}/",
            {"is_featured": True, "display_order": 1},
            format="json",
        )
        self.assertEqual(response.data["is_featured"], True)
        self.assertEqual(response.data["display_order"], 1)
        self.assertTrue(
            AuditLog.objects.filter(action="TESTIMONIAL_FEATURED").exists()
        )

        response = self._admin_client().patch(
            f"/api/testimonials/admin/{self.testimonial.id}/",
            {"is_featured": False},
            format="json",
        )
        self.assertEqual(response.data["is_featured"], False)
        self.assertTrue(
            AuditLog.objects.filter(action="TESTIMONIAL_UNFEATURED").exists()
        )

    def test_invalid_status_rejected(self):
        response = self._admin_client().patch(
            f"/api/testimonials/admin/{self.testimonial.id}/",
            {"status": "bogus"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_detail_shows_booking_context(self):
        booking = self._create_booking(status=Booking.BookingStatus.CONFIRMED)
        response = self._admin_client().get(
            f"/api/testimonials/admin/{self.testimonial.id}/"
        )
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data["booking_reference"], booking.booking_reference)
        self.assertEqual(data["booking_status"], "confirmed")
        self.assertEqual(data["user"]["email"], "renter@x.com")
        self.assertTrue(data["is_verified_renter"])

    def test_admin_note_stored_but_private(self):
        response = self._admin_client().patch(
            f"/api/testimonials/admin/{self.testimonial.id}/",
            {"admin_note": "Great candidate"},
            format="json",
        )
        self.assertEqual(response.data["admin_note"], "Great candidate")
        public = self.client.get("/api/testimonials/")
        self.testimonial.status = Testimonial.Status.APPROVED
        self.testimonial.save()
        public = self.client.get("/api/testimonials/")
        for item in public.data:
            self.assertNotIn("admin_note", item)


class ReviewToTestimonialFlowTests(TestCase):
    def setUp(self):
        SiteSettings.objects.create(
            site_name="Test", house_commission_percent=Decimal("5.00")
        )
        self.owner = make_user("owner@x.com", User.Role.OWNER, "Owner", "One")
        self.renter = make_user("renter@x.com", None, "Jane", "Doe")
        self.property_obj = Property.objects.create(
            owner=self.owner,
            property_name="Cozy Studio",
            description="Studio",
            listing_type=ListingType.HOUSE,
            price=Decimal("8000.00"),
            rental_unit=RentalUnit.MONTHLY,
            currency="ETB",
            status=ListingStatus.ACTIVE,
            is_available=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.renter)

    def test_submitting_review_creates_pending_testimonial(self):
        response = self.client.post(
            f"/api/reviews/properties/{self.property_obj.id}/",
            {"review_text": "Excellent experience overall."},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        review = Review.objects.get(property=self.property_obj, user=self.renter)
        testimonial = Testimonial.objects.get(review=review)
        self.assertEqual(testimonial.status, Testimonial.Status.PENDING)

        # Pending is not on the homepage.
        self.assertEqual(self.client.get("/api/testimonials/").data, [])

        # Updating the review keeps the pending state (no auto publish).
        self.client.post(
            f"/api/reviews/properties/{self.property_obj.id}/",
            {"review_text": "Updated text, still not published."},
            format="json",
        )
        testimonial.refresh_from_db()
        self.assertEqual(testimonial.status, Testimonial.Status.PENDING)
        self.assertEqual(Testimonial.objects.filter(review=review).count(), 1)

    def test_property_review_remains_on_property_page(self):
        self.client.post(
            f"/api/reviews/properties/{self.property_obj.id}/",
            {"review_text": "Stays on the property page regardless of moderation."},
            format="json",
        )
        anonymous = APIClient()
        detail = anonymous.get(f"/api/properties/{self.property_obj.id}/")
        self.assertEqual(detail.status_code, 200)
        reviews = detail.data.get("reviews", [])
        self.assertEqual(len(reviews), 1)
        self.assertEqual(
            reviews[0]["review_text"],
            "Stays on the property page regardless of moderation.",
        )