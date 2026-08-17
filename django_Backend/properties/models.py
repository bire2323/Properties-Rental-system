from django.db import models
from django.conf import settings


class ListingType(models.TextChoices):
    HOUSE = "house", "House / Apartment"
    CAR = "car", "Car / Vehicle"


class RentalUnit(models.TextChoices):
    HOURLY = "hourly", "Per Hour"
    DAILY = "daily", "Per Day"
    WEEKLY = "weekly", "Per Week"
    MONTHLY = "monthly", "Per Month"
    YEARLY = "yearly", "Per Year"


class ListingStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PENDING = "pending", "Pending"
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    REJECTED = "rejected", "Rejected"


class Company(models.Model):
    """
    Represents a rental or real-estate company that can manage multiple
    property listings. A property can optionally belong to a Company.
    """
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    logo = models.ImageField(
        upload_to='companies/logos/',
        blank=True,
        null=True
    )
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)

    # Location
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100)

    # Management — one or more users can manage this company
    managers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='managed_companies',
        blank=True,
        help_text='Users authorised to manage this company and its listings.'
    )

    is_verified = models.BooleanField(
        default=False,
        help_text='Set by admins to indicate the company has been verified.'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
        ordering = ['name']

    def __str__(self):
        return self.name


class CompanyVerificationDocument(models.Model):
    class DocumentType(models.TextChoices):
        BUSINESS_LICENSE = 'business_license', 'Business License'
        TRADE_LICENSE = 'trade_license', 'Trade License'
        TAX_CERTIFICATE = 'tax_certificate', 'Tax Certificate'
        REGISTRATION_CERTIFICATE = 'registration_certificate', 'Registration Certificate'
        NATIONAL_ID = 'national_id', 'National ID'
        OTHER = 'other', 'Other'

    class VerificationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='verification_documents',
        help_text='Company this document belongs to.'
    )
    document_type = models.CharField(
        max_length=40,
        choices=DocumentType.choices,
        default=DocumentType.OTHER,
    )
    document_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Optional reference or registration number.'
    )
    document_file = models.FileField(
        upload_to='company_verification_documents/',
        blank=True,
        null=True,
        help_text='Uploaded document image or file.'
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text='Reason for rejection if the document is rejected.'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Company Verification Document'
        verbose_name_plural = 'Company Verification Documents'

    def __str__(self):
        return f"{self.company.name} - {self.get_document_type_display()}"


class Property(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties"
    )
    # Optional company association; null means individually owned listing
    company = models.ForeignKey(
        Company,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='properties',
        help_text='If set, this listing belongs to the specified company.'
    )
    property_name = models.CharField(max_length=200)
    description = models.TextField()
    listing_type = models.CharField(
        max_length=20,
        choices=ListingType.choices
    )
    price = models.DecimalField(max_digits=12, decimal_places=2)
    rental_unit = models.CharField(
        max_length=20,
        choices=RentalUnit.choices,
        default=RentalUnit.MONTHLY
    )
    security_deposit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Location — Ethiopian-style administrative structure
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100, blank=True, null=True)
    kebele = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    features = models.ManyToManyField(
        'Feature',
        blank=True,
        related_name='properties',
        help_text='Amenities and features available for this listing.'
    )

    is_available = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20,
        choices=ListingStatus.choices,
        default=ListingStatus.ACTIVE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.property_name


class HouseDetail(models.Model):
    property = models.OneToOneField(
        Property,
        on_delete=models.CASCADE,
        related_name="house_detail"
    )
    bedrooms = models.PositiveIntegerField()
    bathrooms = models.PositiveIntegerField()
    area_sqft = models.PositiveIntegerField()

    furnishing = models.CharField(
        max_length=20,
        choices=[
            ('furnished', 'Furnished'),
            ('semi_furnished', 'Semi-Furnished'),
            ('unfurnished', 'Unfurnished')
        ],
        default='unfurnished'
    )
    room_number = models.PositiveIntegerField(null=True, blank=True)
    total_rooms = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Total number of rooms in the property.'
    )
    distance_from_main_road = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text='Distance from the main road, e.g. "500 m", "1.5 km".'
    )
    rules_to_follow = models.TextField(
        null=True,
        blank=True,
        help_text='Rental rules, e.g. "No smoking", "No pets", "Family only".'
    )

    def __str__(self):
        return f"House details for {self.property.property_name}"


class CarDetail(models.Model):
    property = models.OneToOneField(
        Property,
        on_delete=models.CASCADE,
        related_name="car_detail"
    )
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    mileage = models.PositiveIntegerField(null=True, blank=True)

    fuel_type = models.CharField(
        max_length=20,
        choices=[
            ('petrol', 'Petrol'),
            ('diesel', 'Diesel'),
            ('electric', 'Electric'),
            ('hybrid', 'Hybrid')
        ],
        null=True,
        blank=True
    )
    seating_capacity = models.PositiveIntegerField()

    def __str__(self):
        return f"Car details for {self.property.property_name}"


class Feature(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text='Display name, e.g. Wi-Fi, Security, Swimming Pool.',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Feature'
        verbose_name_plural = 'Features'

    def __str__(self):
        return self.name


class PropertyImage(models.Model):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='properties/%Y/%m/%d/')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name = "Property Image"
        verbose_name_plural = "Property Images"

    def __str__(self):
        return f"Image {self.order} for {self.property.property_name}"