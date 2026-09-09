from django.urls import path

from .views import OwnerReviewListAPIView, PropertyReviewAPIView, ReviewListAPIView


urlpatterns = [
    path('', ReviewListAPIView.as_view(), name='review-list'),
    path('owner/', OwnerReviewListAPIView.as_view(), name='owner-reviews'),
    path('properties/<int:property_id>/', PropertyReviewAPIView.as_view(), name='property-reviews'),
]