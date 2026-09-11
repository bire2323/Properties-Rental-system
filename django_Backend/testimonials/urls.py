from django.urls import path

from .views import TestimonialListAPIView

urlpatterns = [
    path("", TestimonialListAPIView.as_view(), name="testimonial-list"),
]