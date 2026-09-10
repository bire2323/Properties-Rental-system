from django.urls import path
from .subscription_views import (
    SubscriptionPlanListView,
    MySubscriptionView,
    SubscribeView,
    VerifySubscriptionView,
    CancelSubscriptionView,
    AdminSubscriptionPlanViewSet,
)

urlpatterns = [
    path('plans/', SubscriptionPlanListView.as_view(), name='subscription-plans'),
    path('me/', MySubscriptionView.as_view(), name='my-subscription'),
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('verify/', VerifySubscriptionView.as_view(), name='verify-subscription'),
    path('cancel/', CancelSubscriptionView.as_view(), name='cancel-subscription'),
    path('admin/plans/', AdminSubscriptionPlanViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-subscription-plans'),
    path('admin/plans/<int:id>/', AdminSubscriptionPlanViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'put': 'update', 'delete': 'destroy'}), name='admin-subscription-plan-detail'),
]