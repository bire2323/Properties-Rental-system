from django.utils import timezone
from properties.models import Subscription, SubscriptionPlan, Property, ListingType
from django.db.models import Q

def get_active_subscription(owner, company=None):
    """
    Returns the currently active subscription for the given owner or company.
    If none exists or is expired, returns None.
    """
    now = timezone.now()
    
    if company:
        sub = Subscription.objects.filter(
            company=company,
            status__in=[Subscription.SubscriptionStatus.ACTIVE, Subscription.SubscriptionStatus.TRIALING],
            current_period_end__gt=now
        ).select_related('plan').first()
        if sub:
            return sub

    if owner:
        sub = Subscription.objects.filter(
            user=owner,
            status__in=[Subscription.SubscriptionStatus.ACTIVE, Subscription.SubscriptionStatus.TRIALING],
            current_period_end__gt=now
        ).select_related('plan').first()
        if sub:
            return sub

    return None

def _subscription_listing_limit(sub):
    """Effective listing limit: purchased snapshot first, else live plan definition."""
    if sub.purchased_max_listings is not None:
        return sub.purchased_max_listings
    if sub.plan:
        return sub.plan.max_listings
    return None

def can_create_listing(owner, company=None):
    """
    Checks if the owner/company is allowed to create another listing (property or vehicle).
    Returns (True, None) if allowed, or (False, "error message") if not.
    The limit is taken from the subscription's purchased snapshot when available
    (existing paid subscriptions keep the terms they were purchased under).
    """
    sub = get_active_subscription(owner, company)
    
    if company:
        current_count = Property.objects.filter(company=company).count()
    else:
        current_count = Property.objects.filter(owner=owner, company__isnull=True).count()

    if sub:
        limit = _subscription_listing_limit(sub)
        plan_name = sub.purchased_name or (sub.plan.name if sub.plan else "current")
        if limit is not None:
            if current_count >= limit:
                return False, f"You have reached your limit of {limit} listings on your {plan_name} plan. Please upgrade to add more."
            return True, None
        # Unlimited plan
        return True, None
    else:
        default_limit = 1
        if current_count >= default_limit:
            return False, f"You have reached the default limit of {default_limit} listings. Please subscribe to a plan to add more."
        return True, None

def get_commission_discount(owner, company=None):
    """
    Returns the percentage discount (e.g., 20.00) from the active subscription.
    Uses the purchased snapshot when present so plan edits don't retroactively
    change benefits an owner already paid for.
    """
    sub = get_active_subscription(owner, company)
    if not sub:
        return 0
    if sub.purchased_commission_rate_discount is not None:
        return sub.purchased_commission_rate_discount
    if sub.plan and sub.plan.commission_rate_discount:
        return sub.plan.commission_rate_discount
    return 0
