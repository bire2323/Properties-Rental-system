from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, FeatureListView


router = DefaultRouter()
router.register(r'', PropertyViewSet, basename='property')

urlpatterns = [
    path('features/', FeatureListView.as_view(), name='feature-list'),
    path('', include(router.urls)),
]
