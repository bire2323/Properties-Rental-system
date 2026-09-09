from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
	list_display = ('property', 'user_name', 'user_email', 'created_at')
	search_fields = ('property__property_name', 'user_name', 'user_email', 'review_text')
from django.contrib import admin

# Register your models here.
