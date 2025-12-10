from celery import shared_task
from django.utils import timezone
from .models import Post, SocialAccount
from .social_integrations import get_platform_integration
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def publish_post(self, post_id):
    """
    Publish a post to the specified platform using real API integrations.
    Retries up to 3 times if it fails.
    """
    try:
        post = Post.objects.get(id=post_id)
        
        # Check if post was cancelled
        if post.status == 'cancelled':
            logger.info(f"Post {post_id} was cancelled, skipping publication")
            return
        
        # Check if post is already posted
        if post.status == 'posted':
            logger.info(f"Post {post_id} is already posted")
            return
        
        logger.info(f"Publishing post {post_id} to {post.platform} for user {post.user.username}")
        
        # Get the user's social account for this platform
        try:
            social_account = SocialAccount.objects.get(
                user=post.user,
                platform=post.platform,
                is_active=True
            )
        except SocialAccount.DoesNotExist:
            error_msg = f"No active {post.platform} account connected for user {post.user.username}"
            logger.error(error_msg)
            post.status = 'failed'
            post.save()
            return
        
        # Update last_used_at
        social_account.last_used_at = timezone.now()
        social_account.save(update_fields=['last_used_at'])
        
        # Get the platform integration
        integration = get_platform_integration(post.platform, social_account)
        if not integration:
            error_msg = f"Unsupported platform: {post.platform}"
            logger.error(error_msg)
            post.status = 'failed'
            post.save()
            return
        
        # Refresh token if needed
        integration.refresh_token_if_needed()
        
        # Post to the platform
        success, post_id_external, error_message = integration.post(
            content=post.content,
            media_url=post.media_url
        )
        
        if success:
            post.status = 'posted'
            post.external_post_id = post_id_external
            logger.info(f"Successfully posted {post_id} to {post.platform}. External ID: {post_id_external}")
        else:
            post.status = 'failed'
            error_msg = error_message or "Unknown error"
            logger.error(f"Failed to post {post_id} to {post.platform}: {error_msg}")
            
            # Retry on certain errors (network issues, rate limits, etc.)
            if "network" in error_msg.lower() or "timeout" in error_msg.lower():
                raise self.retry(exc=Exception(error_msg))
        
        post.save()
        
    except Post.DoesNotExist:
        logger.error(f"Post with ID {post_id} does not exist")
        return
    except SocialAccount.DoesNotExist:
        logger.error(f"No social account found for post {post_id}")
        try:
            post = Post.objects.get(id=post_id)
            post.status = 'failed'
            post.save()
        except Post.DoesNotExist:
            pass
        return
    except Exception as e:
        logger.error(f"Unexpected error publishing post {post_id}: {e}")
        # Update post status to failed after max retries
        try:
            post = Post.objects.get(id=post_id)
            post.status = 'failed'
            post.save()
        except Post.DoesNotExist:
            pass
        raise
