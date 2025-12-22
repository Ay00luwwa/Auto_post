"""
OAuth views for user authentication (Google, Facebook, GitHub)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.shortcuts import redirect
from datetime import timedelta
import requests
import logging
import secrets
import base64
import hashlib
import urllib.parse

logger = logging.getLogger(__name__)
User = get_user_model()


class OAuthProviderView(APIView):
    """
    Base class for OAuth provider authentication
    """
    permission_classes = [AllowAny]
    
    def generate_state(self):
        """Generate a secure state token for OAuth"""
        state = secrets.token_urlsafe(32)
        return state
    
    def get_authorization_url(self, provider, request):
        """Get OAuth authorization URL for the provider"""
        raise NotImplementedError("Subclasses must implement get_authorization_url")
    
    def exchange_code_for_token(self, provider, code, request):
        """Exchange authorization code for access token"""
        raise NotImplementedError("Subclasses must implement exchange_code_for_token")
    
    def get_user_info(self, provider, access_token):
        """Get user information from provider"""
        raise NotImplementedError("Subclasses must implement get_user_info")
    
    def create_or_get_user(self, provider, user_info):
        """Create or get user from OAuth provider info"""
        email = user_info.get('email')
        if not email:
            raise ValueError(f"No email provided by {provider}")
        
        # Try to get user by email
        try:
            user = User.objects.get(email=email)
            # Update user info if needed
            if not user.first_name and user_info.get('given_name'):
                user.first_name = user_info.get('given_name', '')
            if not user.last_name and user_info.get('family_name'):
                user.last_name = user_info.get('family_name', '')
            user.save()
        except User.DoesNotExist:
            # Create new user
            username = user_info.get('username') or user_info.get('name') or email.split('@')[0]
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=user_info.get('given_name', ''),
                last_name=user_info.get('family_name', ''),
            )
        
        return user


class GoogleOAuthInitiateView(OAuthProviderView):
    """
    Initiate Google OAuth flow
    """
    def post(self, request):
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        if not client_id:
            return Response(
                {'error': 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in settings.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        redirect_uri = request.build_absolute_uri('/api/auth/oauth/google/callback/')
        state = self.generate_state()
        
        # Store state in session for verification
        request.session['oauth_state'] = state
        request.session['oauth_provider'] = 'google'
        
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'openid email profile',
            'state': state,
            'access_type': 'offline',
            'prompt': 'consent',
        }
        
        auth_url = 'https://accounts.google.com/o/oauth2/v2/auth?' + '&'.join([f"{k}={v}" for k, v in params.items()])
        
        return Response({
            'auth_url': auth_url,
            'provider': 'google',
        })


class GoogleOAuthCallbackView(OAuthProviderView):
    """
    Handle Google OAuth callback
    """
    def get(self, request):
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        error = request.query_params.get('error')
        
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        
        if error:
            redirect_url = f"{frontend_url}/oauth/google/callback#error={urllib.parse.quote(error)}"
            return redirect(redirect_url)
        
        # Verify state
        session_state = request.session.get('oauth_state')
        if not session_state or session_state != state:
            redirect_url = f"{frontend_url}/oauth/google/callback#error={urllib.parse.quote('Invalid state parameter')}"
            return redirect(redirect_url)
        
        if not code:
            redirect_url = f"{frontend_url}/oauth/google/callback#error={urllib.parse.quote('Authorization code not provided')}"
            return redirect(redirect_url)
        
        try:
            # Exchange code for token
            token_data = self.exchange_code_for_token('google', code, request)
            if not token_data:
                return Response(
                    {'error': 'Failed to exchange code for tokens'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user info
            user_info = self.get_user_info('google', token_data.get('access_token'))
            
            # Create or get user
            user = self.create_or_get_user('google', user_info)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Clear session
            request.session.pop('oauth_state', None)
            request.session.pop('oauth_provider', None)
            
            # Redirect to frontend with tokens in URL hash (more secure)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            redirect_url = f"{frontend_url}/oauth/google/callback#access_token={access_token}&refresh_token={refresh_token}"
            return redirect(redirect_url)
            
        except Exception as e:
            logger.error(f"Google OAuth callback error: {e}")
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            redirect_url = f"{frontend_url}/oauth/google/callback#error={urllib.parse.quote(f'Authentication failed: {str(e)}')}"
            return redirect(redirect_url)
    
    def exchange_code_for_token(self, provider, code, request):
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
        redirect_uri = request.build_absolute_uri('/api/auth/oauth/google/callback/')
        
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
            logger.error(f"Token exchange failed: {response.text}")
            return None
    
    def get_user_info(self, provider, access_token):
        user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        
        response = requests.get(user_info_url, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return {
                'email': data.get('email'),
                'username': data.get('email', '').split('@')[0],
                'name': data.get('name', ''),
                'given_name': data.get('given_name', ''),
                'family_name': data.get('family_name', ''),
                'picture': data.get('picture', ''),
            }
        else:
            logger.error(f"Failed to get user info: {response.text}")
            return {}


class FacebookOAuthInitiateView(OAuthProviderView):
    """
    Initiate Facebook OAuth flow
    """
    def post(self, request):
        client_id = getattr(settings, 'FACEBOOK_APP_ID', '')
        if not client_id:
            return Response(
                {'error': 'Facebook OAuth is not configured. Please set FACEBOOK_APP_ID in settings.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        redirect_uri = request.build_absolute_uri('/api/auth/oauth/facebook/callback/')
        state = self.generate_state()
        
        request.session['oauth_state'] = state
        request.session['oauth_provider'] = 'facebook'
        
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'email public_profile',
            'state': state,
        }
        
        auth_url = 'https://www.facebook.com/v18.0/dialog/oauth?' + '&'.join([f"{k}={v}" for k, v in params.items()])
        
        return Response({
            'auth_url': auth_url,
            'provider': 'facebook',
        })


class FacebookOAuthCallbackView(OAuthProviderView):
    """
    Handle Facebook OAuth callback
    """
    def get(self, request):
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        error = request.query_params.get('error')
        
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        
        if error:
            redirect_url = f"{frontend_url}/oauth/facebook/callback#error={urllib.parse.quote(error)}"
            return redirect(redirect_url)
        
        session_state = request.session.get('oauth_state')
        if not session_state or session_state != state:
            redirect_url = f"{frontend_url}/oauth/facebook/callback#error={urllib.parse.quote('Invalid state parameter')}"
            return redirect(redirect_url)
        
        if not code:
            redirect_url = f"{frontend_url}/oauth/facebook/callback#error={urllib.parse.quote('Authorization code not provided')}"
            return redirect(redirect_url)
        
        try:
            token_data = self.exchange_code_for_token('facebook', code, request)
            if not token_data:
                redirect_url = f"{frontend_url}/oauth/facebook/callback#error={urllib.parse.quote('Failed to exchange code for tokens')}"
                return redirect(redirect_url)
            
            user_info = self.get_user_info('facebook', token_data.get('access_token'))
            
            user = self.create_or_get_user('facebook', user_info)
            
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            request.session.pop('oauth_state', None)
            request.session.pop('oauth_provider', None)
            
            # Redirect to frontend with tokens in URL hash
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            redirect_url = f"{frontend_url}/oauth/facebook/callback#access_token={access_token}&refresh_token={refresh_token}"
            return redirect(redirect_url)
            
        except Exception as e:
            logger.error(f"Facebook OAuth callback error: {e}")
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            redirect_url = f"{frontend_url}/oauth/facebook/callback#error={urllib.parse.quote(f'Authentication failed: {str(e)}')}"
            return redirect(redirect_url)
    
    def exchange_code_for_token(self, provider, code, request):
        client_id = getattr(settings, 'FACEBOOK_APP_ID', '')
        client_secret = getattr(settings, 'FACEBOOK_APP_SECRET', '')
        redirect_uri = request.build_absolute_uri('/api/auth/oauth/facebook/callback/')
        
        token_url = 'https://graph.facebook.com/v18.0/oauth/access_token'
        params = {
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'code': code,
        }
        
        response = requests.get(token_url, params=params, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Token exchange failed: {response.text}")
            return None
    
    def get_user_info(self, provider, access_token):
        user_info_url = 'https://graph.facebook.com/v18.0/me'
        params = {
            'fields': 'id,name,email,first_name,last_name,picture',
            'access_token': access_token,
        }
        
        response = requests.get(user_info_url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return {
                'email': data.get('email'),
                'username': data.get('email', '').split('@')[0] if data.get('email') else data.get('id', ''),
                'name': data.get('name', ''),
                'given_name': data.get('first_name', ''),
                'family_name': data.get('last_name', ''),
                'picture': data.get('picture', {}).get('data', {}).get('url', '') if data.get('picture') else '',
            }
        else:
            logger.error(f"Failed to get user info: {response.text}")
            return {}


class GitHubOAuthInitiateView(OAuthProviderView):
    """
    Initiate GitHub OAuth flow
    """
    def post(self, request):
        client_id = getattr(settings, 'GITHUB_CLIENT_ID', '')
        if not client_id:
            return Response(
                {'error': 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID in settings.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        redirect_uri = request.build_absolute_uri('/api/auth/oauth/github/callback/')
        state = self.generate_state()
        
        request.session['oauth_state'] = state
        request.session['oauth_provider'] = 'github'
        
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'scope': 'user:email',
            'state': state,
        }
        
        auth_url = 'https://github.com/login/oauth/authorize?' + '&'.join([f"{k}={v}" for k, v in params.items()])
        
        return Response({
            'auth_url': auth_url,
            'provider': 'github',
        })


class GitHubOAuthCallbackView(OAuthProviderView):
    """
    Handle GitHub OAuth callback
    """
    def get(self, request):
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        error = request.query_params.get('error')
        
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        
        if error:
            redirect_url = f"{frontend_url}/oauth/github/callback#error={urllib.parse.quote(error)}"
            return redirect(redirect_url)
        
        session_state = request.session.get('oauth_state')
        if not session_state or session_state != state:
            redirect_url = f"{frontend_url}/oauth/github/callback#error={urllib.parse.quote('Invalid state parameter')}"
            return redirect(redirect_url)
        
        if not code:
            redirect_url = f"{frontend_url}/oauth/github/callback#error={urllib.parse.quote('Authorization code not provided')}"
            return redirect(redirect_url)
        
        try:
            token_data = self.exchange_code_for_token('github', code, request)
            if not token_data:
                redirect_url = f"{frontend_url}/oauth/github/callback#error={urllib.parse.quote('Failed to exchange code for tokens')}"
                return redirect(redirect_url)
            
            user_info = self.get_user_info('github', token_data.get('access_token'))
            
            user = self.create_or_get_user('github', user_info)
            
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            request.session.pop('oauth_state', None)
            request.session.pop('oauth_provider', None)
            
            # Redirect to frontend with tokens in URL hash
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            redirect_url = f"{frontend_url}/oauth/github/callback#access_token={access_token}&refresh_token={refresh_token}"
            return redirect(redirect_url)
            
        except Exception as e:
            logger.error(f"GitHub OAuth callback error: {e}")
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            redirect_url = f"{frontend_url}/oauth/github/callback#error={urllib.parse.quote(f'Authentication failed: {str(e)}')}"
            return redirect(redirect_url)
    
    def exchange_code_for_token(self, provider, code, request):
        client_id = getattr(settings, 'GITHUB_CLIENT_ID', '')
        client_secret = getattr(settings, 'GITHUB_CLIENT_SECRET', '')
        redirect_uri = request.build_absolute_uri('/api/auth/oauth/github/callback/')
        
        token_url = 'https://github.com/login/oauth/access_token'
        data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': redirect_uri,
        }
        headers = {
            'Accept': 'application/json',
        }
        
        response = requests.post(token_url, data=data, headers=headers, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Token exchange failed: {response.text}")
            return None
    
    def get_user_info(self, provider, access_token):
        # Get user info
        user_info_url = 'https://api.github.com/user'
        headers = {'Authorization': f'token {access_token}'}
        
        response = requests.get(user_info_url, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            
            # Get email (might be private)
            email = data.get('email')
            if not email:
                # Try to get from emails endpoint
                emails_url = 'https://api.github.com/user/emails'
                emails_response = requests.get(emails_url, headers=headers, timeout=30)
                if emails_response.status_code == 200:
                    emails = emails_response.json()
                    primary_email = next((e for e in emails if e.get('primary')), None)
                    if primary_email:
                        email = primary_email.get('email')
            
            return {
                'email': email or f"{data.get('login', '')}@github.noreply",
                'username': data.get('login', ''),
                'name': data.get('name', ''),
                'given_name': data.get('name', '').split()[0] if data.get('name') else '',
                'family_name': ' '.join(data.get('name', '').split()[1:]) if data.get('name') and len(data.get('name', '').split()) > 1 else '',
                'picture': data.get('avatar_url', ''),
            }
        else:
            logger.error(f"Failed to get user info: {response.text}")
            return {}

