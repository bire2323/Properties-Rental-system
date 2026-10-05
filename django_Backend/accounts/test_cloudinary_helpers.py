import time
from unittest.mock import patch

from cloudinary import CloudinaryResource
from django.test import RequestFactory, SimpleTestCase, TestCase, override_settings

from accounts.models import Notification, Profile, User
from accounts.serializers import ProfileSerializer
from config.cloudinary_helpers import (
    delete_cloudinary_asset,
    private_asset_url,
    public_asset_url,
    same_cloudinary_asset,
)


class CloudinaryUrlHelperTests(SimpleTestCase):
    @override_settings(CLOUDINARY_PRIVATE_URL_TTL=90)
    @patch("config.cloudinary_helpers.private_download_url")
    def test_private_asset_url_is_signed_with_expiration(
        self, private_download_url
    ):
        private_download_url.return_value = "https://signed.example/document"
        asset = CloudinaryResource(
            public_id="getspace/identity/document",
            resource_type="raw",
            type="authenticated",
            format="pdf",
            version=17,
        )

        before = int(time.time())
        result = private_asset_url(asset)
        after = int(time.time())

        self.assertEqual(result, "https://signed.example/document")
        private_download_url.assert_called_once()
        args, kwargs = private_download_url.call_args
        self.assertEqual(args, ("getspace/identity/document", "pdf"))
        self.assertEqual(kwargs["resource_type"], "raw")
        self.assertEqual(kwargs["type"], "authenticated")
        self.assertTrue(before + 90 <= kwargs["expires_at"] <= after + 90)
        self.assertTrue(kwargs["secure"])

    def test_public_helper_refuses_authenticated_resources(self):
        asset = CloudinaryResource(
            public_id="getspace/identity/document",
            resource_type="image",
            type="authenticated",
        )

        self.assertIsNone(public_asset_url(asset))

    def test_public_helper_preserves_legacy_media_paths(self):
        asset = CloudinaryResource(
            public_id="media/profiles/old-avatar.jpg",
            resource_type="image",
            type="upload",
        )

        self.assertEqual(
            public_asset_url(asset),
            "/media/profiles/old-avatar.jpg",
        )

    def test_public_helper_normalizes_legacy_upload_to_path(self):
        asset = CloudinaryResource(
            public_id="booking_documents/booking-1/id-front.pdf",
            resource_type="raw",
            type="authenticated",
        )

        self.assertEqual(
            public_asset_url(asset),
            "/media/booking_documents/booking-1/id-front.pdf",
        )

    def test_same_cloudinary_asset_ignores_version(self):
        old = CloudinaryResource(
            public_id="getspace/properties/house",
            resource_type="image",
            type="upload",
            version=1,
        )
        new = CloudinaryResource(
            public_id="getspace/properties/house",
            resource_type="image",
            type="upload",
            version=2,
        )

        self.assertTrue(same_cloudinary_asset(old, new))

    @patch("config.serializer_fields.private_asset_url")
    def test_profile_private_documents_are_hidden_without_owner_context(
        self, private_asset_url_mock
    ):
        private_asset_url_mock.return_value = "https://signed.example/document"
        user = User(
            email="owner@example.test",
            first_name="Test",
            last_name="Owner",
        )
        user.pk = 123
        profile = Profile(user=user)
        profile.id_front_image = CloudinaryResource(
            public_id="getspace/identity/front",
            resource_type="image",
            type="authenticated",
        )
        profile.id_back_image = CloudinaryResource(
            public_id="getspace/identity/back",
            resource_type="image",
            type="authenticated",
        )

        payload = ProfileSerializer(profile).data

        self.assertIsNone(payload["id_front_image"])
        self.assertIsNone(payload["id_back_image"])

    @patch("config.serializer_fields.private_asset_url")
    def test_profile_owner_receives_private_documents_as_signed_urls(
        self, private_asset_url_mock
    ):
        private_asset_url_mock.side_effect = [
            "https://signed.example/front",
            "https://signed.example/back",
        ]
        user = User(
            email="owner@example.test",
            first_name="Test",
            last_name="Owner",
        )
        user.pk = 123
        profile = Profile(user=user)
        profile.id_front_image = CloudinaryResource(
            public_id="getspace/identity/front",
            resource_type="image",
            type="authenticated",
        )
        profile.id_back_image = CloudinaryResource(
            public_id="getspace/identity/back",
            resource_type="image",
            type="authenticated",
        )
        request = RequestFactory().get("/")
        request.user = user

        payload = ProfileSerializer(profile, context={"request": request}).data

        self.assertEqual(
            payload["id_front_image"],
            "https://signed.example/front",
        )
        self.assertEqual(
            payload["id_back_image"],
            "https://signed.example/back",
        )


class CloudinaryAssetReferenceTests(TestCase):
    @patch("cloudinary.uploader.destroy")
    def test_asset_is_retained_while_booking_snapshot_references_it(
        self, destroy
    ):
        asset = CloudinaryResource(
            public_id="getspace/properties/property-image",
            version=17,
            format="jpg",
            resource_type="image",
            type="upload",
        )
        Notification.objects.create(
            title="Booking notification",
            property_image=(
                "https://res.cloudinary.com/demo/image/upload/v17/"
                "getspace/properties/property-image.jpg"
            ),
        )

        deleted = delete_cloudinary_asset(asset)

        self.assertFalse(deleted)
        destroy.assert_not_called()
