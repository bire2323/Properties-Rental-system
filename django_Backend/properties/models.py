from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator, DecimalValidator
from decimal import Decimal


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


class Currency(models.TextChoices):
    ETB = "ETB", "Ethiopian Birr (ETB)"
    USD = "USD", "US Dollar (USD)"


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
    currency = models.CharField(
        max_length=3,
        choices=Currency.choices,
        default=Currency.ETB,
        help_text="Currency for the price and security deposit."
    )
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


# Subscription Models

class SubscriptionPlan(models.Model):
    """
    Reusable subscription plan definition.
    Can be applied to individual owners or companies.
    """
    class TargetType(models.TextChoices):
        INDIVIDUAL = "individual", "Individual Owner"
        COMPANY = "company", "Company"

    class BillingCycle(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    name = models.CharField(
        max_length=100,
        help_text="Plan name, e.g., 'Basic', 'Professional', 'Enterprise'."
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Detailed description of the plan features."
    )
    target_type = models.CharField(
        max_length=20,
        choices=TargetType.choices,
        help_text="Whether this plan is for individual owners or companies."
    )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Plan price in the specified currency."
    )
    currency = models.CharField(
        max_length=3,
        choices=Currency.choices,
        default=Currency.ETB,
        help_text="Currency for the plan price."
    )
    billing_cycle = models.CharField(
        max_length=20,
        choices=BillingCycle.choices,
        default=BillingCycle.MONTHLY,
        help_text="Billing frequency."
    )
    max_listings = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum number of listings. NULL means unlimited."
    )
    commission_rate_discount = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text="Commission rate discount as a percentage (e.g., 10.00 = 10%)."
    )
    featured_listing_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Number of featured listings allowed per billing cycle. NULL means unlimited."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this plan is currently available for purchase."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_active', 'target_type', 'name']
        verbose_name = 'Subscription Plan'
        verbose_name_plural = 'Subscription Plans'
        indexes = [
            models.Index(fields=['target_type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_target_type_display()})"


class Subscription(models.Model):
    """
    Links a user or company to a subscription plan.
    A subscription must belong to exactly one of: user OR company.
    """
    class SubscriptionStatus(models.TextChoices):
        TRIALING = "trialing", "Trialing"
        ACTIVE = "active", "Active"
        PAST_DUE = "past_due", "Past Due"
        CANCELED = "canceled", "Canceled"
        EXPIRED = "expired", "Expired"

    # Must belong to exactly one of these
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subscriptions',
        help_text="Individual owner. NULL if this subscription belongs to a company."
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subscriptions',
        help_text="Company. NULL if this subscription belongs to an individual."
    )

    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        related_name='subscriptions',
        help_text="The subscription plan."
    )
    status = models.CharField(
        max_length=20,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.ACTIVE,
        help_text="Current subscription status."
    )
    current_period_start = models.DateTimeField(
        help_text="Start of the current billing period."
    )
    current_period_end = models.DateTimeField(
        help_text="End of the current billing period."
    )
    cancel_at_period_end = models.BooleanField(
        default=False,
        help_text="If True, subscription will be canceled at the end of the current period."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(user__isnull=False, company__isnull=True) | 
                      models.Q(user__isnull=True, company__isnull=False),
                name='subscription_belongs_to_exactly_one_recipient'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['company', 'status']),
        ]
        ordering = ['-created_at']
        verbose_name = 'Subscription'
        verbose_name_plural = 'Subscriptions'

    def __str__(self):
        recipient = self.user.email if self.user else self.company.name
        return f"{recipient} - {self.plan.name if self.plan else 'No Plan'} ({self.status})"


class FeaturedListing(models.Model):
    """
    Represents a paid feature listing promotion.
    Owners or companies can pay to promote a property for a specified duration.
    """
    class FeaturedStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        SCHEDULED = "scheduled", "Scheduled"
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        CANCELED = "canceled", "Canceled"

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='featured_listings',
        help_text="The property being featured."
    )
    start_at = models.DateTimeField(
        help_text="When the featured listing should start."
    )
    end_at = models.DateTimeField(
        help_text="When the featured listing should end."
    )
    status = models.CharField(
        max_length=20,
        choices=FeaturedStatus.choices,
        default=FeaturedStatus.PENDING,
        help_text="Current status of the featured listing."
    )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Price charged for this featured listing."
    )
    currency = models.CharField(
        max_length=3,
        choices=Currency.choices,
        default=Currency.ETB,
        help_text="Currency for the featured listing price."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_at__gt=models.F('start_at')),
                name='featured_listing_end_after_start'
            )
        ]
        indexes = [
            models.Index(fields=['status', 'end_at']),
        ]
        ordering = ['-start_at']
        verbose_name = 'Featured Listing'
        verbose_name_plural = 'Featured Listings'

    def __str__(self):
        return f"{self.property.property_name} - {self.get_status_display()}"