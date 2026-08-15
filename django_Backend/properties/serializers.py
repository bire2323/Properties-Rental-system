from rest_framework import serializers
from django.db import transaction
import logging
from decimal import Decimal, InvalidOperation

logger = logging.getLogger(__name__)
from .models import Property, HouseDetail, CarDetail, PropertyImage, Feature

class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'name']

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'order']

class HouseDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseDetail
        fields = [
            'bedrooms', 
            'bathrooms', 
            'area_sqft', 
            'furnishing',
            'floor_number',
            'room_number'
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
            'seating_capacity'
        ]

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
    
    house_detail = HouseDetailSerializer(read_only=True)
    car_detail = CarDetailSerializer(read_only=True)

    class Meta:
        model = Property
        fields = [
            'id',
            'owner',
            'owner_email',
            'property_name',
            'description',
            'listing_type',
            'price',
            'rental_unit',
            'security_deposit',
            'address',
            'city',
            'country',
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
            'updated_at'
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
            "user_rating": user_rating
        }

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if hasattr(obj, 'user_favorites'):
                return len(obj.user_favorites) > 0
            return obj.favorited_by.filter(user=request.user).exists()
        return False


class PropertyCreateSerializer(serializers.ModelSerializer):
    """
    Used for creating and updating properties.
    """
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    security_deposit = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

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
        default=[]
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
            'address',
            'city',
            'country',
            'latitude',
            'longitude',
            'status',
            'is_available',
            'house_detail',
            'car_detail',
            'feature_ids',
            'images'
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

    def validate(self, data):
        price = data.get('price')
        if price in (None, ''):
            raise serializers.ValidationError({'price': 'This field is required.'})
        if isinstance(price, str):
            try:
                data['price'] = Decimal(price)
            except InvalidOperation:
                raise serializers.ValidationError({'price': 'Enter a valid decimal value.'})
                
        listing_type = data.get('listing_type') or (self.instance.listing_type if self.instance else None)
        house_detail = data.get('house_detail')
        car_detail = data.get('car_detail')

        if listing_type == 'house':
            if not house_detail and not self.instance:
                raise serializers.ValidationError({'house_detail': 'House detail is required for a house listing.'})
            if car_detail:
                raise serializers.ValidationError({'car_detail': 'Car detail should not be provided for a house listing.'})
        elif listing_type == 'car':
            if not car_detail and not self.instance:
                raise serializers.ValidationError({'car_detail': 'Car detail is required for a car listing.'})
            if house_detail:
                raise serializers.ValidationError({'house_detail': 'House detail should not be provided for a car listing.'})

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
                order=index
            )

        return property_instance

    @transaction.atomic
    def update(self, instance, validated_data):
        house_detail_data = validated_data.pop('house_detail', None)
        car_detail_data = validated_data.pop('car_detail', None)
        feature_ids = validated_data.pop('feature_ids', None)
        uploaded_images = validated_data.pop('images', None)

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

        if uploaded_images is not None:
            instance.images.all().delete()
            for index, image_file in enumerate(uploaded_images):
                PropertyImage.objects.create(
                    property=instance,
                    image=image_file,
                    order=index
                )

        return instance