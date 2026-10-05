"""Helpers for resolving Cloudinary asset URLs.

Two kinds of Cloudinary assets exist in this project:

* **public** images (property galleries, vehicle photos, avatars, site logo,
  company logos, payment method logos) which are delivered straight from
  ``res.cloudinary.com`` and can be rendered in an ``<img>`` tag.
* **private** identity documents (national ID front/back, owner verification
  documents, company verification documents, booking applicant documents)
  which are uploaded with ``type="authenticated"`` and therefore need a
  short-lived signed URL. These must never be exposed publicly.

Both helpers tolerate legacy rows that still hold local-disk paths such as
``/media/properties/2026/08/13/example.jpg`` so that a migration can be done
row by row without breaking the responses in the meantime.
"""

import logging
import re
import time

from cloudinary import CloudinaryResource
from cloudinary.models import CloudinaryField
from cloudinary.utils import private_download_url
from django.apps import apps
from django.conf import settings
from django.db import models


logger = logging.getLogger(__name__)
_MEDIA_SNAPSHOT_FIELD_NAMES = {"property_image", "property_images"}

# Matches "image/upload/v1234567890/getspace/properties/example" as written
# by CloudinaryField.get_prep_value(), including the optional ".format" tail.
_CLOUDINARY_DB_RE = re.compile(
    r"^(?P<resource_type>image|raw|video)/"
    r"(?P<type>upload|private|authenticated)/"
    r"(?:v(?P<version>\d+)/)?"
    r"(?P<public_id>.+?)"
    r"(?:\.(?P<format>[^.]+))?$"
)

_LEGACY_RELATIVE_PREFIXES = (
    "profiles/",
    "national_ids/",
    "owner_verification_documents/",
    "companies/logos/",
    "company_verification_documents/",
    "properties/",
    "booking_documents/",
    "site/logo/",
    "site/payment-methods/",
    "settings/",
)
_LEGACY_PREFIXES = ("/media/", "media/", *_LEGACY_RELATIVE_PREFIXES,)


def _looks_legacy(path):
    return bool(path) and str(path).lstrip("/").startswith(
        ("media/", *_LEGACY_RELATIVE_PREFIXES)
    )


def is_cloudinary_reference(value):
    """True when *value* is a real Cloudinary reference, not a legacy path.

    ``CloudinaryField.from_db_value`` parses *any* string into a
    ``CloudinaryResource``, including legacy ``/media/...`` rows left over
    from before the migration. Those get a public_id that still starts with
    ``media/``, so they are rejected here rather than being rendered as a
    Cloudinary URL that would 404.
    """
    if isinstance(value, CloudinaryResource):
        return not _looks_legacy(value.public_id)
    if not isinstance(value, str) or not value:
        return False
    if value.startswith(("http://", "https://")) or _looks_legacy(value):
        return False
    return bool(_CLOUDINARY_DB_RE.match(value))


def legacy_media_path(value):
    """Return the legacy ``/media/...`` path held by *value*, or None."""
    if isinstance(value, CloudinaryResource):
        path = value.public_id or ""
        if _looks_legacy(path):
            normalized = path.lstrip("/")
            if normalized.startswith("media/"):
                return f"/{normalized}"
            return f"/media/{normalized}"
        return None
    if isinstance(value, str) and _looks_legacy(value):
        normalized = value.lstrip("/")
        if normalized.startswith("media/"):
            return f"/{normalized}"
        return f"/media/{normalized}"
    return None


def is_legacy_media_reference(value):
    """True for pre-Cloudinary rows still pointing at the local MEDIA_ROOT."""
    if isinstance(value, CloudinaryResource):
        return bool(legacy_media_path(value))
    if not isinstance(value, str) or not value:
        return False
    return value.startswith(_LEGACY_PREFIXES)


def _coerce_resource(value):
    """Return a CloudinaryResource for *value*, or None when not Cloudinary."""
    if isinstance(value, CloudinaryResource):
        return value
    if not isinstance(value, str) or not value:
        return None
    match = _CLOUDINARY_DB_RE.match(value)
    if not match:
        return None
    return CloudinaryResource(
        type=match.group("type"),
        resource_type=match.group("resource_type"),
        version=match.group("version"),
        public_id=match.group("public_id"),
        format=match.group("format"),
    )


def same_cloudinary_asset(left, right):
    """Compare Cloudinary values by delivery identity, ignoring version."""
    left_resource = _coerce_resource(left)
    right_resource = _coerce_resource(right)
    if left_resource is None and hasattr(left, "name"):
        left_resource = _coerce_resource(left.name)
    if right_resource is None and hasattr(right, "name"):
        right_resource = _coerce_resource(right.name)
    return bool(
        left_resource
        and right_resource
        and left_resource.public_id == right_resource.public_id
        and (left_resource.resource_type or "image")
        == (right_resource.resource_type or "image")
        and (left_resource.type or "upload") == (right_resource.type or "upload")
    )


