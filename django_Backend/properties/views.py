from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from django.db.models import Q, Avg, Count, Prefetch
from interactions.models import PropertyRating, Favorite
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
    Supports House and Car fields via explicit OneToOne relations.
    """
    permission_classes = [PropertyPermission]
    lookup_field = 'id'

    def get_queryset(self):
        """
        Optimize queries and apply filters.
        """
        queryset = Property.objects.select_related('owner', 'house_detail', 'car_detail').prefetch_related('images', 'features').annotate(
            average_rating=Avg('ratings__rating'),
            rating_count=Count('ratings', distinct=True)
        )

        if self.request.user.is_authenticated:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'ratings',
                    queryset=PropertyRating.objects.filter(user=self.request.user),
                    to_attr='user_ratings'
                ),
                Prefetch(
                    'favorited_by',
                    queryset=Favorite.objects.filter(user=self.request.user),
                    to_attr='user_favorites'
                )
            )

        # --- FILTERING LOGIC ---
        
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(
                Q(city__icontains=location) | 
                Q(address__icontains=location) | 
                Q(country__icontains=location)
            )

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        listing_type = self.request.query_params.get('type')
        if listing_type:
            queryset = queryset.filter(listing_type=listing_type)

        bedrooms = self.request.query_params.get('bedrooms')
        if bedrooms:
            queryset = queryset.filter(
                Q(listing_type='house') & Q(house_detail__bedrooms=bedrooms)
            )

        brand = self.request.query_params.get('brand')
        if brand:
            queryset = queryset.filter(
                Q(listing_type='car') & Q(car_detail__brand__icontains=brand)
            )

        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PropertyCreateSerializer
        return PropertySerializer

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        serializer.save()
