from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, FeatureListView, CompanyViewSet


router = DefaultRouter()
router.register(r'', PropertyViewSet, basename='property')

company_router = DefaultRouter()
company_router.register(r'', CompanyViewSet, basename='company')

urlpatterns = [
    path('features/', FeatureListView.as_view(), name='feature-list'),
    path('', include(router.urls)),
]
