from django.contrib import admin
from .models import Property, HouseDetail, CarDetail, Feature, PropertyImage

class HouseDetailInline(admin.StackedInline):
    model = HouseDetail
    extra = 0

class CarDetailInline(admin.StackedInline):
    model = CarDetail
    extra = 0

class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('property_name', 'owner', 'listing_type', 'price', 'rental_unit', 'status', 'is_available', 'created_at')
    list_filter = ('listing_type', 'status', 'is_available', 'rental_unit', 'city')
    search_fields = ('property_name', 'city', 'address', 'owner__username', 'owner__email')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [HouseDetailInline, CarDetailInline, PropertyImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'property_name', 'description', 'listing_type', 'price', 'rental_unit', 'security_deposit')
        }),
        ('Location', {
            'fields': ('address', 'city', 'country', 'latitude', 'longitude')
        }),
        ('Status & Amenities', {
            'fields': ('status', 'is_available', 'features')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'order')
    list_filter = ('property',)
