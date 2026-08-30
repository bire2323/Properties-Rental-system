from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyViewSet,
    FeatureListView,
    CompanyViewSet,
    ListingNavigationOptionsAPIView,
    RegionListAPIView,
    RegionAdminViewSet,
    CityAdminViewSet,
)


router = DefaultRouter()
router.register(r'', PropertyViewSet, basename='property')

company_router = DefaultRouter()
company_router.register(r'', CompanyViewSet, basename='company')

urlpatterns = [
    path('features/', FeatureListView.as_view(), name='feature-list'),
    path('navigation-options/', ListingNavigationOptionsAPIView.as_view(), name='listing-navigation-options'),
    path('regions/', RegionListAPIView.as_view(), name='region-list'),
    path('admin/regions/', RegionAdminViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-region-list'),
    path('admin/regions/<int:id>/', RegionAdminViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'put': 'update', 'delete': 'destroy'}), name='admin-region-detail'),
    path('admin/cities/', CityAdminViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-city-list'),
    path('admin/cities/<int:id>/', CityAdminViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'put': 'update', 'delete': 'destroy'}), name='admin-city-detail'),
    path('', include(router.urls)),
]
