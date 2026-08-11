from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase

from .models import House, Property

User = get_user_model()


class PropertyPermissionTests(APITestCase):
    def setUp(self):
        self.client = APIClient()

        self.tenant_user = User.objects.create_user(
            email='tenant@example.com',
            password='password123',
            first_name='Tenant',
            last_name='User',
            role=User.Role.TENANT,
            is_verified=True,
        )
        self.owner_1 = User.objects.create_user(
            email='owner1@example.com',
            password='password123',
            first_name='Owner',
            last_name='One',
            role=User.Role.OWNER,
            is_verified=True,
        )
        self.owner_2 = User.objects.create_user(
            email='owner2@example.com',
            password='password123',
            first_name='Owner',
            last_name='Two',
            role=User.Role.OWNER,
            is_verified=True,
        )
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='password123',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
            is_verified=True,
        )

        self.property_1 = House.objects.create(
            owner=self.owner_1,
            title='Property 1',
            description='First property',
            price=Decimal('1000.00'),
            security_deposit=Decimal('250.00'),
            property_type='house',
            location='Addis',
            main_image='https://example.com/prop-1.jpg',
            is_available=True,
            bedrooms=2,
            bathrooms=1,
            area_sqft=120,
            has_garage=False,
            furnishing_status='unfurnished',
        )
        self.property_2 = House.objects.create(
            owner=self.owner_2,
            title='Property 2',
            description='Second property',
            price=Decimal('1200.00'),
            security_deposit=Decimal('250.00'),
            property_type='house',
            location='Addis Ababa',
            main_image='https://example.com/prop-2.jpg',
            is_available=True,
            bedrooms=3,
            bathrooms=2,
            area_sqft=160,
            has_garage=True,
            furnishing_status='semi-furnished',
        )

    def get_property_payload(self):
        return {
            'title': 'Created Property',
            'description': 'A property being created via API',
            'price': '500.00',
            'security_deposit': '100.00',
            'property_type': 'house',
            'location': 'Addis',
            'main_image': 'https://example.com/new.jpg',
            'specific': {
                'bedrooms': 2,
                'bathrooms': 2,
                'area_sqft': 100,
                'has_garage': False,
                'furnishing_status': 'unfurnished'
            },
            'image_urls': []
        }

    def test_safe_property_reading_stays_public(self):
        response = self.client.get('/api/properties/')
        self.assertEqual(response.status_code, 200)

        response = self.client.get(f'/api/properties/{self.property_1.id}/')
        self.assertEqual(response.status_code, 200)

    def test_tenant_cannot_create_property(self):
        self.client.force_authenticate(self.tenant_user)
        response = self.client.post('/api/properties/', self.get_property_payload(), format='json')
        self.assertEqual(response.status_code, 403)

    def test_owner_and_admin_can_create_property_and_owner_is_request_user(self):
        owner_payload = self.get_property_payload()
        self.client.force_authenticate(self.owner_1)
        response = self.client.post('/api/properties/', owner_payload, format='json')
        self.assertEqual(response.status_code, 201)
        created_property = Property.objects.get(id=response.data['id'])
        self.assertEqual(created_property.owner, self.owner_1)

        admin_payload = self.get_property_payload()
        self.client.force_authenticate(self.admin_user)
        response = self.client.post('/api/properties/', admin_payload, format='json')
        self.assertEqual(response.status_code, 201)
        created_property = Property.objects.get(id=response.data['id'])
        self.assertEqual(created_property.owner, self.admin_user)

    def test_owner_can_update_only_own_property_and_admin_can_update_any(self):
        self.client.force_authenticate(self.owner_1)
        update_payload = {
            'title': 'Updated by owner 1',
            'description': 'Owner 1 update',
            'price': '1500.00',
            'security_deposit': '300.00',
            'property_type': 'house',
            'location': 'Addis',
            'main_image': 'https://example.com/updated.jpg',
            'specific': {
                'bedrooms': 3,
                'bathrooms': 2,
                'area_sqft': 160,
                'has_garage': True,
                'furnishing_status': 'furnished'
            },
            'image_urls': []
        }
        response = self.client.patch(
            f'/api/properties/{self.property_1.id}/',
            update_payload,
            format='json'
        )
        self.assertEqual(response.status_code, 200)

        self.client.force_authenticate(self.owner_2)
        blocked_response = self.client.patch(
            f'/api/properties/{self.property_1.id}/',
            {'title': 'Blocked update'},
            format='json'
        )
        self.assertEqual(blocked_response.status_code, 403)

        self.client.force_authenticate(self.tenant_user)
        blocked_response = self.client.patch(
            f'/api/properties/{self.property_1.id}/',
            {'title': 'Tenant update'},
            format='json'
        )
        self.assertEqual(blocked_response.status_code, 403)

        self.client.force_authenticate(self.admin_user)
        admin_response = self.client.patch(
            f'/api/properties/{self.property_1.id}/',
            {'title': 'Admin update'},
            format='json'
        )
        self.assertEqual(admin_response.status_code, 200)

    def test_owner_can_delete_own_property(self):
        self.client.force_authenticate(self.owner_1)
        own_delete = self.client.delete(f'/api/properties/{self.property_1.id}/')
        self.assertEqual(own_delete.status_code, 204)

    def test_other_owner_cannot_delete_property(self):
        self.client.force_authenticate(self.owner_2)
        other_delete = self.client.delete(f'/api/properties/{self.property_1.id}/')
        self.assertEqual(other_delete.status_code, 403)

    def test_tenant_cannot_delete_property(self):
        self.client.force_authenticate(self.tenant_user)
        tenant_delete = self.client.delete(f'/api/properties/{self.property_2.id}/')
        self.assertEqual(tenant_delete.status_code, 403)

    def test_admin_can_delete_any_property(self):
        self.client.force_authenticate(self.admin_user)
        admin_delete = self.client.delete(f'/api/properties/{self.property_2.id}/')
        self.assertEqual(admin_delete.status_code, 204)
