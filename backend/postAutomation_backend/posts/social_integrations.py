"""
Social media platform integrations for posting content
"""
import requests
import logging
from typing import Dict, Optional, Tuple
from django.utils import timezone
from .models import SocialAccount

logger = logging.getLogger(__name__)


class BaseSocialPlatform:
    """Base class for social media platform integrations"""
    
    def __init__(self, social_account: SocialAccount):
        self.social_account = social_account
        self.access_token = social_account.access_token
    
    def post(self, content: str, media_url: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Post content to the platform
        Returns: (success, post_id, error_message)
        """
        raise NotImplementedError("Subclasses must implement post method")
    
    def refresh_token_if_needed(self) -> bool:
        """Refresh access token if expired"""
        return False


class TwitterIntegration(BaseSocialPlatform):
    """Twitter/X API v2 integration"""
    
    API_BASE = "https://api.twitter.com/2"
    
    def post(self, content: str, media_url: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Post a tweet using Twitter API v2
        Note: Media upload requires additional steps
        """
        try:
            # Twitter API v2 endpoint for creating tweets
            url = f"{self.API_BASE}/tweets"
            
            payload = {
                "text": content[:280]  # Twitter character limit
            }
            
            # If media_url is provided, we'd need to upload media first
            # This is a simplified version - full implementation would handle media upload
            if media_url:
                logger.warning("Media upload for Twitter requires additional implementation")
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 201:
                data = response.json()
                tweet_id = data.get('data', {}).get('id')
                return True, tweet_id, None
            else:
                error_msg = response.json().get('detail', f"HTTP {response.status_code}")
                return False, None, error_msg
                
        except requests.RequestException as e:
            logger.error(f"Twitter API error: {e}")
            return False, None, str(e)
    
    def refresh_token_if_needed(self) -> bool:
        """Twitter OAuth 2.0 token refresh"""
        # Twitter uses OAuth 2.0 with refresh tokens
        if not self.social_account.refresh_token:
            return False
        
        try:
            url = "https://api.twitter.com/2/oauth2/token"
            data = {
                "refresh_token": self.social_account.refresh_token,
                "grant_type": "refresh_token",
                "client_id": self.social_account.metadata.get('client_id', ''),
            }
            
            response = requests.post(url, data=data, timeout=30)
            if response.status_code == 200:
                data = response.json()
                self.social_account.access_token = data['access_token']
                if 'refresh_token' in data:
                    self.social_account.refresh_token = data['refresh_token']
                self.social_account.token_expires_at = timezone.now() + timezone.timedelta(seconds=data.get('expires_in', 3600))
                self.social_account.save()
                return True
        except Exception as e:
            logger.error(f"Failed to refresh Twitter token: {e}")
        
        return False


class InstagramIntegration(BaseSocialPlatform):
    """Instagram Graph API integration (requires Facebook Business)"""
    
    API_BASE = "https://graph.facebook.com/v18.0"
    
    def post(self, content: str, media_url: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Post to Instagram using Graph API
        Note: Requires Instagram Business or Creator account
        """
        try:
            # Get the Instagram Business Account ID from metadata
            ig_account_id = self.social_account.metadata.get('instagram_account_id')
            if not ig_account_id:
                return False, None, "Instagram account ID not found. Please reconnect your account."
            
            if media_url:
                # Create media container first
                create_url = f"{self.API_BASE}/{ig_account_id}/media"
                create_payload = {
                    "image_url": media_url,
                    "caption": content,
                    "access_token": self.access_token
                }
                
                create_response = requests.post(create_url, data=create_payload, timeout=30)
                if create_response.status_code != 200:
                    return False, None, f"Failed to create media container: {create_response.text}"
                
                creation_id = create_response.json().get('id')
                
                # Publish the media
                publish_url = f"{self.API_BASE}/{ig_account_id}/media_publish"
                publish_payload = {
                    "creation_id": creation_id,
                    "access_token": self.access_token
                }
                
                publish_response = requests.post(publish_url, data=publish_payload, timeout=30)
                if publish_response.status_code == 200:
                    post_id = publish_response.json().get('id')
                    return True, post_id, None
                else:
                    return False, None, f"Failed to publish: {publish_response.text}"
            else:
                # Text-only post (requires different endpoint)
                return False, None, "Instagram requires media. Please provide a media URL."
                
        except requests.RequestException as e:
            logger.error(f"Instagram API error: {e}")
            return False, None, str(e)


class LinkedInIntegration(BaseSocialPlatform):
    """LinkedIn API integration"""
    
    API_BASE = "https://api.linkedin.com/v2"
    
    def post(self, content: str, media_url: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Post to LinkedIn using LinkedIn API v2
        """
        try:
            # Get user's LinkedIn URN from metadata
            person_urn = self.social_account.metadata.get('person_urn')
            if not person_urn:
                return False, None, "LinkedIn person URN not found. Please reconnect your account."
            
            # Create a share (post)
            url = f"{self.API_BASE}/ugcPosts"
            
            # Build share content
            share_content = {
                "shareContent": {
                    "shareCommentary": {
                        "text": content
                    },
                    "shareMediaCategory": "NONE"
                }
            }
            
            if media_url:
                share_content["shareContent"]["shareMediaCategory"] = "ARTICLE"
                share_content["shareContent"]["media"] = [{
                    "status": "READY",
                    "description": {
                        "text": content[:200]  # Truncate for description
                    },
                    "originalUrl": media_url
                }]
            
            payload = {
                "author": person_urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": share_content,
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 201:
                # LinkedIn returns the URN in the Location header
                location = response.headers.get('Location', '')
                post_id = location.split('/')[-1] if location else None
                return True, post_id, None
            else:
                error_msg = response.json().get('message', f"HTTP {response.status_code}")
                return False, None, error_msg
                
        except requests.RequestException as e:
            logger.error(f"LinkedIn API error: {e}")
            return False, None, str(e)


class YouTubeIntegration(BaseSocialPlatform):
    """YouTube Data API v3 integration"""
    
    API_BASE = "https://www.googleapis.com/youtube/v3"
    
    def post(self, content: str, media_url: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Post to YouTube
        Note: YouTube posts are actually video uploads, which is more complex
        This is a simplified version for community posts (if available)
        """
        try:
            # YouTube doesn't have a simple "post text" API
            # This would typically require video upload or community post
            # For now, we'll return an error suggesting video upload
            
            if not media_url:
                return False, None, "YouTube requires video content. Please provide a video URL or use YouTube Studio for text posts."
            
            # If media_url is a video, you'd need to:
            # 1. Download the video
            # 2. Upload it to YouTube using the upload API
            # This is complex and requires additional libraries
            
            return False, None, "YouTube video upload requires additional implementation. Please use YouTube Studio for now."
            
        except Exception as e:
            logger.error(f"YouTube API error: {e}")
            return False, None, str(e)


def get_platform_integration(platform: str, social_account: SocialAccount) -> Optional[BaseSocialPlatform]:
    """Factory function to get the appropriate platform integration"""
    integrations = {
        'twitter': TwitterIntegration,
        'instagram': InstagramIntegration,
        'linkedin': LinkedInIntegration,
        'youtube': YouTubeIntegration,
    }
    
    integration_class = integrations.get(platform.lower())
    if not integration_class:
        logger.error(f"Unknown platform: {platform}")
        return None
    
    return integration_class(social_account)

