from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular user.
        """

        if not email:
            raise ValueError("The email field is required.")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser.
        """

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", User.Role.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(
                "Superuser must have is_staff=True."
            )

        if extra_fields.get("is_superuser") is not True:
            raise ValueError(
                "Superuser must have is_superuser=True."
            )

        return self.create_user(
            email,
            password,
            **extra_fields
        )


class User(AbstractUser):

    class Role(models.TextChoices):
        TENANT = "tenant", "Tenant"
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"

    class AuthProvider(models.TextChoices):
        EMAIL = "email", "Email"
        GOOGLE = "google", "Google"
        TELEGRAM = "telegram", "Telegram"

    username = None

    email = models.EmailField(
        unique=True
    )

    first_name = models.CharField(
        max_length=150
    )

    last_name = models.CharField(
        max_length=150
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.TENANT
    )

   
    is_verified = models.BooleanField(
        default=False
    )

    auth_provider = models.CharField(
        max_length=20,
        choices=AuthProvider.choices,
        default=AuthProvider.EMAIL
    )

    google_id = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    telegram_id = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"



class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    profile_image = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True
    )

    date_of_birth = models.DateField(
        blank=True,
        null=True
    )

    address = models.TextField(
        blank=True,
        null=True
    )

    city = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    country = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profiles"

    def __str__(self):
        return f"{self.user.email}'s Profile"


class OwnerProfile(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        SUSPENDED = "suspended", "Suspended"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owner_profile"
    )

    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )

    can_post_property = models.BooleanField(
        default=False,
        help_text="Controls whether the user is allowed to create property listings."
    )

    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for rejection, if status is rejected."
    )

    approved_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp when the owner was approved."
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = "Owner Profile"
        verbose_name_plural = "Owner Profiles"

    def __str__(self):
        return f"{self.user.email} - {self.verification_status}"


class OwnerVerificationDocument(models.Model):
    """
    Verification documents submitted by an owner.
    One owner can have multiple documents.
    """
    class DocumentType(models.TextChoices):
        NATIONAL_ID = "national_id", "National ID"
        PASSPORT = "passport", "Passport"
        DRIVING_LICENSE = "driving_license", "Driving License"
        OTHER = "other", "Other"

    owner_profile = models.ForeignKey(
        OwnerProfile,
        on_delete=models.CASCADE,
        related_name="verification_documents"
    )

    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices
    )

    document_number = models.CharField(
        max_length=100,    
        blank=True,
        null=True
    )

    document_image = models.ImageField(
        upload_to="owner_verification_documents/"
    )

    is_verified = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = "Owner Verification Document"
        verbose_name_plural = "Owner Verification Documents"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.owner_profile.user.email} - {self.get_document_type_display()}"


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        BOOKING = "Booking", "Booking"
        PROPERTY = "Property", "Property"
        PAYMENT = "Payment", "Payment"
        SYSTEM = "System", "System"

    class NotificationStatus(models.TextChoices):
        NEW = "New", "New"
        RECEIVED = "Received", "Received"
        CONFIRMED = "Confirmed", "Confirmed"
        INFO = "Info", "Info"

    type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    status = models.CharField(
        max_length=20,
        choices=NotificationStatus.choices,
        default=NotificationStatus.NEW,
    )
    title = models.CharField(max_length=255)
    details = models.TextField(blank=True, null=True)
    info = models.CharField(max_length=255, blank=True, null=True)

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
    )
    sender_name = models.CharField(max_length=255, blank=True, null=True)
    sender_email = models.EmailField(blank=True, null=True)
    sender_phone = models.CharField(max_length=30, blank=True, null=True)

    property_obj = models.ForeignKey(
        "properties.Property",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    property_title = models.CharField(max_length=255, blank=True, null=True)
    property_status = models.CharField(max_length=50, blank=True, null=True)
    property_address = models.CharField(max_length=500, blank=True, null=True)
    property_bedrooms = models.PositiveIntegerField(null=True, blank=True)
    property_bathrooms = models.PositiveIntegerField(null=True, blank=True)
    property_size = models.CharField(max_length=50, blank=True, null=True)
    property_nightly_price = models.CharField(max_length=100, blank=True, null=True)
    property_image = models.CharField(max_length=500, blank=True, null=True)
    property_owner = models.CharField(max_length=255, blank=True, null=True)
    property_added_date = models.CharField(max_length=50, blank=True, null=True)

    tenant_name = models.CharField(max_length=255, blank=True, null=True)
    tenant_phone = models.CharField(max_length=30, blank=True, null=True)
    check_in_date = models.CharField(max_length=50, blank=True, null=True)
    check_out_date = models.CharField(max_length=50, blank=True, null=True)
    total_amount = models.CharField(max_length=100, blank=True, null=True)
    payment_method = models.CharField(max_length=100, blank=True, null=True)
    payment_status = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.type} - {self.title}"