from django.urls import path
from .views import (
    CookieTokenRefreshView,
    GoogleAuthAPIView,
    LoginAPIView,
    LogoutAPIView,
    ProfileAPIView,
    RegisterAPIView,
    BecomeOwnerAPIView,
    OwnerStatusAPIView,
    FullUserDetailAPIView,
    home,
    AdminUserStatisticsAPIView,
    AdminRecentUsersAPIView,
    AdminAllUsersAPIView,
    AdminOwnerVerificationAPIView,
    AdminOwnerVerificationDecisionAPIView,
    AdminNotificationListAPIView,
    AdminNotificationDetailAPIView,
)

urlpatterns = [
    path('', home, name='home'),
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('google/', GoogleAuthAPIView.as_view(), name='google-auth'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token-refresh'),
    
    # Profile & Owner endpoints
    path('profile/', ProfileAPIView.as_view(), name='profile'),
    path('become-owner/', BecomeOwnerAPIView.as_view(), name='become-owner'),
    path('owner-status/', OwnerStatusAPIView.as_view(), name='owner-status'),
    
    # Admin endpoints
    path('users/<int:user_id>/', FullUserDetailAPIView.as_view(), name='user-detail'),
    path('admin/user-statistics/', AdminUserStatisticsAPIView.as_view(), name='admin-user-statistics'),
    path('admin/recent-users/', AdminRecentUsersAPIView.as_view(), name='admin-recent-users'),
    path('admin/all-users/', AdminAllUsersAPIView.as_view(), name='admin-all-users'),
    path('admin/verification/', AdminOwnerVerificationAPIView.as_view(), name='admin-verification-list'),
    path('admin/verification/<int:user_id>/', AdminOwnerVerificationDecisionAPIView.as_view(), name='admin-verification-decision'),
    path('admin/notifications/', AdminNotificationListAPIView.as_view(), name='admin-notification-list'),
    path('admin/notifications/<int:notification_id>/', AdminNotificationDetailAPIView.as_view(), name='admin-notification-detail'),
]
