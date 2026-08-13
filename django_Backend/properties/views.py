from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .models import Property, Feature
from .permissions import PropertyPermission
from .serializers import PropertySerializer, PropertyCreateSerializer, FeatureSerializer


class FeatureListView(ListAPIView):
    """Read-only list of available property features/amenities."""
    queryset = Feature.objects.all()
    serializer_class = FeatureSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class PropertyViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and editing property listings.
    Supports House, Car, and their specific fields via inheritance.
    """
    permission_classes = [PropertyPermission]
    lookup_field = 'id'

    def get_queryset(self):
        """
        Optimize queries and apply filters.
        - select_related('owner'): Fetches owner data in the same query.
        - prefetch_related('images'): Fetches all images in a separate efficient query.
        """
        queryset = Property.objects.select_related('owner').prefetch_related('images', 'features')

        # --- FILTERING LOGIC (for search/query params) ---
        # Example: /api/properties/?location=Addis&min_price=500&max_price=2000&type=house&bedrooms=3

        # 1. Filter by location (case-insensitive partial match)
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)

        # 2. Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # 3. Filter by property type (house or car)
        property_type = self.request.query_params.get('type')
        if property_type:
            queryset = queryset.filter(property_type=property_type)

        # 4. Advanced filter for specific child fields (bedrooms for houses, brand for cars)
        bedrooms = self.request.query_params.get('bedrooms')
        if bedrooms:
            # Only filter houses with the exact number of bedrooms
            # We use Q objects to join the House table
            queryset = queryset.filter(
                Q(property_type='house') & Q(house__bedrooms=bedrooms)
            )

        brand = self.request.query_params.get('brand')
        if brand:
            queryset = queryset.filter(
                Q(property_type='car') & Q(car__brand__icontains=brand)
            )

        # 5. Only show available properties to non-owners (optional)
        # If you want tenants to see only available ones, uncomment:
        # if not self.request.user.is_staff and not self.request.user.is_authenticated:
        #     queryset = queryset.filter(is_available=True)

        # Order by newest first
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        """
        Use the read-only serializer for GET requests,
        and the write serializer for POST, PUT, PATCH.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return PropertyCreateSerializer
        return PropertySerializer

    # Ensure the view can accept multipart/form-data (files + JSON fields)
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        """
        Automatically set the property's owner to the currently logged-in user.
        The serializer handles the rest (creating house/car and images).
        """
        # Temporary debug: print incoming parsed request data and files
        try:
            print('*** perform_create: request.data ->', self.request.data)
            print('*** perform_create: request.FILES ->', self.request.FILES)
        except Exception:
            pass

        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        """
        For updates, the serializer's update() method handles the nested
        'specific' and 'image_urls' fields. We just pass the instance.
        """
        serializer.save()

    # Delete permission is enforced at the permission layer through the
    # default DRF object-level permission flow. The ViewSet no longer needs
    # an ad hoc delete guard copied into the endpoint method.
