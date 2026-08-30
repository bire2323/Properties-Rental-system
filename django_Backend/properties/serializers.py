from rest_framework import serializers
from django.db import transaction, models
import logging
import json
from decimal import Decimal, InvalidOperation

logger = logging.getLogger(__name__)
from .models import (
    Property,
    HouseDetail,
    CarDetail,
    PropertyImage,
    Feature,
    Company,
    CompanyVerificationDocument,
    Region,
    City,
)


# ---------------------------------------------------------------------------
# Location — Region & City
# ---------------------------------------------------------------------------

class CitySerializer(serializers.ModelSerializer):
    region_id = serializers.IntegerField(source='region.id', read_only=True)
    region_name = serializers.CharField(source='region.name', read_only=True)

    class Meta:
        model = City
        fields = ['id', 'name', 'region_id', 'region_name']


class RegionSerializer(serializers.ModelSerializer):
    cities = CitySerializer(many=True, read_only=True)

    class Meta:
        model = Region
        fields = ['id', 'name', 'cities']


class RegionAdminSerializer(serializers.ModelSerializer):
    city_count = serializers.SerializerMethodField()
    property_count = serializers.SerializerMethodField()
    company_count = serializers.SerializerMethodField()

    class Meta:
        model = Region
        fields = ['id', 'name', 'city_count', 'property_count', 'company_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_city_count(self, obj):
        return getattr(obj, 'city_count', obj.cities.count())

    def get_property_count(self, obj):
        return getattr(obj, 'property_count', obj.properties.count())

    def get_company_count(self, obj):
        return getattr(obj, 'company_count', obj.companies.count())

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Region name cannot be blank.')
        qs = Region.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(f'A region named "{value}" already exists.')
        return value


class CityAdminSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    property_count = serializers.SerializerMethodField()
    company_count = serializers.SerializerMethodField()

    class Meta:
        model = City
        fields = ['id', 'name', 'region', 'region_name', 'property_count', 'company_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'region_name', 'created_at', 'updated_at']

    def get_property_count(self, obj):
        return getattr(obj, 'property_count', obj.properties.count())

    def get_company_count(self, obj):
        return getattr(obj, 'company_count', obj.companies.count())

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('City name cannot be blank.')
        return value

    def validate(self, data):
        name = data.get('name', getattr(self.instance, 'name', '')).strip()
        region = data.get('region', getattr(self.instance, 'region', None))
        if name and region:
            qs = City.objects.filter(name__iexact=name, region=region)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'name': f'A city named "{name}" already exists in region "{region.name}".'}
                )
        return data


# ---------------------------------------------------------------------------
# Feature & Image
# ---------------------------------------------------------------------------

class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'name']


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'order']


# ---------------------------------------------------------------------------
# Company documents
# ---------------------------------------------------------------------------

class CompanyVerificationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyVerificationDocument
        fields = [
            'id',
            'company',
            'document_type',
            'document_number',
            'document_file',
            'verification_status',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'company', 'created_at', 'updated_at']

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role != 'admin':
            company = self.instance.company if self.instance else data.get('company')
            if company and not company.managers.filter(pk=request.user.pk).exists():
                raise serializers.ValidationError(
                    'You are not allowed to manage documents for this company.'
                )
        return data


# ---------------------------------------------------------------------------
# Company
# ---------------------------------------------------------------------------

class CompanyVerificationDocumentReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyVerificationDocument
        fields = [
            'id',
            'document_type',
            'document_number',
            'document_file',
            'verification_status',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]


