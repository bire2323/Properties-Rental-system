from django.db import models


class Review(models.Model):
	property = models.ForeignKey(
		'properties.Property', on_delete=models.CASCADE, related_name='reviews'
	)
	user = models.ForeignKey(
		'accounts.User', on_delete=models.CASCADE, related_name='property_reviews'
	)
	user_name = models.CharField(max_length=301)
	user_email = models.EmailField()
	review_text = models.TextField(max_length=2000)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']
		constraints = [
			models.UniqueConstraint(
				fields=['property', 'user'], name='unique_user_property_review'
			)
		]

	def __str__(self):
		return f'{self.user_name} review for {self.property.property_name}'
