from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from django.shortcuts import get_object_or_404
from .models import PropertyRating, Favorite
from properties.models import Property
from .serializers import PropertyRatingSerializer, FavoriteSerializer, OwnerFavoriteSerializer
from django.db.models import Avg, Count

class PropertyRatingAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, property_id):
        property_obj = get_object_or_404(Property, id=property_id)
        serializer = PropertyRatingSerializer(data=request.data)
        if serializer.is_valid():
            rating_value = serializer.validated_data['rating']
            rating, created = PropertyRating.objects.update_or_create(
                user=request.user,
                property=property_obj,
                defaults={'rating': rating_value}
            )
            
            # Recalculate average and count to return updated info if desired
            # or simply return success message
            message = "Rating created successfully" if created else "Rating updated successfully"
            return Response({
                "message": message,
                "rating": {
                    "user_rating": rating.rating
                }
            }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, property_id):
        deleted, _ = PropertyRating.objects.filter(user=request.user, property_id=property_id).delete()
        if deleted:
            return Response({"message": "Rating deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        return Response({"message": "Rating not found"}, status=status.HTTP_404_NOT_FOUND)

class PropertyFavoriteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, property_id):
        property_obj = get_object_or_404(Property, id=property_id)
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            property=property_obj
        )
        return Response({
            "message": "Property added to favorites",
            "is_favorite": True
        }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

    def delete(self, request, property_id):
        deleted, _ = Favorite.objects.filter(user=request.user, property_id=property_id).delete()
        if deleted:
            return Response({
                "message": "Property removed from favorites",
                "is_favorite": False
            }, status=status.HTTP_200_OK) # returning 200 to send is_favorite: false
        return Response({"message": "Favorite not found"}, status=status.HTTP_404_NOT_FOUND)

class UserFavoritesListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        # Prefetch related properties and their required fields to avoid N+1
        return Favorite.objects.filter(user=self.request.user).select_related('property').order_by('-created_at')


class OwnerFavoritesListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OwnerFavoriteSerializer

    def get_queryset(self):
        return Favorite.objects.filter(
            property__owner=self.request.user,
        ).select_related(
            'property',
            'property__owner',
            'property__city',
            'property__region',
            'user',
            'user__profile',
        ).prefetch_related(
            'property__images',
            'property__features',
        ).order_by('-created_at')
