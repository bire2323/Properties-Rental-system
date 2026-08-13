from django.contrib import admin
from .models import Property, House, Car, PropertyImage, Feature


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['title', 'property_type', 'location', 'price', 'is_available', 'owner']
    list_filter = ['property_type', 'is_available']
    search_fields = ['title', 'location']
    filter_horizontal = ['features']


@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ['title', 'bedrooms', 'bathrooms', 'area_sqft']


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ['title', 'brand', 'car_model', 'year']


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ['property', 'order', 'image']
