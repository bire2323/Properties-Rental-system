from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from properties.models import Property
from .models import Review
from .serializers import ReviewSerializer


class ReviewListAPIView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		reviews = Review.objects.filter(
			property__status='active', property__is_available=True
		).select_related('property', 'user')
		return Response(ReviewSerializer(reviews, many=True).data)


class PropertyReviewAPIView(APIView):
	def get(self, request, property_id):
		reviews = Review.objects.filter(property_id=property_id)
		return Response(ReviewSerializer(reviews, many=True).data)

	def post(self, request, property_id):
		property_obj = get_object_or_404(Property, pk=property_id)
		serializer = ReviewSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		user_name = f'{request.user.first_name} {request.user.last_name}'.strip()
		if not user_name:
			user_name = request.user.email

		review, created = Review.objects.update_or_create(
			property=property_obj,
			user=request.user,
			defaults={
				'user_name': user_name,
				'user_email': request.user.email,
				'review_text': serializer.validated_data['review_text'],
			},
		)
		return Response(ReviewSerializer(review).data, status=201 if created else 200)

	def get_permissions(self):
		return [IsAuthenticated()] if self.request.method == 'POST' else [AllowAny()]
