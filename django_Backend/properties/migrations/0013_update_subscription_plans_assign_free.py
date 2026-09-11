from datetime import timedelta
from decimal import Decimal

from django.db import migrations
from django.utils import timezone


FREE_PERIOD_END_OFFSET = timedelta(days=36500)


def forward(apps, schema_editor):
    SubscriptionPlan = apps.get_model("properties", "SubscriptionPlan")
    Subscription = apps.get_model("properties", "Subscription")
    User = apps.get_model("accounts", "User")

    # ── 1. Reconfigure existing plans (Basic 5→50, Premium 20→unlimited) ──
    for target in ("individual", "company"):
        SubscriptionPlan.objects.filter(
            name="Basic", target_type=target, billing_cycle="monthly"
        ).update(max_listings=50, description="Up to 50 listings.")
        SubscriptionPlan.objects.filter(
            name="Basic", target_type=target, billing_cycle="yearly"
        ).update(max_listings=50, description="Up to 50 listings.")
        SubscriptionPlan.objects.filter(
            name="Premium", target_type=target, billing_cycle="monthly"
        ).update(max_listings=None, description="Unlimited listings.")
        SubscriptionPlan.objects.filter(
            name="Premium", target_type=target, billing_cycle="yearly"
        ).update(max_listings=None, description="Unlimited listings.")

    # ── 2. Create the Free (0 ETB) plans ──────────────────────────────────
    free_defaults = {
        "description": "Up to 5 listings.",
        "price": Decimal("0.00"),
        "currency": "ETB",
        "max_listings": 5,
        "featured_listing_limit": 0,
        "commission_rate_discount": Decimal("0.00"),
        "is_active": True,
    }
    for target in ("individual", "company"):
        SubscriptionPlan.objects.get_or_create(
            name="Free",
            target_type=target,
            billing_cycle="monthly",
            defaults=free_defaults,
        )

    # ── 3. Upgrade-only snapshot sync for active/trialing subscribers ─────
    # Basic subscribers bought 5 listings → now 50.
    Subscription.objects.filter(
        status__in=["active", "trialing"],
        plan__name="Basic",
        purchased_max_listings=5,
    ).update(purchased_max_listings=50)
    # Premium subscribers bought 20 listings → now unlimited (NULL).
    Subscription.objects.filter(
        status__in=["active", "trialing"],
        plan__name="Premium",
        purchased_max_listings=20,
    ).update(purchased_max_listings=None)

    # ── 4. Assign Free to existing owners without an active/trialing sub ──
    active_ids = Subscription.objects.filter(
        status__in=["active", "trialing"],
        user__isnull=False,
    ).values_list("user_id", flat=True)

    owners = User.objects.filter(role="owner").exclude(id__in=active_ids)
    free_plans = {}
    for target in ("individual", "company"):
        free_plans[target] = SubscriptionPlan.objects.filter(
            name="Free",
            target_type=target,
            billing_cycle="monthly",
            is_active=True,
        ).first()

    free_plan = free_plans.get("individual")
    if not free_plan:
        return

    now = timezone.now()
    period_end = now + FREE_PERIOD_END_OFFSET
    to_create = []
    for owner_id in owners.values_list("id", flat=True):
        to_create.append(
            Subscription(
                user_id=owner_id,
                company=None,
                plan=free_plan,
                purchased_name=free_plan.name,
                purchased_price=free_plan.price,
                purchased_currency=free_plan.currency,
                purchased_billing_cycle=free_plan.billing_cycle,
                purchased_max_listings=free_plan.max_listings,
                purchased_featured_listing_limit=free_plan.featured_listing_limit,
                purchased_commission_rate_discount=free_plan.commission_rate_discount,
                status="active",
                current_period_start=now,
                current_period_end=period_end,
            )
        )
    Subscription.objects.bulk_create(to_create, batch_size=500)


def backward(apps, schema_editor):
    SubscriptionPlan = apps.get_model("properties", "SubscriptionPlan")
    Subscription = apps.get_model("properties", "Subscription")

    Subscription.objects.filter(
        status__in=["active", "trialing"],
        plan__name="Basic",
        purchased_max_listings=50,
    ).update(purchased_max_listings=5)
    Subscription.objects.filter(
        status__in=["active", "trialing"],
        plan__name="Premium",
        purchased_max_listings=None,
    ).update(purchased_max_listings=20)

    for target in ("individual", "company"):
        SubscriptionPlan.objects.filter(
            name="Basic", target_type=target
        ).update(max_listings=5, description="Up to 5 listings.")
        SubscriptionPlan.objects.filter(
            name="Premium", target_type=target
        ).update(max_listings=20, description="Up to 20 listings.")

    Subscription.objects.filter(purchased_name="Free").delete()
    SubscriptionPlan.objects.filter(name="Free").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0012_alter_property_status"),
    ]

    operations = [
        migrations.RunPython(forward, backward),
    ]