class CompanySerializer(serializers.ModelSerializer):
    """Read serializer for company details and public company data."""
    manager_ids = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    city = CitySerializer(read_only=True)
    region = RegionSerializer(read_only=True, default=None)

    # Flattened display helpers for backwards compatibility
    city_name = serializers.CharField(source='city.name', read_only=True, default='')
    region_name = serializers.CharField(source='region.name', read_only=True, default='')

    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'description',
            'logo',
            'contact_email',
            'contact_phone',
            'website',
            'address',
            'city',
            'city_name',
            'region',
            'region_name',
            'is_verified',
            'manager_ids',
            'documents',
            'created_at',
            'updated_at',
        ]

    def get_manager_ids(self, obj):
        return list(obj.managers.values_list('id', flat=True))

    def get_documents(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        from accounts.models import User
        if request.user.role == User.Role.ADMIN or obj.managers.filter(pk=request.user.pk).exists():
            return CompanyVerificationDocumentReadSerializer(
                obj.verification_documents.all(),
                many=True,
                context={'request': request},
            ).data
        return []


class CompanyWriteSerializer(serializers.ModelSerializer):
    """Write serializer for creating/updating companies."""
    city = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.select_related('region').all(),
        required=False,
        allow_null=True,
    )
    region = serializers.PrimaryKeyRelatedField(
        queryset=Region.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Company
        fields = [
            'name',
            'description',
            'logo',
            'contact_email',
            'contact_phone',
            'website',
            'address',
            'region',
            'city',
        ]

    def validate(self, data):
        region = data.get('region') or (self.instance.region if self.instance else None)
        city = data.get('city') or (self.instance.city if self.instance else None)
        if city and region and city.region_id != region.id:
            raise serializers.ValidationError(
                {'city': f'City "{city.name}" does not belong to region "{region.name}".'}
            )
        return data


# ---------------------------------------------------------------------------
# HouseDetail & CarDetail
# ---------------------------------------------------------------------------

class HouseDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseDetail
        fields = [
            'bedrooms',
            'bathrooms',
            'area_sqft',
            'furnishing',
            'room_number',
            'total_rooms',
            'distance_from_main_road',
            'rules_to_follow',
        ]


class CarDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarDetail
        fields = [
            'brand',
            'model',
            'year',
            'mileage',
            'fuel_type',
            'seating_capacity',
        ]


# ---------------------------------------------------------------------------
# Property — read
# ---------------------------------------------------------------------------

class PropertySerializer(serializers.ModelSerializer):
    """
    Used for retrieving property data (list and detail views).
    Nests the specific detail data (house or car) and all associated images.
    """
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    main_image = serializers.SerializerMethodField()
    images = PropertyImageSerializer(many=True, read_only=True)
    features = FeatureSerializer(many=True, read_only=True)
    rating_summary = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    company = CompanySerializer(read_only=True)

    house_detail = HouseDetailSerializer(read_only=True)
    car_detail = CarDetailSerializer(read_only=True)

    # Nested location objects
    city = CitySerializer(read_only=True)
    region = RegionSerializer(read_only=True, default=None)

    # Flat display helpers (city_name, region_name) for backwards compatibility
    city_name = serializers.CharField(source='city.name', read_only=True, default='')
    region_name = serializers.CharField(source='region.name', read_only=True, default='')

    class Meta:
        model = Property
        fields = [
            'id',
            'owner',
            'owner_email',
            'company',
            'property_name',
            'description',
            'listing_type',
            'price',
            'rental_unit',
            'security_deposit',
            'address',
            'city',
            'city_name',
            'region',
            'region_name',
            'kebele',
            'latitude',
            'longitude',
            'status',
            'main_image',
            'features',
            'is_available',
            'house_detail',
            'car_detail',
            'images',
            'rating_summary',
            'is_favorite',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['owner', 'owner_email']

    def get_main_image(self, obj):
        first_image = obj.images.first()
        if first_image:
            return PropertyImageSerializer(first_image, context=self.context).data
        return None

    def get_rating_summary(self, obj):
        average = getattr(obj, 'average_rating', None)
        count = getattr(obj, 'rating_count', 0)

        user_rating = None
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if hasattr(obj, 'user_ratings'):
                if obj.user_ratings:
                    user_rating = obj.user_ratings[0].rating
            else:
                user_rating_obj = obj.ratings.filter(user=request.user).first()
                if user_rating_obj:
                    user_rating = user_rating_obj.rating

        return {
            "average_rating": round(average, 2) if average else None,
            "rating_count": count,
            "user_rating": user_rating,
        }

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if hasattr(obj, 'user_favorites'):
                return len(obj.user_favorites) > 0
            return obj.favorited_by.filter(user=request.user).exists()
        return False


# ---------------------------------------------------------------------------
# Property — write (create / update)
# ---------------------------------------------------------------------------

class PropertyCreateSerializer(serializers.ModelSerializer):
    """
    Used for creating and updating properties.
    """
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    security_deposit = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )
    latitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True
    )
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True
    )

    # company is optional — client passes a company ID
    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        required=False,
        allow_null=True,
    )

    # location FK fields — client passes integer IDs
    city = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.select_related('region').all(),
        required=False,
        allow_null=True,
    )
    region = serializers.PrimaryKeyRelatedField(
        queryset=Region.objects.all(),
        required=False,
        allow_null=True,
    )

    house_detail = serializers.JSONField(write_only=True, required=False, allow_null=True)
    car_detail = serializers.JSONField(write_only=True, required=False, allow_null=True)

    feature_ids = serializers.JSONField(
        write_only=True,
        required=False,
        default=list,
    )
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )
    deleted_image_ids = serializers.JSONField(
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Property
        fields = [
            'property_name',
            'description',
            'listing_type',
            'price',
            'rental_unit',
            'security_deposit',
            'company',
            'address',
            'region',
            'city',
            'kebele',
            'latitude',
            'longitude',
            'status',
            'is_available',
            'house_detail',
            'car_detail',
            'feature_ids',
            'images',
            'deleted_image_ids',
        ]

    def validate_feature_ids(self, value):
        if value in (None, ''):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError('Must be a list of feature IDs.')
        try:
            unique_ids = list(dict.fromkeys(int(item) for item in value))
        except (TypeError, ValueError):
            raise serializers.ValidationError('Each feature ID must be an integer.')
        existing_ids = set(
            Feature.objects.filter(id__in=unique_ids).values_list('id', flat=True)
        )
        missing = set(unique_ids) - existing_ids
        if missing:
            raise serializers.ValidationError(
                f'Invalid feature ID(s): {sorted(missing)}'
            )
        return unique_ids

    def validate_company(self, company):
        """Ensure the requesting user is a manager of the company they attach."""
        if company is None:
            return company
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from accounts.models import User
            if request.user.role == User.Role.ADMIN:
                return company
            if not company.managers.filter(pk=request.user.pk).exists():
                raise serializers.ValidationError(
                    'You are not authorised to create listings for this company.'
                )
        return company

    def validate(self, data):
        price = data.get('price')
        if price in (None, ''):
            raise serializers.ValidationError({'price': 'This field is required.'})
        if isinstance(price, str):
            try:
                data['price'] = Decimal(price)
            except InvalidOperation:
                raise serializers.ValidationError({'price': 'Enter a valid decimal value.'})

        # Validate that City belongs to the submitted Region
        region = data.get('region') or (self.instance.region if self.instance else None)
        city = data.get('city') or (self.instance.city if self.instance else None)
        if city and region and city.region_id != region.id:
            raise serializers.ValidationError(
                {'city': f'City "{city.name}" does not belong to region "{region.name}".'}
            )

        listing_type = data.get('listing_type') or (self.instance.listing_type if self.instance else None)
        house_detail = data.get('house_detail')
        car_detail = data.get('car_detail')

        if listing_type == 'house':
            if not house_detail and not self.instance:
                raise serializers.ValidationError(
                    {'house_detail': 'House detail is required for a house listing.'}
                )
            if car_detail:
                raise serializers.ValidationError(
                    {'car_detail': 'Car detail should not be provided for a house listing.'}
                )
        elif listing_type == 'car':
            if not car_detail and not self.instance:
                raise serializers.ValidationError(
                    {'car_detail': 'Car detail is required for a car listing.'}
                )
            if house_detail:
                raise serializers.ValidationError(
                    {'house_detail': 'House detail should not be provided for a car listing.'}
                )

        return data

    @transaction.atomic
    def create(self, validated_data):
        house_detail_data = validated_data.pop('house_detail', None)
        car_detail_data = validated_data.pop('car_detail', None)
        feature_ids = validated_data.pop('feature_ids', [])
        uploaded_images = validated_data.pop('images', [])
        listing_type = validated_data.get('listing_type')

        property_instance = Property.objects.create(**validated_data)

        if feature_ids:
            features = Feature.objects.filter(id__in=feature_ids)
            property_instance.features.set(features)

        if listing_type == 'house' and house_detail_data:
            HouseDetail.objects.create(property=property_instance, **house_detail_data)
        elif listing_type == 'car' and car_detail_data:
            CarDetail.objects.create(property=property_instance, **car_detail_data)

        for index, image_file in enumerate(uploaded_images):
            PropertyImage.objects.create(
                property=property_instance,
                image=image_file,
                order=index,
            )

        return property_instance

    def validate_deleted_image_ids(self, value):
        """
        Ensure deleted_image_ids is a valid list of integers.
        """
        if value in (None, '', []):
            return []
        if not isinstance(value, list):
            try:
                value = json.loads(value) if isinstance(value, str) else value
            except (json.JSONDecodeError, TypeError):
                raise serializers.ValidationError('deleted_image_ids must be a JSON array of integers.')
        try:
            return [int(id_val) for id_val in value]
        except (TypeError, ValueError):
            raise serializers.ValidationError('Each deleted_image_id must be an integer.')

    @transaction.atomic
    def update(self, instance, validated_data):
        house_detail_data = validated_data.pop('house_detail', None)
        car_detail_data = validated_data.pop('car_detail', None)
        feature_ids = validated_data.pop('feature_ids', None)
        uploaded_images = validated_data.pop('images', None)
        deleted_image_ids = validated_data.pop('deleted_image_ids', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if feature_ids is not None:
            features = Feature.objects.filter(id__in=feature_ids)
            instance.features.set(features)

        listing_type = instance.listing_type
        if listing_type == 'house' and house_detail_data:
            if hasattr(instance, 'house_detail'):
                for attr, value in house_detail_data.items():
                    setattr(instance.house_detail, attr, value)
                instance.house_detail.save()
            else:
                HouseDetail.objects.create(property=instance, **house_detail_data)
        elif listing_type == 'car' and car_detail_data:
            if hasattr(instance, 'car_detail'):
                for attr, value in car_detail_data.items():
                    setattr(instance.car_detail, attr, value)
                instance.car_detail.save()
            else:
                CarDetail.objects.create(property=instance, **car_detail_data)

        # ──────────────────────────────────────────────────────────────────
        # Image handling: preserve existing, add new, delete only specified
        # ──────────────────────────────────────────────────────────────────

        # Delete explicitly marked images (validate they belong to this property)
        if deleted_image_ids:
            images_to_delete = PropertyImage.objects.filter(
                id__in=deleted_image_ids,
                property=instance
            )
            if images_to_delete.count() != len(deleted_image_ids):
                # Validate that all requested IDs exist and belong to this property
                invalid_ids = set(deleted_image_ids) - set(
                    PropertyImage.objects.filter(
                        id__in=deleted_image_ids,
                        property=instance
                    ).values_list('id', flat=True)
                )
                raise serializers.ValidationError(
                    f'Invalid image IDs: {sorted(invalid_ids)}'
                )
            images_to_delete.delete()

        # Add new images (only if user actually uploaded new files)
        if uploaded_images and len(uploaded_images) > 0:
            # Get the next order value after existing images
            max_order = instance.images.aggregate(max_order=models.Max('order'))['max_order'] or -1
            next_order = max_order + 1
            
            for index, image_file in enumerate(uploaded_images):
                PropertyImage.objects.create(
                    property=instance,
                    image=image_file,
                    order=next_order + index,
                )

        return instance
