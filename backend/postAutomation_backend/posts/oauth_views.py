"""
OAuth views for connecting social media accounts
Note: These are simplified examples. In production, you'd use proper OAuth libraries
and handle the full OAuth flow with redirects.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from django.urls import reverse
from .models import SocialAccount
import requests
import logging
import base64
import secrets
import hashlib

logger = logging.getLogger(__name__)


class OAuthInitiateView(APIView):
    """
    Initiate OAuth flow - returns authorization URL for user to visit
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, platform):
        """
        Get OAuth authorization URL for the platform
        """
        platform = platform.lower()
        
        # Get OAuth URLs from environment or settings
        # These would typically be stored in settings or environment variables
        oauth_configs = {
            'twitter': {
                'auth_url': 'https://twitter.com/i/oauth2/authorize',
                'client_id': getattr(settings, 'TWITTER_CLIENT_ID', ''),
                'redirect_uri': request.build_absolute_uri(reverse('oauth_callback', kwargs={'platform': 'twitter'})),
                'scope': 'tweet.read tweet.write users.read offline.access',
                'response_type': 'code',
                'code_challenge': 'challenge',  # In production, use PKCE
                'code_challenge_method': 'plain',
            },
            'linkedin': {
                'auth_url': 'https://www.linkedin.com/oauth/v2/authorization',
                'client_id': getattr(settings, 'LINKEDIN_CLIENT_ID', ''),
                'redirect_uri': request.build_absolute_uri(reverse('oauth_callback', kwargs={'platform': 'linkedin'})),
                'scope': 'openid profile email w_member_social',
                'response_type': 'code',
            },
            'instagram': {
                'auth_url': 'https://api.instagram.com/oauth/authorize',
                'client_id': getattr(settings, 'INSTAGRAM_CLIENT_ID', ''),
                'redirect_uri': request.build_absolute_uri(reverse('oauth_callback', kwargs={'platform': 'instagram'})),
                'scope': 'user_profile,user_media',
                'response_type': 'code',
            },
            'youtube': {
                'auth_url': 'https://accounts.google.com/o/oauth2/v2/auth',
                'client_id': getattr(settings, 'YOUTUBE_CLIENT_ID', ''),
                'redirect_uri': request.build_absolute_uri(reverse('oauth_callback', kwargs={'platform': 'youtube'})),
                'scope': 'https://www.googleapis.com/auth/youtube.upload',
                'response_type': 'code',
                'access_type': 'offline',
                'prompt': 'consent',
            },
        }
        
        config = oauth_configs.get(platform)
        if not config:
            return Response(
                {'error': f'Unsupported platform: {platform}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not config['client_id']:
            return Response(
                {'error': f'{platform.title()} OAuth is not configured. Please set {platform.upper()}_CLIENT_ID in settings.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Build authorization URL
        params = {
            'client_id': config['client_id'],
            'redirect_uri': config['redirect_uri'],
            'scope': config['scope'],
            'response_type': config['response_type'],
        }
        
        # Add platform-specific parameters
        if platform == 'twitter':
            # Generate PKCE code verifier and challenge for Twitter
            code_verifier = secrets.token_urlsafe(32)
            code_challenge = base64.urlsafe_b64encode(
                hashlib.sha256(code_verifier.encode()).digest()
            ).decode().rstrip('=')
            
            # Store code verifier in session
            request.session[f'{platform}_code_verifier'] = code_verifier
            
            params.update({
                'code_challenge': code_challenge,
                'code_challenge_method': 'S256',
            })
        elif platform == 'youtube':
            params.update({
                'access_type': config.get('access_type'),
                'prompt': config.get('prompt'),
            })
        
        auth_url = f"{config['auth_url']}?" + "&".join([f"{k}={v}" for k, v in params.items()])
        
        return Response({
            'auth_url': auth_url,
            'platform': platform,
            'message': f'Visit this URL to authorize {platform.title()} access'
        })


class OAuthCallbackView(APIView):
    """
    Handle OAuth callback and exchange code for tokens
    This is a simplified version - in production, handle this more securely
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, platform):
        """
        Handle OAuth callback with authorization code
        """
        code = request.query_params.get('code')
        error = request.query_params.get('error')
        
        if error:
            return Response(
                {'error': f'OAuth error: {error}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not code:
            return Response(
                {'error': 'Authorization code not provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        platform = platform.lower()
        
        # Exchange code for tokens
        # This is simplified - in production, use proper OAuth libraries
        try:
            token_data = self._exchange_code_for_tokens(platform, code, request)
            
            if not token_data:
                return Response(
                    {'error': 'Failed to exchange code for tokens'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user info from platform
            user_info = self._get_user_info(platform, token_data.get('access_token'))
            
            # Create or update social account
            social_account, created = SocialAccount.objects.update_or_create(
                user=request.user,
                platform=platform,
                defaults={
                    'access_token': token_data.get('access_token'),
                    'refresh_token': token_data.get('refresh_token'),
                    'token_expires_at': self._parse_expires_at(token_data),
                    'platform_user_id': user_info.get('id') or user_info.get('sub'),
                    'platform_username': user_info.get('username') or user_info.get('name'),
                    'is_active': True,
                    'metadata': user_info,
                }
            )
            
            from .serializers import SocialAccountSerializer
            return Response({
                'message': f'{platform.title()} account connected successfully',
                'account': SocialAccountSerializer(social_account).data
            })
            
        except Exception as e:
            logger.error(f"OAuth callback error for {platform}: {e}")
            return Response(
                {'error': f'Failed to connect {platform.title()} account: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _exchange_code_for_tokens(self, platform, code, request):
        """Exchange authorization code for access token"""
        platform = platform.lower()
        redirect_uri = request.build_absolute_uri(reverse('oauth_callback', kwargs={'platform': platform}))
        
        if platform == 'twitter':
            return self._exchange_twitter_token(code, redirect_uri, request)
        elif platform == 'linkedin':
            return self._exchange_linkedin_token(code, redirect_uri, request)
        elif platform == 'instagram':
            return self._exchange_instagram_token(code, redirect_uri, request)
        elif platform == 'youtube':
            return self._exchange_youtube_token(code, redirect_uri, request)
        else:
            return None
    
    def _exchange_twitter_token(self, code, redirect_uri, request):
        """Exchange Twitter authorization code for tokens"""
        client_id = getattr(settings, 'TWITTER_CLIENT_ID', '')
        client_secret = getattr(settings, 'TWITTER_CLIENT_SECRET', '')
        code_verifier = request.session.get('twitter_code_verifier', '')
        
        token_url = 'https://api.twitter.com/2/oauth2/token'
        data = {
            'code': code,
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'code_verifier': code_verifier,
        }
        
        auth_string = f"{client_id}:{client_secret}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {auth_b64}',
        }
        
        response = requests.post(token_url, data=data, headers=headers, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Twitter token exchange failed: {response.text}")
            return None
    
    def _exchange_linkedin_token(self, code, redirect_uri, request):
        """Exchange LinkedIn authorization code for tokens"""
        client_id = getattr(settings, 'LINKEDIN_CLIENT_ID', '')
        client_secret = getattr(settings, 'LINKEDIN_CLIENT_SECRET', '')
        
        token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': client_id,
            'client_secret': client_secret,
        }
        
        response = requests.post(token_url, data=data, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"LinkedIn token exchange failed: {response.text}")
            return None
    
    def _exchange_instagram_token(self, code, redirect_uri, request):
        """Exchange Instagram authorization code for tokens"""
        client_id = getattr(settings, 'INSTAGRAM_CLIENT_ID', '')
        client_secret = getattr(settings, 'INSTAGRAM_CLIENT_SECRET', '')
        
        token_url = 'https://api.instagram.com/oauth/access_token'
        data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri,
            'code': code,
        }
        
        response = requests.post(token_url, data=data, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Instagram token exchange failed: {response.text}")
            return None
    
    def _exchange_youtube_token(self, code, redirect_uri, request):
        """Exchange YouTube/Google authorization code for tokens"""
        client_id = getattr(settings, 'YOUTUBE_CLIENT_ID', '')
        client_secret = getattr(settings, 'YOUTUBE_CLIENT_SECRET', '')
        
        token_url = 'https://oauth2.googleapis.com/token'
        data = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }
        
        response = requests.post(token_url, data=data, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"YouTube token exchange failed: {response.text}")
            return None
    
    def _get_user_info(self, platform, access_token):
        """Get user information from platform"""
        platform = platform.lower()
        
        if platform == 'twitter':
            return self._get_twitter_user_info(access_token)
        elif platform == 'linkedin':
            return self._get_linkedin_user_info(access_token)
        elif platform == 'instagram':
            return self._get_instagram_user_info(access_token)
        elif platform == 'youtube':
            return self._get_youtube_user_info(access_token)
        else:
            return {}
    
    def _get_twitter_user_info(self, access_token):
        """Get Twitter user information"""
        url = 'https://api.twitter.com/2/users/me'
        headers = {'Authorization': f'Bearer {access_token}'}
        params = {'user.fields': 'username,name,profile_image_url'}
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json().get('data', {})
            return {
                'id': data.get('id'),
                'username': data.get('username'),
                'name': data.get('name'),
            }
        return {}
    
    def _get_linkedin_user_info(self, access_token):
        """Get LinkedIn user information"""
        url = 'https://api.linkedin.com/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            # Also get person URN
            person_url = 'https://api.linkedin.com/v2/me'
            person_response = requests.get(person_url, headers=headers, timeout=30)
            person_urn = None
            if person_response.status_code == 200:
                person_data = person_response.json()
                person_urn = person_data.get('id')
            
            return {
                'id': data.get('sub'),
                'username': data.get('name', ''),
                'name': data.get('name', ''),
                'person_urn': person_urn,
            }
        return {}
    
    def _get_instagram_user_info(self, access_token):
        """Get Instagram user information"""
        # Instagram Basic Display API
        url = 'https://graph.instagram.com/me'
        params = {
            'fields': 'id,username',
            'access_token': access_token,
        }
        
        response = requests.get(url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return {
                'id': data.get('id'),
                'username': data.get('username'),
                'name': data.get('username'),
            }
        return {}
    
    def _get_youtube_user_info(self, access_token):
        """Get YouTube user information"""
        url = 'https://www.googleapis.com/youtube/v3/channels'
        params = {
            'part': 'snippet',
            'mine': 'true',
            'access_token': access_token,
        }
        
        response = requests.get(url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            items = data.get('items', [])
            if items:
                snippet = items[0].get('snippet', {})
                return {
                    'id': items[0].get('id'),
                    'username': snippet.get('title', ''),
                    'name': snippet.get('title', ''),
                }
        return {}
    
    def _parse_expires_at(self, token_data):
        """Parse token expiration time"""
        from django.utils import timezone
        from datetime import timedelta
        
        if 'expires_in' in token_data:
            return timezone.now() + timedelta(seconds=token_data['expires_in'])
        return None

