from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Q, Avg, Count, Prefetch
from interactions.models import PropertyRating, Favorite
from .models import Property, Feature, Company, CompanyVerificationDocument
from .permissions import PropertyPermission, CompanyPermission, CompanyDocumentPermission
from .serializers import (
    PropertySerializer,
    PropertyCreateSerializer,
    FeatureSerializer,
    CompanySerializer,
    CompanyWriteSerializer,
    CompanyVerificationDocumentSerializer,
)


class FeatureListView(ListAPIView):
    """Read-only list of available property features/amenities."""
    queryset = Feature.objects.all()
    serializer_class = FeatureSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class PropertyViewSet(viewsets.ModelViewSet):
    """A ViewSet for viewing and editing property listings."""
    permission_classes = [PropertyPermission]
    lookup_field = 'id'

    def get_queryset(self):
        queryset = Property.objects.select_related(
            'owner',
            'company',
            'house_detail',
            'car_detail',
        ).prefetch_related(
            'images',
            'features',
        ).annotate(
            average_rating=Avg('ratings__rating'),
            rating_count=Count('ratings', distinct=True),
        )

        if self.request.user.is_authenticated:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'ratings',
                    queryset=PropertyRating.objects.filter(user=self.request.user),
                    to_attr='user_ratings',
                ),
                Prefetch(
                    'favorited_by',
                    queryset=Favorite.objects.filter(user=self.request.user),
                    to_attr='user_favorites',
                ),
            )

        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(
                Q(city__icontains=location) |
                Q(address__icontains=location) |
                Q(region__icontains=location)
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


class CompanyViewSet(viewsets.ModelViewSet):
    """CRUD for Company objects and managed-company lookup."""
    permission_classes = [CompanyPermission]
    lookup_field = 'id'
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Company.objects.prefetch_related('managers').order_by('name')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CompanyWriteSerializer
        return CompanySerializer

    @staticmethod
    def _managed_company_queryset(user):
        return Company.objects.filter(managers=user).prefetch_related('managers').order_by('name')

    @staticmethod
    def _serialize_company_list(user):
        queryset = CompanyViewSet._managed_company_queryset(user)
        serializer = CompanySerializer(queryset, many=True)
        return serializer.data

    @property
    def paginator(self):
        return None

    def my_companies(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        if request.user.role == 'admin':
            companies = self.get_queryset()
        else:
            companies = self._managed_company_queryset(request.user)

        serializer = CompanySerializer(companies, many=True, context={'request': request})
        return Response(serializer.data)

    def perform_create(self, serializer):
        company = serializer.save()
        company.managers.add(self.request.user)


class CompanyDocumentViewSet(viewsets.ModelViewSet):
    """Used for secure company verification document management."""
    serializer_class = CompanyVerificationDocumentSerializer
    permission_classes = [CompanyDocumentPermission]
    lookup_field = 'id'
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        company_id = self.kwargs.get('company_id')
        if company_id is None:
            return CompanyVerificationDocument.objects.none()
        return CompanyVerificationDocument.objects.filter(company_id=company_id).select_related('company')

    def get_company(self):
        company_id = self.kwargs.get('company_id')
        if not company_id:
            return None
        return Company.objects.filter(pk=company_id).first()

    def _ensure_company_access(self, request):
        company = self.get_company()
        if not company:
            return None, Response({'detail': 'Company not found.'}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role != 'admin' and not company.managers.filter(pk=request.user.pk).exists():
            return None, Response({'detail': 'You are not a manager of this company.'}, status=status.HTTP_403_FORBIDDEN)
        return company, None

    def list(self, request, *args, **kwargs):
        company, error = self._ensure_company_access(request)
        if error:
            return error
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        company, error = self._ensure_company_access(request)
        if error:
            return error
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={'request': request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        company, error = self._ensure_company_access(request)
        if error:
            return error

        payload = request.data.copy()
        payload['company'] = company.id
        serializer = self.get_serializer(data=payload, context={'request': request})
        serializer.is_valid(raise_exception=True)
        document = serializer.save(company=company)
        return Response(CompanyVerificationDocumentSerializer(document, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        company, error = self._ensure_company_access(request)
        if error:
            return error
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        company, error = self._ensure_company_access(request)
        if error:
            return error
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        company, error = self._ensure_company_access(request)
        if error:
            return error
        return super().destroy(request, *args, **kwargs)
