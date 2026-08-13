from rest_framework import serializers
from .models import PropertyRating, Favorite
from properties.serializers import PropertySerializer

class PropertyRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyRating
        fields = ['rating']

class FavoriteSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'property', 'created_at']
