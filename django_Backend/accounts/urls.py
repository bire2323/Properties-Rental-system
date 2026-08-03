 
from django.urls import path
from .views import (
    CookieTokenRefreshView,
    GoogleAuthAPIView,
    LoginAPIView,
    LogoutAPIView,
    ProfileAPIView,
    RegisterAPIView,
    home,
)

urlpatterns = [
    path('', home, name='home'),
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('google/', GoogleAuthAPIView.as_view(), name='google-auth'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', ProfileAPIView.as_view(), name='profile'),
]