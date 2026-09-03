from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Avg, Count, Prefetch
from django.db.models.deletion import ProtectedError
from collections import Counter
from interactions.models import PropertyRating, Favorite
from accounts.models import Notification
from site_settings.models import SiteSettings
from audit.models import AuditLog
from audit.services import audit_event
from .models import Property, Feature, Company, CompanyVerificationDocument, ListingType, Region, City, Category
from .permissions import PropertyPermission, CompanyPermission, CompanyDocumentPermission, AdminRolePermission
from .serializers import (
    PropertySerializer,
    PropertyCreateSerializer,
    FeatureSerializer,
    CompanySerializer,
    CompanyWriteSerializer,
    CompanyVerificationDocumentSerializer,
    RegionSerializer,
    RegionAdminSerializer,
    CityAdminSerializer,
    CategoryAdminSerializer,
)


class FeatureListView(ListAPIView):
    """Read-only list of available property features/amenities."""
    queryset = Feature.objects.all()
    serializer_class = FeatureSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class RegionListAPIView(ListAPIView):
    """
    Public endpoint. Returns all Regions with their Cities nested inside.
    Used for cascading Region → City dropdowns in create/edit forms and sidebar filters.
    """
    queryset = Region.objects.prefetch_related('cities').order_by('name')
    serializer_class = RegionSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class ListingNavigationOptionsAPIView(APIView):
    """
    Public endpoint used by the navigation bar and sidebar filters.
    Returns:
      - regions: structured Region → City hierarchy (replaces the old flat `locations` list)
      - brands: unique car brands from active listings
      - fuel_types: unique fuel types from active listings

    The `regions` field is the authoritative location source for all filters.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        # Return all managed regions/cities (not just those with active listings)
        # This ensures new regions admin-created are immediately available
        regions = Region.objects.prefetch_related('cities').order_by('name')

        active_car_properties = Property.objects.filter(
            status='active', is_available=True, listing_type=ListingType.CAR
        )

        car_brands = (
            active_car_properties
            .exclude(car_detail__brand__isnull=True)
            .exclude(car_detail__brand__exact='')
            .values_list('car_detail__brand', flat=True)
            .distinct()
        )

        fuel_types = (
            active_car_properties
            .exclude(car_detail__fuel_type__isnull=True)
            .exclude(car_detail__fuel_type__exact='')
            .values_list('car_detail__fuel_type', flat=True)
            .distinct()
        )

        return Response({
            'regions': RegionSerializer(regions, many=True).data,
            'brands': [{'value': b, 'label': b} for b in sorted(car_brands)],
            'fuel_types': [{'value': ft, 'label': ft.title()} for ft in sorted(fuel_types)],
        })


def _protected_objects_summary(protected_objects):
    counter = Counter(
        (
            obj._meta.verbose_name if hasattr(obj, '_meta') else 'record',
            obj._meta.verbose_name_plural if hasattr(obj, '_meta') else 'records',
        )
        for obj in protected_objects
    )
    return ', '.join(
        f'{count} {plural if count != 1 else singular}'
        for (singular, plural), count in sorted(counter.items(), key=lambda item: item[0][1])
    )


class RegionAdminViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for managed regions."""

    serializer_class = RegionAdminSerializer
    permission_classes = [AdminRolePermission]
    lookup_field = 'id'
    pagination_class = None

    def get_queryset(self):
        return (
            Region.objects
            .annotate(
                city_count=Count('cities', distinct=True),
                property_count=Count('properties', distinct=True),
                company_count=Count('companies', distinct=True),
            )
            .order_by('name')
        )

    def destroy(self, request, *args, **kwargs):
        region = self.get_object()

        if region.cities.exists():
            return Response(
                {
                    'detail': (
                        'This region cannot be deleted because it still contains cities. '
                        'Delete or move its cities first.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            region.delete()
        except ProtectedError as exc:
            summary = _protected_objects_summary(exc.protected_objects)
            message = 'This region cannot be deleted because it is still in use.'
            if summary:
                message = f'This region cannot be deleted because it is still used by {summary}.'
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        audit_event(
            actor=request.user,
            action="ADMIN_REGION_DELETED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="region",
            target_id="",
            target_display=region.name,
            description=f"Admin deleted region '{region.name}'.",
            metadata={"region_name": region.name},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        instance = serializer.save()
        audit_event(
            actor=self.request.user,
            action="ADMIN_REGION_CREATED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="region",
            target_id=instance.pk,
            target_display=instance.name,
            description=f"Admin created region '{instance.name}'.",
            metadata={"region_name": instance.name},
            request=self.request,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        audit_event(
            actor=self.request.user,
            action="ADMIN_REGION_UPDATED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="region",
            target_id=instance.pk,
            target_display=instance.name,
            description=f"Admin updated region '{instance.name}'.",
            metadata={"region_name": instance.name},
            request=self.request,
        )


class CityAdminViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for managed cities."""

    serializer_class = CityAdminSerializer
    permission_classes = [AdminRolePermission]
    lookup_field = 'id'
    pagination_class = None

    def get_queryset(self):
        queryset = (
            City.objects
            .select_related('region')
            .annotate(
                property_count=Count('properties', distinct=True),
                company_count=Count('companies', distinct=True),
            )
            .order_by('region__name', 'name')
        )

        region_id = self.request.query_params.get('region_id')
        if region_id:
            try:
                queryset = queryset.filter(region_id=int(region_id))
            except (TypeError, ValueError):
                pass

        return queryset

    def destroy(self, request, *args, **kwargs):
        city = self.get_object()
        try:
            city.delete()
        except ProtectedError as exc:
            summary = _protected_objects_summary(exc.protected_objects)
            message = 'This city cannot be deleted because it is still in use.'
            if summary:
                message = f'This city cannot be deleted because it is still used by {summary}.'
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        audit_event(
            actor=request.user,
            action="ADMIN_CITY_DELETED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="city",
            target_id="",
            target_display=city.name,
            description=f"Admin deleted city '{city.name}'.",
            metadata={"city_name": city.name},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        instance = serializer.save()
        audit_event(
            actor=self.request.user,
            action="ADMIN_CITY_CREATED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="city",
            target_id=instance.pk,
            target_display=instance.name,
            description=f"Admin created city '{instance.name}'.",
            metadata={"city_name": instance.name, "region": getattr(instance.region, "name", "")},
            request=self.request,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        audit_event(
            actor=self.request.user,
            action="ADMIN_CITY_UPDATED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="city",
            target_id=instance.pk,
            target_display=instance.name,
            description=f"Admin updated city '{instance.name}'.",
            metadata={"city_name": instance.name, "region": getattr(instance.region, "name", "")},
            request=self.request,
        )


class CategoryListAPIView(ListAPIView):
    """
    Public read-only endpoint. Returns active categories for a given listing_type.
    Used by owner listing creation/edit forms so they can populate the category dropdown.
    Query params: ?listing_type=house  or  ?listing_type=car
    """
    serializer_class = CategoryAdminSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = Category.objects.filter(is_active=True)
        listing_type = self.request.query_params.get('listing_type')
        if listing_type:
            qs = qs.filter(listing_type=listing_type)
        return qs.order_by('name')


class CategoryAdminViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for managed categories."""

    serializer_class = CategoryAdminSerializer
    permission_classes = [AdminRolePermission]
    lookup_field = 'id'
    pagination_class = None

    def get_queryset(self):
        qs = (
            Category.objects
            .annotate(property_count=Count('properties', distinct=True))
            .order_by('listing_type', 'name')
        )
        listing_type = self.request.query_params.get('listing_type')
        if listing_type:
            qs = qs.filter(listing_type=listing_type)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(name__icontains=search)

        return qs

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        prop_count = category.properties.count()
        if prop_count > 0:
            return Response(
                {
                    'detail': (
                        f'This category cannot be deleted because it is currently used by '
                        f'{prop_count} listing{"s" if prop_count != 1 else ""}. '
                        f'You can deactivate it instead.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            category.delete()
        except ProtectedError as exc:
            summary = _protected_objects_summary(exc.protected_objects)
            message = 'This category cannot be deleted because it is still in use.'
            if summary:
                message = f'This category cannot be deleted because it is still used by {summary}.'
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        audit_event(
            actor=request.user,
            action="ADMIN_CATEGORY_DELETED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="category",
            target_id="",
            target_display=category.name,
            description=f"Admin deleted category '{category.name}'.",
            metadata={"category_name": category.name},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        instance = serializer.save()
        audit_event(
            actor=self.request.user,
            action="ADMIN_CATEGORY_CREATED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="category",
            target_id=instance.pk,
            target_display=instance.name,
            description=f"Admin created category '{instance.name}' ({instance.listing_type}).",
            metadata={"category_name": instance.name, "listing_type": instance.listing_type},
            request=self.request,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        audit_event(
            actor=self.request.user,
            action="ADMIN_CATEGORY_UPDATED",
            category=AuditLog.Category.ADMIN,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="category",
            target_id=instance.pk,
            target_display=instance.name,
            description=f"Admin updated category '{instance.name}'.",
            metadata={"category_name": instance.name, "listing_type": instance.listing_type},
            request=self.request,
        )


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
            'city',
            'city__region',
            'region',
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

        # ── Location filtering via ForeignKey IDs ──────────────────────────
        region_id = self.request.query_params.get('region_id')
        if region_id:
            try:
                queryset = queryset.filter(region_id=int(region_id))
            except (ValueError, TypeError):
                pass

        city_id = self.request.query_params.get('city_id')
        if city_id:
            try:
                queryset = queryset.filter(city_id=int(city_id))
            except (ValueError, TypeError):
                pass

        # Legacy text-based location search (kept for backwards compatibility)
        location = self.request.query_params.get('location')
        if location and not region_id and not city_id:
            queryset = queryset.filter(
                Q(city__name__icontains=location) |
                Q(address__icontains=location) |
                Q(region__name__icontains=location)
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

        car_model = self.request.query_params.get('model')
        if car_model:
            queryset = queryset.filter(
                Q(listing_type='car') & Q(car_detail__model__icontains=car_model)
            )

        min_year = self.request.query_params.get('min_year')
        if min_year:
            try:
                queryset = queryset.filter(Q(listing_type='car') & Q(car_detail__year__gte=int(min_year)))
            except ValueError:
                pass

        max_year = self.request.query_params.get('max_year')
        if max_year:
            try:
                queryset = queryset.filter(Q(listing_type='car') & Q(car_detail__year__lte=int(max_year)))
            except ValueError:
                pass

        fuel_type = self.request.query_params.get('fuel_type')
        if fuel_type:
            queryset = queryset.filter(
                Q(listing_type='car') & Q(car_detail__fuel_type__iexact=fuel_type)
            )

        seating_capacity = self.request.query_params.get('seating_capacity')
        if seating_capacity:
            try:
                queryset = queryset.filter(Q(listing_type='car') & Q(car_detail__seating_capacity__gte=int(seating_capacity)))
            except ValueError:
                pass

        is_available = self.request.query_params.get('is_available')
        if is_available is not None and is_available != '':
            if is_available in ('true', 'True', '1'):
                queryset = queryset.filter(is_available=True)
            elif is_available in ('false', 'False', '0'):
                queryset = queryset.filter(is_available=False)

        status_param = self.request.query_params.get('status')
        if status_param:
            from .models import ListingStatus
            valid_statuses = {choice[0] for choice in ListingStatus.choices}
            if status_param in valid_statuses:
                queryset = queryset.filter(status=status_param)

        return queryset.order_by('-created_at')


    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PropertyCreateSerializer
        return PropertySerializer

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        property_obj = serializer.save(owner=self.request.user)
        site_settings = SiteSettings.objects.filter(pk=1).first()

        audit_event(
            actor=self.request.user,
            action="PROPERTY_CREATED",
            category=AuditLog.Category.PROPERTY if property_obj.listing_type == ListingType.HOUSE else AuditLog.Category.VEHICLE,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="property",
            target_id=property_obj.pk,
            target_display=property_obj.property_name,
            description=f"Owner {self.request.user.get_full_name().strip() or self.request.user.email} created {'house' if property_obj.listing_type == ListingType.HOUSE else 'vehicle'} listing '{property_obj.property_name}'.",
            previous_state={},
            new_state={"status": property_obj.status, "is_available": property_obj.is_available},
            metadata={"property_name": property_obj.property_name, "listing_type": property_obj.listing_type, "price": str(property_obj.price)},
            request=self.request,
        )

        if site_settings is None or site_settings.property_listing_alerts:
            owner_name = self.request.user.get_full_name().strip() or self.request.user.email
            house = getattr(property_obj, 'house_detail', None)
            car = getattr(property_obj, 'car_detail', None)
            image = property_obj.images.first()
            owner_phone = getattr(getattr(self.request.user, 'profile', None), 'phone_number', '') or ''
            Notification.objects.create(
                type=Notification.NotificationType.PROPERTY,
                status=Notification.NotificationStatus.NEW,
                title="New property listing",
                details=property_obj.description,
                info="Property listing alert",
                sender=self.request.user,
                sender_name=owner_name,
                sender_email=self.request.user.email,
                property_obj=property_obj,
                property_title=property_obj.property_name,
                property_status=property_obj.get_status_display(),
                property_owner=owner_name,
                property_image=image.image.url if image else '',
                property_bedrooms=getattr(house, 'bedrooms', None),
                property_bathrooms=getattr(house, 'bathrooms', None),
                property_size=f"{house.area_sqft} sqft" if house else '',
                property_nightly_price=f"{property_obj.currency} {property_obj.price} / {property_obj.get_rental_unit_display().lower()}",
                property_address=", ".join(filter(None, [property_obj.address, property_obj.city, property_obj.region])),
                property_added_date=property_obj.created_at.strftime("%b %d, %Y"),
                sender_phone=owner_phone,
            )

    def perform_update(self, serializer):
        instance = serializer.save()
        audit_event(
            actor=self.request.user,
            action="PROPERTY_UPDATED",
            category=AuditLog.Category.PROPERTY if instance.listing_type == ListingType.HOUSE else AuditLog.Category.VEHICLE,
            severity=AuditLog.Severity.INFO,
            result=AuditLog.Result.SUCCESS,
            target_type="property",
            target_id=instance.pk,
            target_display=instance.property_name,
            description=f"Owner {self.request.user.get_full_name().strip() or self.request.user.email} updated {'house' if instance.listing_type == ListingType.HOUSE else 'vehicle'} listing '{instance.property_name}'.",
            metadata={"property_name": instance.property_name, "listing_type": instance.listing_type},
            request=self.request,
        )

    def perform_destroy(self, instance):
        audit_event(
            actor=self.request.user,
            action="PROPERTY_DELETED",
            category=AuditLog.Category.PROPERTY if instance.listing_type == ListingType.HOUSE else AuditLog.Category.VEHICLE,
            severity=AuditLog.Severity.WARNING,
            result=AuditLog.Result.SUCCESS,
            target_type="property",
            target_id=instance.pk,
            target_display=instance.property_name,
            description=f"Owner {self.request.user.get_full_name().strip() or self.request.user.email} deleted {'house' if instance.listing_type == ListingType.HOUSE else 'vehicle'} listing '{instance.property_name}'.",
            metadata={"property_name": instance.property_name, "listing_type": instance.listing_type},
            request=self.request,
        )
        instance.delete()


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
