from decimal import Decimal

from django.db import migrations


def seed_subscription_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("properties", "SubscriptionPlan")

    definitions = []
    for target in ("individual", "company"):
        definitions += [
            {
                "name": "Basic",
                "target_type": target,
                "billing_cycle": "monthly",
                "price": Decimal("500.00"),
                "max_listings": 5,
                "featured_listing_limit": 1,
                "commission_rate_discount": Decimal("0.00"),
            },
            {
                "name": "Basic",
                "target_type": target,
                "billing_cycle": "yearly",
                "price": Decimal("4800.00"),
                "max_listings": 5,
                "featured_listing_limit": 1,
                "commission_rate_discount": Decimal("0.00"),
            },
            {
                "name": "Premium",
                "target_type": target,
                "billing_cycle": "monthly",
                "price": Decimal("1000.00"),
                "max_listings": 20,
                "featured_listing_limit": 5,
                "commission_rate_discount": Decimal("20.00"),
            },
            {
                "name": "Premium",
                "target_type": target,
                "billing_cycle": "yearly",
                "price": Decimal("9600.00"),
                "max_listings": 20,
                "featured_listing_limit": 5,
                "commission_rate_discount": Decimal("20.00"),
            },
            {
                "name": "Business",
                "target_type": target,
                "billing_cycle": "monthly",
                "price": Decimal("2500.00"),
                "max_listings": None,
                "featured_listing_limit": 10,
                "commission_rate_discount": Decimal("30.00"),
            },
            {
                "name": "Business",
                "target_type": target,
                "billing_cycle": "yearly",
                "price": Decimal("24000.00"),
                "max_listings": None,
                "featured_listing_limit": 10,
                "commission_rate_discount": Decimal("30.00"),
            },
        ]

    for item in definitions:
        defaults = {
            "description": (
                "Unlimited listings." if item["max_listings"] is None
                else f"Up to {item['max_listings']} listings."
            ),
            "currency": "ETB",
            "is_active": True,
            "price": item["price"],
            "max_listings": item["max_listings"],
            "featured_listing_limit": item["featured_listing_limit"],
            "commission_rate_discount": item["commission_rate_discount"],
        }
        SubscriptionPlan.objects.update_or_create(
            name=item["name"],
            target_type=item["target_type"],
            billing_cycle=item["billing_cycle"],
            defaults=defaults,
        )


def unseed_subscription_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("properties", "SubscriptionPlan")
    SubscriptionPlan.objects.filter(
        name__in=["Basic", "Premium", "Business"]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0009_category_property_category"),
    ]

    operations = [
        migrations.RunPython(seed_subscription_plans, unseed_subscription_plans),
    ]