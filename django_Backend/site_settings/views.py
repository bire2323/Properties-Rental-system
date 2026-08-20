from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import CookieJWTAuthentication, IsAuthenticatedCookie

from .models import PaymentMethod, SiteSettings
from .serializers import PaymentMethodSerializer, SiteSettingsSerializer


class SiteSettingsAPIView(APIView):
	parser_classes = (JSONParser, MultiPartParser, FormParser)

	def get_permissions(self):
		return [AllowAny()] if self.request.method == "GET" else [IsAuthenticatedCookie()]

	def get_authenticators(self):
		return [] if self.request.method == "GET" else [CookieJWTAuthentication()]

	@staticmethod
	def get_settings():
		settings, _ = SiteSettings.objects.get_or_create(
			pk=1,
			defaults={"site_name": "Property Rental System"},
		)
		return settings

	def get(self, request):
		return Response(SiteSettingsSerializer(self.get_settings()).data)

	def patch(self, request):
		if request.user.role != User.Role.ADMIN:
			return Response({"detail": "You do not have permission to update site settings."}, status=403)

		serializer = SiteSettingsSerializer(
			self.get_settings(),
			data=request.data,
			partial=True,
		)
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return Response(serializer.data)


class PaymentMethodListCreateAPIView(APIView):
	parser_classes = (JSONParser, MultiPartParser, FormParser)
	permission_classes = (IsAuthenticatedCookie,)
	authentication_classes = (CookieJWTAuthentication,)

	def get(self, request):
		if request.user.role != User.Role.ADMIN:
			return Response({"detail": "You do not have permission to view payment methods."}, status=403)
		settings = SiteSettingsAPIView.get_settings()
		return Response(PaymentMethodSerializer(settings.payment_methods.all(), many=True).data)

	def post(self, request):
		if request.user.role != User.Role.ADMIN:
			return Response({"detail": "You do not have permission to manage payment methods."}, status=403)
		serializer = PaymentMethodSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		serializer.save(site_settings=SiteSettingsAPIView.get_settings())
		return Response(serializer.data, status=201)


class PaymentMethodDetailAPIView(APIView):
	parser_classes = (JSONParser, MultiPartParser, FormParser)
	permission_classes = (IsAuthenticatedCookie,)
	authentication_classes = (CookieJWTAuthentication,)

	def get_method(self, request, pk):
		if request.user.role != User.Role.ADMIN:
			return None
		return PaymentMethod.objects.filter(pk=pk, site_settings=SiteSettingsAPIView.get_settings()).first()

	def patch(self, request, pk):
		method = self.get_method(request, pk)
		if method is None:
			return Response({"detail": "Payment method not found."}, status=404)
		serializer = PaymentMethodSerializer(method, data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return Response(serializer.data)

	def delete(self, request, pk):
		method = self.get_method(request, pk)
		if method is None:
			return Response({"detail": "Payment method not found."}, status=404)
		method.delete()
		return Response(status=204)
