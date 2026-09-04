from django.urls import path

from . import views

urlpatterns = [
    path("", views.PaymentListCreateAPIView.as_view(), name="payment-list-create"),
    path("lookup/", views.PaymentLookupAPIView.as_view(), name="payment-lookup"),
    path("webhook/", views.ChapaWebhookAPIView.as_view(), name="chapa-webhook"),
    path("callback/", views.ChapaCallbackAPIView.as_view(), name="chapa-callback"),
    path("<int:pk>/", views.PaymentDetailAPIView.as_view(), name="payment-detail"),
    path("<int:pk>/verify/", views.PaymentVerifyAPIView.as_view(), name="payment-verify"),
    path("<int:pk>/status/", views.PaymentStatusAPIView.as_view(), name="payment-status"),
]
