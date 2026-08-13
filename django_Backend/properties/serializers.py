from rest_framework import serializers
import logging
from decimal import Decimal, InvalidOperation

logger = logging.getLogger(__name__)
from .models import Property, House, Car, PropertyImage, Feature


class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'name']


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'order']



class HouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = House
        fields = [
            'bedrooms', 
            'bathrooms', 
            'area_sqft', 
            'has_garage', 
            'furnishing_status'
        ]


class CarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = [
            'brand', 
            'car_model', 
            'year', 
            'mileage', 
            'fuel_type', 
            'transmission', 
            'seating_capacity'
        ]


class PropertySerializer(serializers.ModelSerializer):
    """
    Used for retrieving property data (list and detail views).
    Nests the specific child data (house or car) and all associated images.
    The first image (by order) is surfaced as 'main_image'.
    """
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    specific = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()
    images = PropertyImageSerializer(many=True, read_only=True)
    features = FeatureSerializer(many=True, read_only=True)
    rating_summary = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id',
            'owner',
            'owner_email',
            'title',
            'description',
            'price',
            'security_deposit',
            'property_type',
            'location',
            'main_image',
            'features',
            'is_available',
            'specific',      # Dynamically returns house or car fields
            'images',        # List of all property images
            'rating_summary',
            'is_favorite',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['owner', 'owner_email']

    def get_main_image(self, obj):
        """
        Return the first image (ordered by 'order') as the main image.
        The PropertyImage.Meta.ordering = ['order'] ensures correct ordering.
        """
        first_image = obj.images.first()
        if first_image:
            return PropertyImageSerializer(first_image, context=self.context).data
        return None

    def get_specific(self, obj):
        """
        Dynamically return the correct child serializer data
        based on the property_type.
        """
        try:
            if obj.property_type == 'house':
                if isinstance(obj, House):
                    return HouseSerializer(obj).data
                return HouseSerializer(obj.house).data
            elif obj.property_type == 'car':
                if isinstance(obj, Car):
                    return CarSerializer(obj).data
                return CarSerializer(obj.car).data
        except Exception:
            # Some legacy or incomplete rows may exist without a concrete
            # House/Car companion record. The API should not die while serializing.
            return None
        return None

    def get_rating_summary(self, obj):
        average = getattr(obj, 'average_rating', None)
        count = getattr(obj, 'rating_count', 0)
        
        user_rating = None
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # We assume a Prefetch was used with to_attr='user_ratings'
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
    Accepts nested 'specific' data (house or car fields)
    and a list of uploaded image files via 'images'.
    The first uploaded image (order=0) will serve as the main image.
    """
    # Use JSONField so incoming JSON strings in multipart FormData are parsed
    # automatically into Python dicts. DictField would reject JSON strings.
    # Explicitly declare numeric fields to ensure proper validation/coercion
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    security_deposit = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)

    # Use JSONField so incoming JSON strings in multipart FormData are parsed
    # automatically into Python dicts. DictField would reject JSON strings.
    specific = serializers.JSONField(write_only=True)
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
            'title',
            'description',
            'price',
            'security_deposit',
            'property_type',
            'location',
            'specific',
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
        # Ensure price is provided and coercible to Decimal
        # Debug print to trace incoming validated input
        try:
            print('*** PropertyCreateSerializer.validate incoming data ->', data)
        except Exception:
            pass

        price = data.get('price')
        if price in (None, ''):
            raise serializers.ValidationError({'price': 'This field is required.'})
        # coerce string prices to Decimal early so create() sees a Decimal
        if isinstance(price, str):
            try:
                data['price'] = Decimal(price)
            except InvalidOperation:
                raise serializers.ValidationError({'price': 'Enter a valid decimal value.'})
        return data

    def create(self, validated_data):
        """
        Create the base Property, then create the specific child
        (House or Car), and finally create all PropertyImage records.
        The first image (order=0) becomes the main image.
        """
        # Be defensive: allow 'specific' to be optional and default to empty dict
        # Debug print and log validated_data to help debug missing fields
        try:
            print('*** PropertyCreateSerializer.create validated_data ->', validated_data)
        except Exception:
            pass
        logger.debug('PropertyCreateSerializer.create validated_data: %s', validated_data)

        specific_data = validated_data.pop('specific', {}) or {}
        feature_ids = validated_data.pop('feature_ids', [])
        uploaded_images = validated_data.pop('images', [])
        property_type = validated_data.get('property_type')

        # 1. Create the base Property
        property_instance = Property.objects.create(**validated_data)

        # 2. Assign features (M2M must happen after the property exists)
        if feature_ids:
            features = Feature.objects.filter(id__in=feature_ids)
            property_instance.features.set(features)

        # 3. Create the specific child based on property_type
        # Use the parent's primary key (id) when creating multi-table-inherited
        # child records. Passing `property_ptr` can lead to parent fields being
        # overwritten with empty values during the child's save. Creating the
        # child with the same `id` ensures Django links the rows correctly.
        if property_type == 'house':
            # Build a House instance, attach the parent Property, copy parent
            # concrete field values onto the child so any parent-save during
            # the child's save won't overwrite columns with NULLs.
            house = House(**specific_data)
            house.property_ptr = property_instance
            for field in Property._meta.concrete_fields:
                try:
                    setattr(house, field.attname, getattr(property_instance, field.attname))
                except AttributeError:
                    pass
            house.save()
        elif property_type == 'car':
            car = Car(**specific_data)
            car.property_ptr = property_instance
            for field in Property._meta.concrete_fields:
                try:
                    setattr(car, field.attname, getattr(property_instance, field.attname))
                except AttributeError:
                    pass
            car.save()

        # 4. Create PropertyImage records from uploaded files
        for index, image_file in enumerate(uploaded_images):
            PropertyImage.objects.create(
                property=property_instance,
                image=image_file,
                order=index  # First image (order=0) is the main image
            )

        return property_instance

    def update(self, instance, validated_data):
        """
        Update the base Property, update the specific child,
        and handle image replacements (if provided).
        """
        specific_data = validated_data.pop('specific', None) or None
        feature_ids = validated_data.pop('feature_ids', None)
        uploaded_images = validated_data.pop('images', None)

        # 1. Update base Property fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 2. Update features if provided (replaces existing relationships)
        if feature_ids is not None:
            features = Feature.objects.filter(id__in=feature_ids)
            instance.features.set(features)

        # 3. Update the specific child (if provided)
        if specific_data:
            property_type = instance.property_type
            if property_type == 'house':
                # Get the related House instance and update it
                house_instance = instance.house
                for attr, value in specific_data.items():
                    setattr(house_instance, attr, value)
                house_instance.save()
            elif property_type == 'car':
                car_instance = instance.car
                for attr, value in specific_data.items():
                    setattr(car_instance, attr, value)
                car_instance.save()

        # 4. Replace images if new ones are provided
        if uploaded_images is not None:
            instance.images.all().delete()
            for index, image_file in enumerate(uploaded_images):
                PropertyImage.objects.create(
                    property=instance,
                    image=image_file,
                    order=index
                )

        return instance