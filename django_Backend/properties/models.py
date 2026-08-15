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

class Property(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties"
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
    
    # Location
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
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
    floor_number = models.PositiveIntegerField(null=True, blank=True)
    room_number = models.PositiveIntegerField(null=True, blank=True)

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