from django.contrib import admin
from django.db.models import Count
from .models import (
    Property, HouseDetail, CarDetail, Feature, PropertyImage,
    Company, CompanyVerificationDocument, Region, City,
)


# ---------------------------------------------------------------------------
# Location Management — Region & City
# ---------------------------------------------------------------------------

class CityInline(admin.TabularInline):
    """Show cities directly within the Region admin."""
    model = City
    extra = 1
    fields = ('name',)
    show_change_link = True


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('name', 'city_count', 'property_count', 'company_count', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    inlines = [CityInline]
    ordering = ('name',)

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _city_count=Count('cities', distinct=True),
            _property_count=Count('properties', distinct=True),
            _company_count=Count('companies', distinct=True),
        )

    @admin.display(description='Cities', ordering='_city_count')
    def city_count(self, obj):
        return obj._city_count

    @admin.display(description='Properties', ordering='_property_count')
    def property_count(self, obj):
        return obj._property_count

    @admin.display(description='Companies', ordering='_company_count')
    def company_count(self, obj):
        return obj._company_count


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'region', 'property_count', 'company_count', 'created_at')
    list_filter = ('region',)
    search_fields = ('name', 'region__name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('region__name', 'name')
    autocomplete_fields = ('region',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('region').annotate(
            _property_count=Count('properties', distinct=True),
            _company_count=Count('companies', distinct=True),
        )

    @admin.display(description='Properties', ordering='_property_count')
    def property_count(self, obj):
        return obj._property_count

    @admin.display(description='Companies', ordering='_company_count')
    def company_count(self, obj):
        return obj._company_count


# ---------------------------------------------------------------------------
# Inlines — HouseDetail, CarDetail, PropertyImage
# ---------------------------------------------------------------------------

class HouseDetailInline(admin.StackedInline):
    model = HouseDetail
    extra = 0
    fields = (
        'bedrooms', 'bathrooms', 'area_sqft', 'furnishing',
        'room_number', 'total_rooms', 'distance_from_main_road', 'rules_to_follow',
    )


class CarDetailInline(admin.StackedInline):
    model = CarDetail
    extra = 0


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1


# ---------------------------------------------------------------------------
# Company
# ---------------------------------------------------------------------------

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'region', 'is_verified', 'created_at')
    list_filter = ('is_verified', 'region')
    search_fields = ('name', 'city__name', 'region__name', 'contact_email')
    filter_horizontal = ('managers',)
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('region', 'city')

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'logo', 'contact_email',
                       'contact_phone', 'website')
        }),
        ('Location', {
            'fields': ('address', 'region', 'city')
        }),
        ('Management', {
            'fields': ('managers', 'is_verified')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CompanyVerificationDocument)
class CompanyVerificationDocumentAdmin(admin.ModelAdmin):
    list_display = ('company', 'document_type', 'verification_status', 'created_at')
    list_filter = ('verification_status', 'document_type')
    search_fields = ('company__name', 'document_number', 'document_type')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Document', {
            'fields': ('company', 'document_type', 'document_number', 'document_file')
        }),
        ('Review', {
            'fields': ('verification_status', 'rejection_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ---------------------------------------------------------------------------
# Property
# ---------------------------------------------------------------------------

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        'property_name', 'owner', 'company', 'listing_type',
        'price', 'rental_unit', 'city', 'region', 'status', 'is_available', 'created_at',
    )
    list_filter = ('listing_type', 'status', 'is_available', 'rental_unit', 'region', 'city')
    search_fields = (
        'property_name', 'city__name', 'region__name', 'address',
        'owner__username', 'owner__email', 'company__name',
    )
    readonly_fields = ('created_at', 'updated_at')
    inlines = [HouseDetailInline, CarDetailInline, PropertyImageInline]
    autocomplete_fields = ('region', 'city')

    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'company', 'property_name', 'description',
                       'listing_type', 'price', 'rental_unit', 'security_deposit')
        }),
        ('Location', {
            'fields': ('address', 'region', 'city', 'kebele', 'latitude', 'longitude')
        }),
        ('Status & Amenities', {
            'fields': ('status', 'is_available', 'features')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ---------------------------------------------------------------------------
# Feature & PropertyImage
# ---------------------------------------------------------------------------

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'order')
    list_filter = ('property',)
