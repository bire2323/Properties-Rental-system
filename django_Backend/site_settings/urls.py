from django.urls import path

from .views import PaymentMethodDetailAPIView, PaymentMethodListCreateAPIView, SiteSettingsAPIView


urlpatterns = [
	path("", SiteSettingsAPIView.as_view(), name="site-settings"),
	path("payment-methods/", PaymentMethodListCreateAPIView.as_view(), name="payment-method-list-create"),
	path("payment-methods/<int:pk>/", PaymentMethodDetailAPIView.as_view(), name="payment-method-detail"),
]
