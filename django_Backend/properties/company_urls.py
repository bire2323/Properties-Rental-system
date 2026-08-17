from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, CompanyDocumentViewSet


router = DefaultRouter()
router.register(r'', CompanyViewSet, basename='company')

urlpatterns = [
    path('my-companies/', CompanyViewSet.as_view({'get': 'my_companies'}), name='company-my-companies'),
    path('<int:company_id>/documents/', CompanyDocumentViewSet.as_view({'get': 'list', 'post': 'create'}), name='company-documents'),
    path('<int:company_id>/documents/<int:id>/', CompanyDocumentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='company-document-detail'),
    path('', include(router.urls)),
]
