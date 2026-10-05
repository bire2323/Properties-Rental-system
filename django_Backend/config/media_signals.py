"""Clean up Cloudinary assets after their owning database rows are deleted."""

from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from cloudinary.models import CloudinaryField

from config.cloudinary_helpers import (
    delete_cloudinary_asset,
    same_cloudinary_asset,
)


@receiver(pre_save, dispatch_uid="config.remember_cloudinary_assets")
def remember_cloudinary_assets(sender, instance, **kwargs):
    if not instance.pk:
        return
    field_names = [
        field.attname
        for field in sender._meta.concrete_fields
        if isinstance(field, CloudinaryField)
    ]
    if field_names:
        instance._previous_cloudinary_assets = (
            sender._base_manager.filter(pk=instance.pk)
            .values(*field_names)
            .first()
            or {}
        )


@receiver(post_save, dispatch_uid="config.delete_replaced_cloudinary_assets")
def delete_replaced_cloudinary_assets(sender, instance, **kwargs):
    previous_assets = getattr(instance, "_previous_cloudinary_assets", {})
    for field in sender._meta.concrete_fields:
        if not isinstance(field, CloudinaryField):
            continue
        previous = previous_assets.get(field.attname)
        current = getattr(instance, field.attname, None)
        if previous and not same_cloudinary_asset(previous, current):
            transaction.on_commit(
                lambda stale_asset=previous: delete_cloudinary_asset(stale_asset)
            )
    if hasattr(instance, "_previous_cloudinary_assets"):
        del instance._previous_cloudinary_assets


@receiver(post_delete, dispatch_uid="config.delete_cloudinary_assets")
def delete_model_cloudinary_assets(sender, instance, **kwargs):
    for field in sender._meta.concrete_fields:
        if not isinstance(field, CloudinaryField):
            continue
        asset = getattr(instance, field.attname, None)
        if asset:
            transaction.on_commit(
                lambda stale_asset=asset: delete_cloudinary_asset(stale_asset)
            )
