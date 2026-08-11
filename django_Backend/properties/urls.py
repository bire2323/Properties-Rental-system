from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet

# Create a router and register our ViewSet
router = DefaultRouter()
router.register(r'', PropertyViewSet, basename='property')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]