from django.test import TestCase
from rest_framework.test import APIClient

from .models import Testimonial


class TestimonialListAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.active = Testimonial.objects.create(
            name="Abebe Kebede",
            role="Property Owner",
            text="Finding tenants has never been easier.",
            order=2,
        )
        self.inactive = Testimonial.objects.create(
            name="Hidden User", text="Should not appear.", is_active=False
        )

    def test_returns_only_active_testimonials_ordered(self):
        response = self.client.get("/api/testimonials/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Abebe Kebede")
        self.assertEqual(response.data[0]["role"], "Property Owner")
        self.assertEqual(response.data[0]["text"], "Finding tenants has never been easier.")

    def test_order_field_respected(self):
        featured = Testimonial.objects.create(
            name="Featured First", text="Top of the list.", order=1
        )
        response = self.client.get("/api/testimonials/")
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["name"], "Featured First")

    def test_anonymous_access_allowed(self):
        response = self.client.get("/api/testimonials/")
        self.assertEqual(response.status_code, 200)