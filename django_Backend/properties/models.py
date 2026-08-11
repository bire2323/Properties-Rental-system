from django.db import models
from django.conf import settings

class Property(models.Model):
    PROPERTY_TYPES = [
        ('house', 'House / Apartment'),
        ('car', 'Car / Vehicle'),
    ]

    # === COMMON FIELDS (Shared by both) ===
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='properties'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Monthly rent
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    property_type = models.CharField(max_length=10, choices=PROPERTY_TYPES)
    location = models.CharField(max_length=255)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    # Helper to easily get the specific child (House or Car) in your views
    def get_specific(self):
        if self.property_type == 'house':
            return self.house  # Django automatically creates this reverse relation
        elif self.property_type == 'car':
            return self.car
        return None


# === HOUSE SPECIFIC TABLE ===
class House(Property):
    # Django automatically creates a OneToOneField named 'property_ptr' linking to Property.
    bedrooms = models.IntegerField()
    bathrooms = models.IntegerField()
    area_sqft = models.IntegerField()
    has_garage = models.BooleanField(default=False)
    furnishing_status = models.CharField(
        max_length=20,
        choices=[('furnished', 'Furnished'), ('semi-furnished', 'Semi-Furnished'), ('unfurnished', 'Unfurnished')],
        default='unfurnished'
    )

    class Meta:
        verbose_name = "House"


# === CAR SPECIFIC TABLE ===
class Car(Property):
    brand = models.CharField(max_length=100)
    car_model = models.CharField(max_length=100)  # 'model' conflicts with Django's Meta.model
    year = models.IntegerField()
    mileage = models.IntegerField(help_text="Kilometers driven")
    fuel_type = models.CharField(
        max_length=20,
        choices=[('petrol', 'Petrol'), ('diesel', 'Diesel'), ('electric', 'Electric'), ('hybrid', 'Hybrid')]
    )
    transmission = models.CharField(
        max_length=20,
        choices=[('manual', 'Manual'), ('automatic', 'Automatic')]
    )
    seating_capacity = models.IntegerField(default=4)

    class Meta:
        verbose_name = "Car"

class PropertyImage(models.Model):
    property = models.ForeignKey(
        Property, 
        on_delete=models.CASCADE, 
        related_name='images'  # Allows you to do property.images.all()
    )
   # image_url = models.URLField(max_length=500)  # For MVP (Cloudinary/S3 URLs)
    # If you want to store files locally, use:
    # image = models.ImageField(upload_to='property_images/')
    image = models.ImageField(upload_to='properties/%Y/%m/%d/')
    order = models.IntegerField(default=0)  # To control display sequence

    class Meta:
        ordering = ['order']  # Always return images in order
        verbose_name = "Property Image"
        verbose_name_plural = "Property Images"

    def __str__(self):
        return f"Image {self.order} for {self.property.title}"