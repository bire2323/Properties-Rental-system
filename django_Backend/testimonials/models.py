from django.db import models


class Testimonial(models.Model):
    name = models.CharField(max_length=150)
    role = models.CharField(max_length=150, blank=True, default="")
    text = models.TextField(max_length=2000)
    image = models.ImageField(upload_to="testimonials/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return f"{self.name} testimonial"