from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from properties.models import Property, Subscription, SubscriptionPlan
from properties.services.subscriptions import (
    _subscription_listing_limit,
    assign_free_subscription,
    can_create_listing,
)

User = get_user_model()


def _make_user(role="owner", email_prefix="u"):
    return User.objects.create_user(
        email=f"{email_prefix}@example.com",
        password="password123",
        first_name="Test",
        last_name="User",
        role=role,
        is_verified=True,
    )


def _make_property(owner, **overrides):
    defaults = dict(
        owner=owner,
        property_name="Place",
        description="Desc",
        listing_type="house",
        price=Decimal("1000.00"),
        currency="ETB",
    )
    defaults.update(overrides)
    return Property.objects.create(**defaults)


def _assign_sub(user, plan_name="Free", max_listings=None, status="active", purchased_max_listings=None):
    plan = SubscriptionPlan.objects.get(name=plan_name, target_type="individual", billing_cycle="monthly")
    now = timezone.now()
    sub_defaults = dict(
        purchased_name=plan.name,
        purchased_price=plan.price,
        purchased_currency=plan.currency,
        purchased_billing_cycle=plan.billing_cycle,
        purchased_max_listings=purchased_max_listings,
        purchased_featured_listing_limit=0,
        purchased_commission_rate_discount=Decimal("0.00"),
        status=status,
        current_period_start=now,
        current_period_end=now + timedelta(days=36500),
    )
    sub, _ = Subscription.objects.get_or_create(
        user=user, company=None, plan=plan, defaults=sub_defaults,
    )
    # When updating, sync snapshot to desired value
    if purchased_max_listings is not None or plan_name != "Free":
        Subscription.objects.filter(pk=sub.pk).update(purchased_max_listings=purchased_max_listings)
        sub.refresh_from_db()
    return sub


class FreePlanAllotmentTests(TestCase):
    """Free plan auto-assigned by migration 0013 allows exactly 5 listings."""

    def test_four_allowed_fifth_rejected(self):
        owner = _make_user("owner", "free1")
        assign_free_subscription(owner)

        for i in range(4):
            _make_property(owner, property_name=f"List {i}")
        ok, msg = can_create_listing(owner)
        self.assertTrue(ok, msg)

        _make_property(owner, property_name="List 4")
        ok, msg = can_create_listing(owner)
        self.assertFalse(ok)
        self.assertIn("5", msg)


class BasicPlanAllotmentTests(TestCase):
    """Basic plan permits up to 50 listings (purchase snapshot of 50)."""

    def test_fortynine_allowed_fifty_rejected(self):
        owner = _make_user("owner", "basic1")
        _assign_sub(owner, "Basic", purchased_max_listings=50)

        for i in range(49):
            _make_property(owner, property_name=f"List {i}")
        ok, msg = can_create_listing(owner)
        self.assertTrue(ok, msg)

        _make_property(owner, property_name="List 49")
        ok, msg = can_create_listing(owner)
        self.assertFalse(ok)
        self.assertIn("50", msg)


class PremiumPlanUnlimitedTests(TestCase):
    """Premium plan with NULL purchased_max_listings is unlimited."""

    def test_no_limit(self):
        owner = _make_user("owner", "prem1")
        _assign_sub(owner, "Premium", purchased_max_listings=None)

        for i in range(100):
            _make_property(owner, property_name=f"List {i}")
        ok, msg = can_create_listing(owner)
        self.assertTrue(ok)


class AssignFreeSubscriptionTests(TestCase):
    """assign_free_subscription helper."""

    def test_noop_when_active_subscription_exists(self):
        owner = _make_user("owner", "assign1")
        sub = _assign_sub(owner, "Premium", purchased_max_listings=None)
        result = assign_free_subscription(owner)
        self.assertIsNone(result)
        # Only one sub exists
        self.assertEqual(Subscription.objects.filter(user=owner).count(), 1)

    def test_creates_when_none(self):
        owner = _make_user("owner", "assign2")
        result = assign_free_subscription(owner)
        self.assertIsNotNone(result)
        self.assertEqual(result.plan.name, "Free")
        self.assertEqual(result.purchased_max_listings, 5)
        self.assertEqual(result.status, "active")


class DefaultLimitTests(TestCase):
    """Users with no subscription at all get the 5-listing default cap."""

    def test_default_limit_five(self):
        # Use an admin user who never had a subscription assigned.
        admin = _make_user("admin", "defadmin")
        for i in range(4):
            _make_property(admin, property_name=f"List {i}")
        ok, _ = can_create_listing(admin)
        self.assertTrue(ok)
        _make_property(admin, property_name="List 4")
        ok, _ = can_create_listing(admin)
        self.assertFalse(ok)


class SubscriptionLimitFunctionTests(TestCase):
    """Direct unit tests of _subscription_listing_limit."""

    def test_purchased_snapshot_takes_precedence(self):
        owner = _make_user("owner", "snap1")
        sub = _assign_sub(owner, "Basic", purchased_max_listings=3)
        self.assertEqual(_subscription_listing_limit(sub), 3)

    def test_falls_back_to_plan_when_snapshot_is_none(self):
        owner = _make_user("owner", "snap2")
        sub = _assign_sub(owner, "Premium", purchased_max_listings=None)
        self.assertIsNone(_subscription_listing_limit(sub))


class SubscriptionPlanListViewTests(APITestCase):
    """Free plans (price 0) must not appear in the public plan list."""

    def setUp(self):
        self.client = APIClient()
        self.user = _make_user("owner", "lv1")
        self.client.force_authenticate(self.user)

    def test_free_plan_excluded(self):
        SubscriptionPlan.objects.create(
            name="Free", target_type="individual", billing_cycle="monthly",
            price=Decimal("0.00"), currency="ETB", max_listings=5,
            featured_listing_limit=0, commission_rate_discount=Decimal("0.00"),
            is_active=True,
        )
        response = self.client.get("/api/subscriptions/plans/")
        self.assertEqual(response.status_code, 200)
        names = [p["name"] for p in response.data]
        self.assertNotIn("Free", names)


class SubscribeViewRejectsFreePlanTests(APITestCase):
    """Checkout endpoint must not allow purchasing the 0-ETB Free plan."""

    def setUp(self):
        self.client = APIClient()
        self.user = _make_user("owner", "sub1")
        self.client.force_authenticate(self.user)
        self.free_plan = SubscriptionPlan.objects.create(
            name="Free", target_type="individual", billing_cycle="monthly",
            price=Decimal("0.00"), currency="ETB", max_listings=5,
            featured_listing_limit=0, commission_rate_discount=Decimal("0.00"),
            is_active=True,
        )

    def test_rejects_zero_price_plan(self):
        response = self.client.post("/api/subscriptions/subscribe/", {"plan_id": self.free_plan.id}, format="json")
        self.assertIn(response.status_code, [400, 403])
