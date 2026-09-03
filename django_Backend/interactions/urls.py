from django.urls import path
from .views import PropertyRatingAPIView, PropertyFavoriteAPIView, UserFavoritesListView, OwnerFavoritesListView

urlpatterns = [
    path('properties/<int:property_id>/rating/', PropertyRatingAPIView.as_view(), name='property-rating'),
    path('properties/<int:property_id>/favorite/', PropertyFavoriteAPIView.as_view(), name='property-favorite'),
    path('favorites/', UserFavoritesListView.as_view(), name='user-favorites'),
    path('owner-favorites/', OwnerFavoritesListView.as_view(), name='owner-favorites'),
]
