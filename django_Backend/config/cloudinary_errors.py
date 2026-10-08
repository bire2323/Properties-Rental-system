"""Detect exceptions raised while talking to Cloudinary.

``CloudinaryField.pre_save`` performs the upload inline during ``Model.save()``
with no error handling of its own, so any Cloudinary API or network failure
propagates out of the view as an unhandled exception. This module gives the
middleware a single, precise way to recognise those failures so they can be
logged server-side and reported to the client as a safe JSON error instead of
an opaque 500 page.
"""

import cloudinary.exceptions


def _raised_inside_cloudinary(exc):
    """True when any frame of *exc*'s traceback belongs to the cloudinary package.

    Transport failures (connection reset, timeout) surface as ``requests``
    exceptions whose traceback still passes through ``cloudinary.uploader`` /
    ``cloudinary.api_client``, which distinguishes them from unrelated network
    errors raised by other integrations (payments, email, Google auth).
    """
    traceback = exc.__traceback__
    while traceback is not None:
        parts = traceback.tb_frame.f_code.co_filename.replace("\\", "/").split("/")
        # A directory component named "cloudinary" — not this project's
        # config/cloudinary_*.py helper modules, which are plain file names.
        if "cloudinary" in parts[:-1]:
            return True
        traceback = traceback.tb_next
    return False


def is_cloudinary_failure(exc):
    """Return True when *exc* represents a failed Cloudinary operation."""
    if isinstance(exc, cloudinary.exceptions.Error):
        return True
    return _raised_inside_cloudinary(exc)
