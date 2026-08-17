from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from properties.models import Property

class PropertyRating(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='property_ratings'
    )
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='ratings'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'property'],
                name='unique_user_property_rating'
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.property.property_name} - {self.rating} Stars"

class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'property'],
                name='unique_user_property_favorite'
            )
        ]

    def __str__(self):
        return f"{self.user} favorited {self.property.property_name}"
