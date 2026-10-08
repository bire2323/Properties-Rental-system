from django.test import RequestFactory, TestCase
from rest_framework.test import APIClient

from audit.models import AuditLog

from .models import OwnerProfile, OwnerVerificationDocument, Profile, User
from .permissions import CookieJWTAuthentication
from .views import serialize_owner_verification_user


class CookieJWTAuthenticationTests(TestCase):
    def test_invalid_cookie_returns_none_instead_of_raising(self):
        factory = RequestFactory()
        request = factory.get('/api/accounts/google/')
        request.COOKIES = {'access_token': 'not-a-valid-jwt'}

        auth = CookieJWTAuthentication()

        self.assertIsNone(auth.authenticate(request))


class OwnerVerificationPayloadTests(TestCase):
    def test_serialize_owner_verification_user_maps_profile_and_document_fields(self):
        user = User.objects.create_user(
            email='owner@example.com',
            password='StrongPass123',
            first_name='Abebe',
            last_name='Kebede',
            role=User.Role.OWNER,
        )
        Profile.objects.create(
            user=user,
            phone_number='+251911111111',
            city='Addis Ababa',
            country='Ethiopia',
            address='Bole Road 123',
        )
        owner_profile = OwnerProfile.objects.create(
            user=user,
            verification_status=OwnerProfile.VerificationStatus.PENDING,
            can_post_property=False,
        )
        document = OwnerVerificationDocument.objects.create(
            owner_profile=owner_profile,
            document_type=OwnerVerificationDocument.DocumentType.PASSPORT,
            document_number='ET123456',
            document_image='owner_verification_documents/test.jpg',
        )

        request = RequestFactory().get('/api/accounts/admin/verification/')
        payload = serialize_owner_verification_user(user, request)

        self.assertEqual(payload['id'], user.id)
        self.assertEqual(payload['owner'], 'Abebe Kebede')
        self.assertEqual(payload['email'], 'owner@example.com')
        self.assertEqual(payload['document'], 'Passport')
        self.assertEqual(payload['status'], 'Pending')
        self.assertEqual(payload['document_number'], 'ET123456')
        self.assertEqual(payload['phone'], '+251911111111')
        self.assertEqual(payload['document_id'], document.id)


