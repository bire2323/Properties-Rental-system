from rest_framework import serializers
from .models import PropertyRating, Favorite
from properties.serializers import PropertySerializer


class FavoriteUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    role = serializers.CharField(read_only=True)
    phone_number = serializers.CharField(source='profile.phone_number', read_only=True, allow_null=True)

class PropertyRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyRating
        fields = ['rating']

class FavoriteSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'property', 'created_at']


class OwnerFavoriteSerializer(FavoriteSerializer):
    user = FavoriteUserSerializer(read_only=True)

    class Meta(FavoriteSerializer.Meta):
        fields = FavoriteSerializer.Meta.fields + ['user']
