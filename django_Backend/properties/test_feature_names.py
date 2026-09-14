"""Tests for the feature_names hybrid tag flow (create-on-use features)."""
from decimal import Decimal
from types import SimpleNamespace

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from accounts.models import User
from properties.models import Category, Feature, ListingStatus, ListingType, Property, RentalUnit
from site_settings.models import SiteSettings

from .serializers import PropertyCreateSerializer


def make_request(user):
    return SimpleNamespace(user=user)


class FeatureNameResolutionTests(TestCase):
    """The resolver collapses normalized names and creates missing features."""

    def setUp(self):
        self.owner = User.objects.create_user(
            "owner@example.com", password="x", role=User.Role.OWNER,
            first_name="Owner", last_name="One",
        )
        SiteSettings.objects.create(site_name="Test", house_commission_percent=Decimal("10.00"))
        self.region = self._region()
        self.city = self._city()
        self.category = self._category()
        self.request = make_request(self.owner)

    def _region(self):
        from properties.models import Region
        return Region.objects.create(name="Test Region")

    def _city(self):
        from properties.models import City
        return City.objects.create(name="Test City", region=self.region)

    def _category(self):
        return Category.objects.create(name="Test Category", is_active=True, listing_type=ListingType.HOUSE)

    def _serializer_data(self, feature_ids=None, feature_names=None):
        data = {
            "property_name": "Test Property",
            "description": "A test",
            "listing_type": "house",
            "price": "12000.00",
            "rental_unit": "monthly",
            "security_deposit": "20000.00",
            "currency": "ETB",
            "category": self.category.pk,
            "region": self.region.pk,
            "city": self.city.pk,
            "status": "active",
            "is_available": True,
            "house_detail": {"bedrooms": 2, "bathrooms": 1, "area_sqft": 100},
        }
        if feature_ids is not None:
            data["feature_ids"] = feature_ids
        if feature_names is not None:
            data["feature_names"] = feature_names
        return data

    def _create(self, **kwargs):
        data = self._serializer_data(**kwargs)
        serializer = PropertyCreateSerializer(data=data, context={"request": self.request})
        serializer.is_valid(raise_exception=True)
        return serializer.save(owner=self.owner)

    # ── Duplicate / normalization ────────────────────────────────────────

    def test_names_casefold_collapses_duplicates(self):
        """'wifi', 'Wi-Fi' and 'WIFI' on the same property resolve to one feature.

        First-created name wins; later case variants collapse into it.
        """
        property_obj = self._create(feature_names=["wifi", "Wi-Fi", "WIFI"])
        names = set(property_obj.features.values_list("name", flat=True))
        self.assertEqual(names, {"wifi"})

    def test_whitespace_trimmed(self):
        property_obj = self._create(feature_names=["  swimming pool  "])
        names = list(property_obj.features.values_list("name", flat=True))
        self.assertEqual(names, ["swimming pool"])

    def test_empty_names_ignored(self):
        property_obj = self._create(feature_names=["", "   ", "", "security"])
        names = set(property_obj.features.values_list("name", flat=True))
        self.assertEqual(names, {"security"})

    # ── Create on use ────────────────────────────────────────────────────

    def test_missing_names_created(self):
        self._create(feature_names=["EV Charger"])
        self.assertTrue(Feature.objects.filter(name="EV Charger").exists())

    def test_existing_name_reused(self):
        Feature.objects.create(name="wifi")
        property_obj = self._create(feature_names=["wifi"])
        self.assertEqual(Feature.objects.filter(name="wifi").count(), 1)
        self.assertEqual(set(property_obj.features.values_list("name", flat=True)), {"wifi"})

    def test_ids_plus_names_union(self):
        existing = Feature.objects.create(name="security")
        property_obj = self._create(
            feature_ids=[existing.pk],
            feature_names=["security", "wifi"],
        )
        self.assertEqual(
            set(property_obj.features.values_list("name", flat=True)),
            {"security", "wifi"},
        )

    def test_cross_request_names_reuse_one_feature(self):
        """A later owner typing 'Wi-Fi' reuses the 'wifi' row created earlier."""
        first = self._create(feature_names=["wifi"])
        second = self._create(feature_names=["Wi-Fi"])
        wifi_feature = Feature.objects.get(name="wifi")
        self.assertEqual(Feature.objects.count(), 1)
        self.assertTrue(first.features.filter(pk=wifi_feature.pk).exists())
        self.assertTrue(second.features.filter(pk=wifi_feature.pk).exists())

    def test_update_merges_names_with_existing_and_replaces_ids(self):
        props = self._create(feature_names=["security", "wifi"])
        security = Feature.objects.get(name="security")
        wifi = Feature.objects.get(name="wifi")

        data = self._serializer_data(feature_ids=[security.pk], feature_names=["wi-fi", "wifi"])
        data["property_name"] = "Updated Property"
        serializer = PropertyCreateSerializer(props, data=data, context={"request": self.request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        names = set(props.features.values_list("name", flat=True))
        # 'wi-fi'/'wifi' collapse to the same row; ids supplied replace the old set.
        self.assertEqual(names, {"security", "wifi"})
        self.assertEqual(wifi.pk, props.features.get(name="wifi").pk)

    # ── Validation errors ────────────────────────────────────────────────

    def test_rejects_non_list_names(self):
        serializer = PropertyCreateSerializer(
            data=self._serializer_data(feature_names="wifi"),
            context={"request": self.request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("feature_names", serializer.errors)

    def test_non_string_items_coerced_by_drf(self):
        """DRF coerces numbers inside CharField children (123 → '123').

        Documented here so the free-text tag flow keeps accepting everything
        a user can type; normalization still trims and deduplicates.
        """
        property_obj = self._create(feature_names=[123])
        names = set(property_obj.features.values_list("name", flat=True))
        self.assertEqual(names, {"123"})

    def test_unknown_feature_ids_still_rejected(self):
        """feature_ids validation still rejects non-existent IDs."""
        serializer = PropertyCreateSerializer(
            data=self._serializer_data(feature_ids=[99999]),
            context={"request": self.request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("feature_ids", serializer.errors)

    def test_empty_names_and_ids_creates_no_features(self):
        property_obj = self._create(feature_ids=[], feature_names=[])
        self.assertEqual(property_obj.features.count(), 0)
