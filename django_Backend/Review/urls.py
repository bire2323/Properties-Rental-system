from django.urls import path

from .views import PropertyReviewAPIView, ReviewListAPIView


urlpatterns = [
    path('', ReviewListAPIView.as_view(), name='review-list'),
    path('properties/<int:property_id>/', PropertyReviewAPIView.as_view(), name='property-reviews'),
]