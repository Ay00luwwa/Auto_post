from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView
from posts.views import PostViewSet, SocialAccountViewSet
from posts.oauth_views import OAuthInitiateView, OAuthCallbackView
from users.views import UserRegistrationView, UserProfileView, CustomTokenObtainPairView
from users.oauth_views import (
    GoogleOAuthInitiateView, GoogleOAuthCallbackView,
    FacebookOAuthInitiateView, FacebookOAuthCallbackView,
    GitHubOAuthInitiateView, GitHubOAuthCallbackView
)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from .views import health_check

router = routers.DefaultRouter()
router.register(r'posts', PostViewSet, basename='posts')
router.register(r'social-accounts', SocialAccountViewSet, basename='social-accounts')


# Swagger/OpenAPI documentation 
schema_view = get_schema_view(
   openapi.Info(
      title="Post Automation API",
      default_version='v1',
      description="API for scheduling and managing social media posts",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@postautomation.local"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check
    path('health/', health_check, name='health_check'),
    
    # API endpoints
    path('api/', include(router.urls)),
    
    # Authentication endpoints
    path('api/auth/register/', UserRegistrationView.as_view(), name='register'),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/profile/', UserProfileView.as_view(), name='user_profile'),
    
    # OAuth user authentication endpoints (Google, Facebook, GitHub)
    path('api/auth/oauth/google/initiate/', GoogleOAuthInitiateView.as_view(), name='google_oauth_initiate'),
    path('api/auth/oauth/google/callback/', GoogleOAuthCallbackView.as_view(), name='google_oauth_callback'),
    path('api/auth/oauth/facebook/initiate/', FacebookOAuthInitiateView.as_view(), name='facebook_oauth_initiate'),
    path('api/auth/oauth/facebook/callback/', FacebookOAuthCallbackView.as_view(), name='facebook_oauth_callback'),
    path('api/auth/oauth/github/initiate/', GitHubOAuthInitiateView.as_view(), name='github_oauth_initiate'),
    path('api/auth/oauth/github/callback/', GitHubOAuthCallbackView.as_view(), name='github_oauth_callback'),
    
    # OAuth endpoints for social media accounts (Twitter, LinkedIn, Instagram, YouTube)
    path('api/oauth/initiate/<str:platform>/', OAuthInitiateView.as_view(), name='oauth_initiate'),
    path('api/oauth/callback/<str:platform>/', OAuthCallbackView.as_view(), name='oauth_callback'),
    
    # API Documentation
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
