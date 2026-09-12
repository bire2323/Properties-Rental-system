from django.urls import path

from .views import (
    AdminTestimonialDetailAPIView,
    AdminTestimonialListAPIView,
    TestimonialListAPIView,
)

urlpatterns = [
    path("", TestimonialListAPIView.as_view(), name="testimonial-list"),
    path("admin/", AdminTestimonialListAPIView.as_view(), name="admin-testimonial-list"),
    path(
        "admin/<int:testimonial_id>/",
        AdminTestimonialDetailAPIView.as_view(),
        name="admin-testimonial-detail",
    ),
]