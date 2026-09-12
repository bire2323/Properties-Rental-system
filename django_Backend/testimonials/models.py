from django.conf import settings
from django.db import models


class Testimonial(models.Model):
    """
    A testimonial derived from real user feedback.

    Every property review maps to exactly one Testimonial row. The written
    text, author, rating and property are read through the related `Review`
    (and its `PropertyRating`) so no user/property/review data is duplicated.

    Lifecycle (admin moderated):

        pending  ->  approved  ->  hidden
           |  \_            \__  rejected
           +---------------------- pending (restored)

    Only `approved` testimonials are served by the public homepage API.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        HIDDEN = "hidden", "Hidden"

    review = models.OneToOneField(
        "Review.Review",
        on_delete=models.CASCADE,
        related_name="testimonial",
        help_text="The original user review this testimonial is derived from.",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
        help_text="Moderation lifecycle status. Only 'approved' is public.",
    )
    is_featured = models.BooleanField(
        default=False,
        help_text="Featured testimonials are prioritised on the homepage.",
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Manual ordering for the homepage. Lower numbers appear first.",
    )
    admin_note = models.TextField(
        blank=True,
        default="",
        help_text="Internal moderation note. Never exposed publicly.",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_testimonials",
        help_text="Admin who last approved this testimonial.",
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the testimonial was last approved.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "-approved_at", "-created_at"]
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonials"
        indexes = [
            models.Index(fields=["status", "is_featured"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"Testimonial for review #{self.review_id} ({self.status})"

    def is_approved(self):
        return self.status == self.Status.APPROVED