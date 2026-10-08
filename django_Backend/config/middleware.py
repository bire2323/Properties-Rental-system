"""Middleware that converts Cloudinary failures into safe JSON API errors.

Uploads happen inline during ``Model.save()`` (``CloudinaryField.pre_save``),
so a Cloudinary API rejection — bad credentials, quota, network outage —
escapes the DRF view as an unhandled exception and Django would otherwise
return an opaque 500 page. The exception is logged in full on the server and
API clients receive a short, non-sensitive ``detail`` message they can surface
to the user.
"""

import logging

from django.http import JsonResponse

from config.cloudinary_errors import is_cloudinary_failure


logger = logging.getLogger(__name__)

UPLOAD_FAILURE_DETAIL = (
    "The image upload could not be completed because the file storage service "
    "is currently unavailable. Please try again later."
)


class CloudinaryErrorMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if not is_cloudinary_failure(exception):
            return None

        logger.error(
            "Cloudinary operation failed for %s %s",
            request.method,
            request.path,
            exc_info=exception,
        )

        # API clients (React app, DRF consumers) expect JSON. Non-API paths
        # such as the Django admin keep Django's standard error handling.
        if request.path.startswith("/api/"):
            return JsonResponse({"detail": UPLOAD_FAILURE_DETAIL}, status=502)
        return None
