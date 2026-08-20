from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import Notification
from .models import Booking


@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    if not created:
        return

    renter_name = instance.renter.get_full_name().strip() or instance.renter.email
    property_obj = instance.property
    property_owner = property_obj.owner
    owner_name = property_owner.get_full_name().strip() or property_owner.email
    Notification.objects.create(
        type=Notification.NotificationType.BOOKING,
        status=Notification.NotificationStatus.NEW,
        title="New booking request",
        details=f"{renter_name} requested to book {property_obj.property_name}.",
        info="Booking request",
        sender=instance.renter,
        sender_name=renter_name,
        sender_email=instance.renter.email,
        sender_phone=getattr(getattr(instance.renter, "profile", None), "phone_number", "") or "",
        property_obj=property_obj,
        property_title=property_obj.property_name,
        property_owner=owner_name,
        property_address=", ".join(filter(None, [property_obj.address, property_obj.city, property_obj.region])),
        property_status=property_obj.get_status_display(),
        property_added_date=property_obj.created_at.strftime("%b %d, %Y"),
        tenant_name=renter_name,
        tenant_phone=getattr(getattr(instance.renter, "profile", None), "phone_number", "") or "",
        check_in_date=instance.start_date.strftime("%b %d, %Y"),
        check_out_date=instance.end_date.strftime("%b %d, %Y"),
        total_amount=f"{instance.currency} {instance.total_amount}",
        payment_status=instance.get_status_display(),
    )
