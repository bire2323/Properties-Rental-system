"""Serializer input normalization: GPS precision and feature name lists.

Covers the two shapes the React forms actually send over multipart:
coordinates captured by ``navigator.geolocation`` (10-15 decimal places)
and custom features sent as one ``JSON.stringify`` part.
"""

from decimal import Decimal
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Category, City, Feature, ListingType, Region
from .serializers import PropertyCreateSerializer

User = get_user_model()


def make_property_data(**overrides):
    data = {
        "property_name": "Precision Test House",
        "description": "A house used to verify input normalization.",
        "listing_type": "house",
        "price": "12000.00",
        "rental_unit": "monthly",
        "security_deposit": "20000.00",
        "currency": "ETB",
        "status": "active",
        "is_available": True,
        "house_detail": {"bedrooms": 2, "bathrooms": 1, "area_sqft": 100},
    }
    data.update(overrides)
    return data


class CoordinatePrecisionTests(TestCase):
    def setUp(self):
        self.owner = _make_owner()
        self.region = Region.objects.create(name="Precision Region")
        self.city = City.objects.create(name="Precision City", region=self.region)
        self.category = Category.objects.create(
            name="Precision Category",
            is_active=True,
            listing_type=ListingType.HOUSE,
        )
        self.request = SimpleNamespace(user=self.owner)

    def _serializer(self, **overrides):
        return PropertyCreateSerializer(
            data=make_property_data(
                category=self.category.pk,
                region=self.region.pk,
                city=self.city.pk,
                **overrides,
            ),
            context={"request": self.request},
        )

    def test_raw_gps_precision_is_rounded_to_six_places(self):
        serializer = self._serializer(
            latitude="8.987654321098765",
            longitude="38.798765432109876",
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        property_obj = serializer.save(owner=self.owner)

        self.assertEqual(property_obj.latitude, Decimal("8.987654"))
        self.assertEqual(property_obj.longitude, Decimal("38.798765"))

    def test_already_clean_coordinates_pass_unchanged(self):
        serializer = self._serializer(latitude="-8.987654", longitude="38.798765")

        self.assertTrue(serializer.is_valid(), serializer.errors)
        property_obj = serializer.save(owner=self.owner)

        self.assertEqual(property_obj.latitude, Decimal("-8.987654"))
        self.assertEqual(property_obj.longitude, Decimal("38.798765"))

    def test_absurd_magnitude_still_rejected(self):
        """Rounding must not weaken the max_digits guard."""
        serializer = self._serializer(latitude="123456789012.5", longitude="38.798765")

        self.assertFalse(serializer.is_valid())
        self.assertIn("latitude", serializer.errors)

    def test_non_numeric_coordinate_rejected(self):
        serializer = self._serializer(latitude="not-a-number", longitude="38.798765")

        self.assertFalse(serializer.is_valid())
        self.assertIn("latitude", serializer.errors)


class FeatureNameListTests(TestCase):
    def setUp(self):
        self.owner = _make_owner()
        self.region = Region.objects.create(name="Feature Region")
        self.city = City.objects.create(name="Feature City", region=self.region)
        self.category = Category.objects.create(
            name="Feature Category",
            is_active=True,
            listing_type=ListingType.HOUSE,
        )
        self.request = SimpleNamespace(user=self.owner)

    def _create(self, feature_names):
        serializer = PropertyCreateSerializer(
            data=make_property_data(
                category=self.category.pk,
                region=self.region.pk,
                city=self.city.pk,
                feature_names=feature_names,
            ),
            context={"request": self.request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        return serializer.save(owner=self.owner)

    def test_multipart_json_string_is_split_into_individual_features(self):
        """One JSON.stringify part must become several features, not one."""
        property_obj = self._create(['["wifi","security camera","fence"]'])

        names = set(property_obj.features.values_list("name", flat=True))
        self.assertEqual(names, {"wifi", "security camera", "fence"})
        self.assertFalse(Feature.objects.filter(name__contains="[").exists())

    def test_single_item_json_string_is_parsed(self):
        property_obj = self._create(['["garden"]'])

        names = set(property_obj.features.values_list("name", flat=True))
        self.assertEqual(names, {"garden"})

    def test_plain_list_input_still_works(self):
        property_obj = self._create(["swimming pool", "Garage"])

        names = set(property_obj.features.values_list("name", flat=True))
        self.assertEqual(names, {"swimming pool", "Garage"})

    def test_json_looking_text_that_is_not_valid_json_stays_one_feature(self):
        property_obj = self._create(["[wifi]"])

        names = set(property_obj.features.values_list("name", flat=True))
        self.assertEqual(names, {"[wifi]"})

    def test_empty_json_array_creates_no_features(self):
        property_obj = self._create(["[]"])

        self.assertEqual(property_obj.features.count(), 0)


def _make_owner():
    return User.objects.create_user(
        "precision-owner@example.com",
        password="x",
        role=User.Role.OWNER,
        first_name="Precision",
        last_name="Owner",
    )
