from rest_framework import serializers
from properties.models import SubscriptionPlan, Subscription, Property, FeaturedListing
from payments.models import SubscriptionPayment


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'target_type', 'price', 'currency', 
            'billing_cycle', 'max_listings', 'featured_listing_limit', 
            'commission_rate_discount'
        ]


class AdminSubscriptionPlanSerializer(serializers.ModelSerializer):
    """Admin-facing serializer: full plan definition including activation state."""
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'target_type', 'price', 'currency',
            'billing_cycle', 'max_listings', 'featured_listing_limit',
            'commission_rate_discount', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def _non_negative(self, value, field, decimals=0):
        if value is None:
            return
        try:
            num = float(value)
        except (TypeError, ValueError):
            raise serializers.ValidationError({field: f"{field.replace('_', ' ').title()} must be a valid number."})
        if num < 0:
            raise serializers.ValidationError({field: f"{field.replace('_', ' ').title()} cannot be negative."})
        if decimals and num > (100.0 if field == 'commission_rate_discount' else 10 ** 12):
            raise serializers.ValidationError({field: f"{field.replace('_', ' ').title()} is outside the supported range."})

    def validate_price(self, value):
        self._non_negative(value, 'price', decimals=2)
        return value

    def validate_max_listings(self, value):
        self._non_negative(value, 'max_listings')
        return value

    def validate_featured_listing_limit(self, value):
        self._non_negative(value, 'featured_listing_limit')
        return value

    def validate_commission_rate_discount(self, value):
        if value is None:
            return value
        num = float(value)
        if num < 0:
            raise serializers.ValidationError("Commission rate discount cannot be negative.")
        if num > 100:
            raise serializers.ValidationError("Commission rate discount cannot exceed 100%.")
        return value


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = serializers.SerializerMethodField()
    listings_used = serializers.SerializerMethodField()
    featured_used = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'status', 'current_period_start', 
            'current_period_end', 'cancel_at_period_end',
            'listings_used', 'featured_used'
        ]

    def get_plan(self, obj):
        """
        Returns the plan definition, overriding entitlement values with the
        subscription's purchased snapshot where available. This preserves the
        terms the owner paid for even if the admin later edits the plan.
        """
        if not obj.plan and not obj.purchased_name:
            return None

        plan = obj.plan
        return {
            'id': plan.id if plan else None,
            'name': obj.purchased_name or (plan.name if plan else ''),
            'description': plan.description if plan else '',
            'target_type': plan.target_type if plan else '',
            'price': str(obj.purchased_price) if obj.purchased_price is not None else (str(plan.price) if plan else None),
            'currency': obj.purchased_currency or (plan.currency if plan else ''),
            'billing_cycle': obj.purchased_billing_cycle or (plan.billing_cycle if plan else ''),
            'max_listings': obj.purchased_max_listings if obj.purchased_max_listings is not None else (plan.max_listings if plan else None),
            'featured_listing_limit': obj.purchased_featured_listing_limit if obj.purchased_featured_listing_limit is not None else (plan.featured_listing_limit if plan else None),
            'commission_rate_discount': str(obj.purchased_commission_rate_discount) if obj.purchased_commission_rate_discount is not None else (str(plan.commission_rate_discount) if plan else '0.00'),
        }

    def _recipient_query(self, obj):
        if obj.company_id:
            return Property.objects.filter(company_id=obj.company_id)
        return Property.objects.filter(owner_id=obj.user_id, company__isnull=True)

    def get_listings_used(self, obj):
        return self._recipient_query(obj).count()

    def get_featured_used(self, obj):
        return (
            FeaturedListing.objects
            .filter(
                property__in=self._recipient_query(obj),
                status__in=["pending", "scheduled", "active"],
            )
            .count()
        )

class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPayment
        fields = [
            'transaction_reference', 'amount', 'currency', 
            'status', 'created_at', 'updated_at'
        ]