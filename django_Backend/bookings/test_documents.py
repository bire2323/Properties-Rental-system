from datetime import date, timedelta
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from properties.models import ListingType, ListingStatus, Property, RentalUnit
from site_settings.models import SiteSettings

from .models import Booking, BookingApplicantDocument


class BookingDocumentUploadTests(TestCase):
    """Verify identity documents ride along with the multipart booking create
    and are returned (and served) to the renter, owner and admin."""

    def setUp(self):
        SiteSettings.objects.create(site_name="Test", house_commission_percent=Decimal("10.00"))
        self.owner = User.objects.create_user("owner@example.com", password="x", role=User.Role.OWNER, first_name="Owner", last_name="One")
        self.renter = User.objects.create_user("renter@example.com", password="x", first_name="Renter", last_name="One")
        self.admin = User.objects.create_user("admin@example.com", password="x", role=User.Role.ADMIN, is_staff=True, first_name="Admin", last_name="One")
        self.car = Property.objects.create(
            owner=self.owner, property_name="Car", description="Car",
            listing_type=ListingType.CAR, price=Decimal("100.00"),
            rental_unit=RentalUnit.DAILY, currency="ETB",
            status=ListingStatus.ACTIVE, is_available=True,
        )

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    def _payload(self):
        start = (date.today() + timedelta(days=2)).isoformat()
        end = (date.today() + timedelta(days=8)).isoformat()
        img = SimpleUploadedFile("id_front.png", b"\x89PNG\r\n\x1a\nfake-image-data", content_type="image/png")
        return {
            "property": str(self.car.pk),
            "start_date": start,
            "end_date": end,
            "applicant_details[contact_name]": "Temesgen Derso",
            "applicant_details[contact_phone]": "0922222222",
            "applicant_details[contact_email]": "temesgenderso7@gmail.com",
            "applicant_details[date_of_birth]": "2000-01-01",
            "applicant_details[gender]": "male",
            "applicant_details[id_type]": "national_id",
            "applicant_details[id_number]": "387275278357832",
            "applicant_details[emergency_name]": "Temesgen Derso",
            "applicant_details[emergency_phone]": "0987654321",
            "applicant_details[emergency_relationship]": "parent",
            "applicant_details[number_of_tenants]": "1",
            "applicant_details[pickup_time]": "20:24:00",
            "applicant_details[return_time]": "20:23:00",
            "applicant_details[pickup_purpose]": "travel",
            "applicant_details[information_confirmed]": "true",
            "applicant_details[terms_accepted]": "true",
            "documents[0].document": img,
            "documents[0].document_type": "identity",
            "documents[0].original_filename": "id_front.png",
        }

    def test_multipart_create_saves_documents(self):
        res = self._client(self.renter).post("/api/bookings/", self._payload(), format="multipart")
        self.assertEqual(res.status_code, 201, res.data)

        booking = Booking.objects.get(pk=res.data["id"])
        docs = BookingApplicantDocument.objects.filter(applicant_details__booking=booking)
        self.assertEqual(docs.count(), 1)
        doc = docs.first()
        self.assertEqual(doc.original_filename, "id_front.png")
        self.assertEqual(doc.document_type, "identity")
        self.assertTrue(doc.document)

    def test_multipart_create_saves_multiple_documents(self):
        payload = self._payload()
        payload["documents[1].document"] = SimpleUploadedFile(
            "id_back.png", b"fake-back-image", content_type="image/png"
        )
        payload["documents[1].document_type"] = "identity"
        payload["documents[1].original_filename"] = "id_back.png"

        res = self._client(self.renter).post("/api/bookings/", payload, format="multipart")
        self.assertEqual(res.status_code, 201, res.data)

        booking = Booking.objects.get(pk=res.data["id"])
        docs = BookingApplicantDocument.objects.filter(applicant_details__booking=booking)
        self.assertEqual(docs.count(), 2)

    def test_booking_payload_includes_documents_for_all_roles(self):
        res = self._client(self.renter).post("/api/bookings/", self._payload(), format="multipart")
        self.assertEqual(res.status_code, 201, res.data)
        booking_id = res.data["id"]

        for role, user in (("renter", self.renter), ("owner", self.owner), ("admin", self.admin)):
            res2 = self._client(user).get(f"/api/bookings/{booking_id}/")
            self.assertEqual(res2.status_code, 200, f"{role} fetch failed")
            docs = res2.data["applicant_details"]["documents"]
            self.assertEqual(len(docs), 1, f"{role} should see the document")
            self.assertEqual(docs[0]["original_filename"], "id_front.png")
            self.assertTrue("/api/bookings/documents/" in docs[0]["document_url"], docs[0]["document_url"])

    def test_document_served_only_to_authorized_users(self):
        res = self._client(self.renter).post("/api/bookings/", self._payload(), format="multipart")
        self.assertEqual(res.status_code, 201, res.data)
        booking_id = res.data["id"]
        doc = BookingApplicantDocument.objects.get(applicant_details__booking_id=booking_id)
        url = f"/api/bookings/documents/{doc.pk}/"

        # Authorized: renter, owner, admin.
        for user in (self.renter, self.owner, self.admin):
            r = self._client(user).get(url)
            self.assertEqual(r.status_code, 200, f"{user.role} should be able to view the document")

        # Unauthorized stranger.
        stranger = User.objects.create_user("stranger@example.com", password="x")
        r = self._client(stranger).get(url)
        self.assertIn(r.status_code, (403, 404))

        # Anonymous.
        r = APIClient().get(url)
        self.assertIn(r.status_code, (401, 403, 404))