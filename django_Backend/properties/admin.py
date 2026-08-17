from django.contrib import admin
from .models import Property, HouseDetail, CarDetail, Feature, PropertyImage, Company, CompanyVerificationDocument


# ---------------------------------------------------------------------------
# Inlines
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
    search_fields = ('name', 'city', 'region', 'contact_email')
    filter_horizontal = ('managers',)
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'logo', 'contact_email',
                       'contact_phone', 'website')
        }),
        ('Location', {
            'fields': ('address', 'city', 'region')
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
    list_filter = ('listing_type', 'status', 'is_available', 'rental_unit', 'city', 'region')
    search_fields = (
        'property_name', 'city', 'region', 'address',
        'owner__username', 'owner__email', 'company__name',
    )
    readonly_fields = ('created_at', 'updated_at')
    inlines = [HouseDetailInline, CarDetailInline, PropertyImageInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'company', 'property_name', 'description',
                       'listing_type', 'price', 'rental_unit', 'security_deposit')
        }),
        ('Location', {
            'fields': ('address', 'city', 'region', 'kebele', 'latitude', 'longitude')
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