class AdminAllUsersTests(TestCase):
    def test_pending_owner_is_excluded_from_admin_user_list(self):
        admin = User.objects.create_user(
            email='admin@example.com',
            password='StrongPass123',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
        )

        tenant = User.objects.create_user(
            email='tenant@example.com',
            password='StrongPass123',
            first_name='Tenant',
            last_name='User',
            role=User.Role.TENANT,
        )

        pending_owner = User.objects.create_user(
            email='pending-owner@example.com',
            password='StrongPass123',
            first_name='Pending',
            last_name='Owner',
            role=User.Role.OWNER,
        )
        OwnerProfile.objects.create(
            user=pending_owner,
            verification_status=OwnerProfile.VerificationStatus.PENDING,
            can_post_property=False,
        )

        approved_owner = User.objects.create_user(
            email='approved-owner@example.com',
            password='StrongPass123',
            first_name='Approved',
            last_name='Owner',
            role=User.Role.OWNER,
        )
        OwnerProfile.objects.create(
            user=approved_owner,
            verification_status=OwnerProfile.VerificationStatus.APPROVED,
            can_post_property=True,
        )

        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.get('/api/accounts/admin/all-users/')

        self.assertEqual(response.status_code, 200)
        emails = [user['email'] for user in response.data['users']]
        self.assertIn(tenant.email, emails)
        self.assertNotIn(pending_owner.email, emails)
        self.assertIn(approved_owner.email, emails)

    def test_rejecting_owner_verification_changes_role_to_tenant(self):
        admin = User.objects.create_user(
            email='admin2@example.com',
            password='StrongPass123',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        owner = User.objects.create_user(
            email='owner-to-reject@example.com',
            password='StrongPass123',
            first_name='Owner',
            last_name='Reject',
            role=User.Role.OWNER,
        )
        owner_profile = OwnerProfile.objects.create(
            user=owner,
            verification_status=OwnerProfile.VerificationStatus.PENDING,
            can_post_property=False,
        )

        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.patch(
            f'/api/accounts/admin/verification/{owner.id}/',
            {'status': OwnerProfile.VerificationStatus.REJECTED, 'rejection_reason': 'Document not valid'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        owner.refresh_from_db()
        owner_profile.refresh_from_db()
        self.assertEqual(owner.role, User.Role.TENANT)
        self.assertEqual(owner_profile.verification_status, OwnerProfile.VerificationStatus.REJECTED)
        self.assertEqual(owner_profile.rejection_reason, 'Document not valid')


class ProfileSecurityTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='security-admin@example.com',
            password='CurrentPass123!',
            first_name='Security',
            last_name='Admin',
            role=User.Role.ADMIN,
            is_staff=True,
        )
        Profile.objects.create(user=self.user, phone_number='+251911111111')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_profile_json_save_updates_admin_details(self):
        response = self.client.patch(
            '/api/accounts/profile/',
            {'first_name': 'Updated', 'phone_number': '+251922222222'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.profile.phone_number, '+251922222222')

    def test_password_change_requires_correct_current_password(self):
        response = self.client.patch(
            '/api/accounts/profile/',
            {
                'current_password': 'WrongPass123!',
                'new_password': 'NewStrong123!',
                'confirm_password': 'NewStrong123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('current_password', response.data)
        self.assertEqual(response.data['current_password'][0], 'Current password does not match.')

    def test_password_change_requires_strong_password(self):
        response = self.client.patch(
            '/api/accounts/profile/',
            {
                'current_password': 'CurrentPass123!',
                'new_password': 'weakpassword',
                'confirm_password': 'weakpassword',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('new_password', response.data)

    def test_password_change_accepts_valid_password(self):
        response = self.client.patch(
            '/api/accounts/profile/',
            {
                'current_password': 'CurrentPass123!',
                'new_password': 'Aa1!aaaa',
                'confirm_password': 'Aa1!aaaa',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Aa1!aaaa'))


class AdminUserRoleTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='role-admin@example.com',
            password='StrongPass123',
            first_name='Role',
            last_name='Admin',
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        self.tenant = User.objects.create_user(
            email='role-tenant@example.com',
            password='StrongPass123',
            first_name='Role',
            last_name='Tenant',
            role=User.Role.TENANT,
        )
        self.owner = User.objects.create_user(
            email='role-owner@example.com',
            password='StrongPass123',
            first_name='Role',
            last_name='Owner',
            role=User.Role.OWNER,
        )
        OwnerProfile.objects.create(
            user=self.owner,
            verification_status=OwnerProfile.VerificationStatus.APPROVED,
            can_post_property=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def _role_url(self, user):
        return f'/api/accounts/admin/users/{user.id}/role/'

    def test_admin_can_promote_tenant_to_owner(self):
        response = self.client.patch(self._role_url(self.tenant), {'role': 'owner'}, format='json')

        self.assertEqual(response.status_code, 200)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.role, User.Role.OWNER)
        profile = self.tenant.owner_profile
        self.assertEqual(profile.verification_status, OwnerProfile.VerificationStatus.APPROVED)
        self.assertTrue(profile.can_post_property)

    def test_admin_can_demote_owner_to_tenant(self):
        response = self.client.patch(self._role_url(self.owner), {'role': 'tenant'}, format='json')

        self.assertEqual(response.status_code, 200)
        self.owner.refresh_from_db()
        self.assertEqual(self.owner.role, User.Role.TENANT)
        profile = self.owner.owner_profile
        self.assertFalse(profile.can_post_property)
        # Verification history is kept, only posting rights are revoked.
        self.assertEqual(profile.verification_status, OwnerProfile.VerificationStatus.APPROVED)

    def test_non_admin_cannot_change_roles(self):
        tenant_client = APIClient()
        tenant_client.force_authenticate(user=self.tenant)

        response = tenant_client.patch(self._role_url(self.owner), {'role': 'tenant'}, format='json')

        self.assertEqual(response.status_code, 403)
        self.owner.refresh_from_db()
        self.assertEqual(self.owner.role, User.Role.OWNER)

    def test_admin_account_role_is_rejected(self):
        response = self.client.patch(self._role_url(self.admin), {'role': 'tenant'}, format='json')

        self.assertEqual(response.status_code, 400)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.role, User.Role.ADMIN)

    def test_admin_role_value_is_rejected(self):
        response = self.client.patch(self._role_url(self.tenant), {'role': 'admin'}, format='json')

        self.assertEqual(response.status_code, 400)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.role, User.Role.TENANT)

    def test_same_role_is_rejected(self):
        response = self.client.patch(self._role_url(self.tenant), {'role': 'tenant'}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('already has', response.data['detail'])

    def test_unknown_user_returns_404(self):
        response = self.client.patch('/api/accounts/admin/users/999999/role/', {'role': 'owner'}, format='json')

        self.assertEqual(response.status_code, 404)

    def test_role_change_writes_audit_event(self):
        response = self.client.patch(self._role_url(self.tenant), {'role': 'owner'}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            AuditLog.objects.filter(
                action='ADMIN_USER_ROLE_CHANGED',
                target_id=self.tenant.pk,
            ).exists()
        )
