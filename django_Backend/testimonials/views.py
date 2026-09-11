from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Testimonial
from .serializers import TestimonialSerializer


class TestimonialListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        testimonials = Testimonial.objects.filter(is_active=True)
        return Response(TestimonialSerializer(testimonials, many=True).data)