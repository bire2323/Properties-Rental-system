"""Reusable DRF serializer fields for Cloudinary-backed model fields.

``CloudinaryField`` is a CharField subclass whose ``from_db_value`` returns a
``CloudinaryResource``. DRF does not know how to render that, so every
serializer exposing an image must declare one of the fields below explicitly
instead of relying on ``ModelSerializer`` auto-mapping (which would emit the
bare ``public_id`` rather than a URL).
"""

import json
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

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


class CoordinateField(serializers.DecimalField):
    """GPS coordinate that tolerates raw device precision.

    Browser geolocation hands back 10-15 decimal places while the model
    stores 6 (about 11 cm). The value is rounded to 6 decimal places
    *before* DRF's digit validation, so ``8.987654321098765`` is accepted
    and stored as ``8.987654`` instead of being rejected with
    "no more than 6 decimal places" errors. Values with an absurd number
    of digits still fail validation afterwards, keeping the field's
    ``max_digits`` guard intact.
    """

    NORMALIZED_QUANTUM = Decimal("0.000001")

    def __init__(self, **kwargs):
        kwargs.setdefault("max_digits", 9)
        kwargs.setdefault("decimal_places", 6)
        kwargs.setdefault("required", False)
        kwargs.setdefault("allow_null", True)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        try:
            value = Decimal(str(data))
        except (InvalidOperation, ValueError, TypeError):
            # Not a number at all: let DecimalField emit its standard error.
            return super().to_internal_value(data)
        if value.is_finite():
            try:
                data = value.quantize(self.NORMALIZED_QUANTUM, rounding=ROUND_HALF_UP)
            except InvalidOperation:
                # Magnitude too large to quantize: fall through so the
                # normal max_digits validation rejects it.
                pass
        return super().to_internal_value(data)


class JSONListField(serializers.ListField):
    """ListField that also accepts a JSON-encoded array as a single string.

    Multipart forms routinely send arrays as one ``JSON.stringify`` part
    (``feature_names=["wifi","fence"]``); DRF's plain ListField reads that
    shape through ``getlist`` and would treat the whole string as a single
    item -- creating one feature literally named ``["wifi","fence"]``.
    Parse that shape before child validation while leaving real lists and
    JSON-body payloads untouched.
    """

    def get_value(self, dictionary):
        value = super().get_value(dictionary)
        if isinstance(value, str):
            parsed = self._parse_json_array(value)
            return parsed if parsed is not None else value
        if isinstance(value, (list, tuple)) and len(value) == 1 and isinstance(value[0], str):
            parsed = self._parse_json_array(value[0])
            if parsed is not None:
                return parsed
        return value

    @staticmethod
    def _parse_json_array(text):
        text = text.strip()
        if not text.startswith("["):
            return None
        try:
            parsed = json.loads(text)
        except ValueError:
            return None
        return parsed if isinstance(parsed, list) else None