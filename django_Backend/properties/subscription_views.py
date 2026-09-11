from rest_framework import views, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from properties.models import SubscriptionPlan, Subscription
from properties.services.subscriptions import get_active_subscription
from properties.subscription_serializers import (
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
    SubscriptionPaymentSerializer,
    AdminSubscriptionPlanSerializer,
)
from properties.permissions import AdminRolePermission
from audit.models import AuditLog
from audit.services import audit_event
from payments.subscription_services import create_subscription_payment, verify_and_activate_subscription
from payments.models import SubscriptionPayment


class SubscriptionPlanListView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = SubscriptionPlan.objects.filter(
            is_active=True,
            price__gt=Decimal("0.00"),
        )
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data)


class AdminSubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    Admin-only management of subscription plans.
    - List/create/update plans.
    - Delete plans that have no subscription history. Plans referenced by
      existing subscriptions (or with a purchase history) must be deactivated
      via ``is_active = False`` instead so historical records remain intact.
    """

    serializer_class = AdminSubscriptionPlanSerializer
    permission_classes = [AdminRolePermission]
    lookup_field = 'id'
    pagination_class = None

    def get_queryset(self):
        qs = SubscriptionPlan.objects.all().order_by('-is_active', 'target_type', 'name')

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(name__icontains=search)

        target_type = self.request.query_params.get('target_type', '').strip()
        if target_type:
            qs = qs.filter(target_type=target_type)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        return qs

    @staticmethod
    def _plan_snapshot(plan):
        return {
            "name": plan.name,
            "description": plan.description,
            "target_type": plan.target_type,
            "price": str(plan.price),
            "currency": plan.currency,
            "billing_cycle": plan.billing_cycle,
            "max_listings": plan.max_listings,
            "featured_listing_limit": plan.featured_listing_limit,
            "commission_rate_discount": str(plan.commission_rate_discount),
            "is_active": plan.is_active,
        }

    def perform_create(self, serializer):
        instance = serializer.save()
        audit_event(
            actor=self.request.user,
            action="SUBSCRIPTION_PLAN_CREATED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="subscription_plan",
            target_id=instance.pk,
            target_display=instance.name,
            description=f"Admin created subscription plan '{instance.name}' "
                        f"({instance.get_target_type_display()}, {instance.get_billing_cycle_display()}).",
            previous_state={},
            new_state=self._plan_snapshot(instance),
            metadata={"plan_name": instance.name, "target_type": instance.target_type},
            request=self.request,
        )

    def perform_update(self, serializer):
        old = self._plan_snapshot(serializer.instance)
        instance = serializer.save()
        new = self._plan_snapshot(instance)

        if old.get("is_active") is True and new.get("is_active") is False:
            action = "SUBSCRIPTION_PLAN_DEACTIVATED"
            description = f"Admin deactivated subscription plan '{instance.name}'."
        elif old.get("is_active") is False and new.get("is_active") is True:
            action = "SUBSCRIPTION_PLAN_ACTIVATED"
            description = f"Admin activated subscription plan '{instance.name}'."
        else:
            action = "SUBSCRIPTION_PLAN_UPDATED"
            description = f"Admin updated subscription plan '{instance.name}'."

        audit_event(
            actor=self.request.user,
            action=action,
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="subscription_plan",
            target_id=instance.pk,
            target_display=instance.name,
            description=description,
            previous_state=old,
            new_state=new,
            metadata={"plan_name": instance.name, "target_type": instance.target_type},
            request=self.request,
        )

    def destroy(self, request, *args, **kwargs):
        plan = self.get_object()
        subscription_count = plan.subscriptions.count()
        if subscription_count > 0:
            return Response(
                {
                    "detail": (
                        f"This plan cannot be deleted because it is referenced by "
                        f"{subscription_count} existing subscription record(s). "
                        "Set is_active = False instead to stop new purchases while "
                        "preserving your subscription history."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan_name = plan.name
        plan.delete()

        audit_event(
            actor=request.user,
            action="SUBSCRIPTION_PLAN_DELETED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="subscription_plan",
            target_id="",
            target_display=plan_name,
            description=f"Admin deleted subscription plan '{plan_name}'.",
            metadata={"plan_name": plan_name},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MySubscriptionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscription = get_active_subscription(request.user)
        if subscription:
            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data)
        return Response({"detail": "No active subscription."}, status=status.HTTP_404_NOT_FOUND)

class SubscribeView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        callback_url = request.data.get('callback_url', request.build_absolute_uri('/api/subscriptions/verify/'))
        return_url = request.data.get('return_url', request.build_absolute_uri('/'))
        
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response({"error": "Plan not found or inactive."}, status=status.HTTP_400_BAD_REQUEST)

        if plan.price <= Decimal("0.00"):
            return Response(
                {"error": "Free plans are assigned automatically and cannot be purchased."},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        # Check if they already have an active sub
        active = get_active_subscription(request.user)
        if active and active.plan.id == plan.id:
            return Response({"error": "You already have this plan active."}, status=status.HTTP_400_BAD_REQUEST)

        # Create or update subscription record
        subscription, _ = Subscription.objects.get_or_create(
            user=request.user,
            defaults={'plan': plan, 'status': Subscription.SubscriptionStatus.TRIALING, 'current_period_start': plan.created_at, 'current_period_end': plan.created_at}
        )
        # If it already existed but for a different plan, update it (or we could enforce one active per user)
        subscription.plan = plan
        subscription.save(update_fields=['plan'])

        try:
            payment, checkout_url = create_subscription_payment(
                subscription=subscription,
                payer=request.user,
                callback_url=callback_url,
                return_url=return_url
            )
            return Response({"checkout_url": checkout_url, "transaction_reference": payment.transaction_reference})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class VerifySubscriptionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tx_ref = request.data.get('transaction_reference')
        if not tx_ref:
            return Response({"error": "Transaction reference is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            payment = SubscriptionPayment.objects.get(transaction_reference=tx_ref, payer=request.user)
        except SubscriptionPayment.DoesNotExist:
            return Response({"error": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            subscription = verify_and_activate_subscription(payment)
            if subscription:
                return Response({"status": "success", "subscription_status": subscription.status})
            else:
                return Response({"status": "failed", "payment_status": payment.status})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CancelSubscriptionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        subscription = get_active_subscription(request.user)
        if not subscription:
            return Response({"error": "No active subscription to cancel."}, status=status.HTTP_400_BAD_REQUEST)
            
        subscription.cancel_at_period_end = True
        subscription.save(update_fields=['cancel_at_period_end'])
        return Response({"status": "cancelled", "message": "Subscription will cancel at the end of the billing period."})
