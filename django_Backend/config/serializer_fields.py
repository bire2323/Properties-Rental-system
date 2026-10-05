"""Reusable DRF serializer fields for Cloudinary-backed model fields.

``CloudinaryField`` is a CharField subclass whose ``from_db_value`` returns a
``CloudinaryResource``. DRF does not know how to render that, so every
serializer exposing an image must declare one of the fields below explicitly
instead of relying on ``ModelSerializer`` auto-mapping (which would emit the
bare ``public_id`` rather than a URL).
"""

from rest_framework import serializers

from config.cloudinary_helpers import private_asset_url, public_asset_url


class CloudinaryPublicImageField(serializers.ImageField):
    """Public Cloudinary asset: returns a full ``res.cloudinary.com`` URL.

    Accepts an uploaded file on write and is safe to mark ``read_only`` when
    the view handles uploads itself.
    """

    def __init__(self, **kwargs):
        kwargs.setdefault("required", False)
        kwargs.setdefault("allow_null", True)
        super().__init__(**kwargs)

    def to_representation(self, value):
        return public_asset_url(value)


class CloudinaryPrivateImageField(CloudinaryPublicImageField):
    """Authenticated Cloudinary asset: returns a short-lived signed URL.

    Use only for identity documents. The emitted URL is signed and expires,
    so it is never a permanent public link.
    """

    def __init__(self, expires_in=None, **kwargs):
        self.expires_in = expires_in
        super().__init__(**kwargs)

    def to_representation(self, value):
        return private_asset_url(value, expires_in=self.expires_in)


class CloudinaryPrivateFileField(serializers.FileField):
    """Authenticated Cloudinary file field for private non-image documents."""

    def __init__(self, expires_in=None, **kwargs):
        kwargs.setdefault("required", False)
        kwargs.setdefault("allow_null", True)
        self.expires_in = expires_in
        super().__init__(**kwargs)

    def to_representation(self, value):
        return private_asset_url(value, expires_in=self.expires_in)


class CloudinaryPublicUrlField(CloudinaryPublicImageField):
    """Read-only variant for nested ``SerializerMethodField`` style usage."""

    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        kwargs.pop("required", None)
        kwargs.pop("allow_null", None)
        super().__init__(**kwargs)