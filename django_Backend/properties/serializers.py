from rest_framework import serializers
from .models import Property, House, Car, PropertyImage


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
            'is_available',
            'specific',      # Dynamically returns house or car fields
            'images',        # List of all property images
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



class PropertyCreateSerializer(serializers.ModelSerializer):
    """
    Used for creating and updating properties.
    Accepts nested 'specific' data (house or car fields)
    and a list of uploaded image files via 'images'.
    The first uploaded image (order=0) will serve as the main image.
    """
    specific = serializers.DictField(write_only=True)
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
            'images'
        ]

    def create(self, validated_data):
        """
        Create the base Property, then create the specific child
        (House or Car), and finally create all PropertyImage records.
        The first image (order=0) becomes the main image.
        """
        specific_data = validated_data.pop('specific')
        uploaded_images = validated_data.pop('images', [])
        property_type = validated_data.get('property_type')

        # 1. Create the base Property
        property_instance = Property.objects.create(**validated_data)

        # 2. Create the specific child based on property_type
        if property_type == 'house':
            House.objects.create(property_ptr=property_instance, **specific_data)
        elif property_type == 'car':
            Car.objects.create(property_ptr=property_instance, **specific_data)

        # 3. Create PropertyImage records from uploaded files
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
        specific_data = validated_data.pop('specific', None)
        uploaded_images = validated_data.pop('images', None)

        # 1. Update base Property fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 2. Update the specific child (if provided)
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

        # 3. Replace images if new ones are provided
        if uploaded_images is not None:
            instance.images.all().delete()
            for index, image_file in enumerate(uploaded_images):
                PropertyImage.objects.create(
                    property=instance,
                    image=image_file,
                    order=index
                )

        return instance