def public_asset_url(value):
    """Return a browser-usable URL for a public Cloudinary asset.

    Handles the value shapes this project actually stores: a Django
    ``FieldFile``, a ``CloudinaryResource`` (what ``CloudinaryField`` returns on
    read), a Cloudinary DB reference string, or a legacy ``/media/...`` path.

    Returns None for empty values and normalizes legacy upload paths to
    ``/media/...`` so the frontend can keep using its existing API-base logic.
    """
    if not value:
        return None

    if isinstance(value, CloudinaryResource):
        legacy = legacy_media_path(value)
        if legacy:
            return legacy
        if value.type != "upload":
            return None
        return value.url

    # Django FieldFile (e.g. still an ImageField, or a legacy value).
    if hasattr(value, "url"):
        try:
            return value.url
        except (ValueError, OSError):
            return None

    if isinstance(value, str):
        if value.startswith(("http://", "https://")):
            return value
        legacy = legacy_media_path(value)
        if legacy:
            return legacy
        resource = _coerce_resource(value)
        if resource is not None:
            if resource.type != "upload":
                return None
            return public_asset_url(resource)
        # Legacy local-disk reference: leave it relative. The frontend already
        # prefixes the API base URL for these.
        return value or None

    return None


def private_asset_url(value, expires_in=None):
    """Return a signed, expiring URL for an ``authenticated`` Cloudinary asset.

    Legacy paths remain relative for backward compatibility; arbitrary or
    public URLs are not returned because that could expose a private document.
    """
    legacy = legacy_media_path(value)
    if legacy:
        return legacy

    resource = _coerce_resource(value)
    if resource is None:
        if hasattr(value, "name"):
            resource = _coerce_resource(value.name)
        if resource is None:
            return None

    if expires_in is None:
        expires_in = getattr(settings, "CLOUDINARY_PRIVATE_URL_TTL", 300)

    resource_type = resource.resource_type or "image"
    delivery_type = resource.type or "authenticated"
    if delivery_type not in ("authenticated", "private"):
        logger.warning(
            "Refusing to create a private URL for Cloudinary delivery type %s",
            delivery_type,
        )
        return None

    expires_at = int(time.time()) + max(int(expires_in), 1)
    return private_download_url(
        resource.public_id,
        resource.format,
        resource_type=resource_type,
        type=delivery_type,
        expires_at=expires_at,
        secure=True,
    )


def _asset_is_referenced(resource):
    """Check all Cloudinary fields before deleting an asset that may be shared."""
    for model in apps.get_models():
        for field in model._meta.concrete_fields:
            is_cloudinary_field = isinstance(field, CloudinaryField)
            is_media_snapshot = (
                field.name in _MEDIA_SNAPSHOT_FIELD_NAMES
                and isinstance(field, (models.CharField, models.TextField))
            )
            if not is_cloudinary_field and not is_media_snapshot:
                continue
            try:
                references = (
                    model._base_manager.filter(
                        **{f"{field.name}__contains": resource.public_id}
                    )
                    .values_list(field.attname, flat=True)
                    .iterator()
                )
                for reference in references:
                    if is_media_snapshot and reference:
                        return True
                    other = _coerce_resource(reference)
                    if (
                        other
                        and other.public_id == resource.public_id
                        and (other.resource_type or "image")
                        == (resource.resource_type or "image")
                        and (other.type or "upload")
                        == (resource.type or "upload")
                    ):
                        return True
            except Exception:
                logger.exception(
                    "Could not verify references for Cloudinary asset %s",
                    resource.public_id,
                )
                return True
    return False


def delete_cloudinary_asset(value, resource_type="image", delivery_type="upload"):
    """Best-effort removal of a Cloudinary asset.

    Only acts on genuine Cloudinary references, so legacy ``/media/...`` rows
    are left alone. Returns True when a delete call succeeded.
    """
    import cloudinary
    resource = _coerce_resource(value)
    if resource is None:
        if hasattr(value, "name"):
            resource = _coerce_resource(value.name)
    if resource is None:
        return False

    if _asset_is_referenced(resource):
        logger.info(
            "Keeping Cloudinary asset %s because another database field references it",
            resource.public_id,
        )
        return False

    try:
        result = cloudinary.uploader.destroy(
            resource.public_id,
            resource_type=resource.resource_type or resource_type,
            type=resource.type or delivery_type,
            invalidate=True,
        )
    except Exception as exc:  # network/permission problems must not block saves
        logger.warning("Cloudinary delete failed for %s: %s", resource.public_id, exc)
        return False

    return result.get("result") == "ok"