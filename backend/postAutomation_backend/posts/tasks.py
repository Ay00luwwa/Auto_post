from celery import shared_task
from django.utils import timezone
from .models import Post
import requests
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def publish_post(self, post_id):
    """
    Publish a post to the specified platform.
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
        
        logger.info(f"Publishing post {post_id} to {post.platform}")
        
        # Simulate posting to platform (you'll replace this with actual API call)
        # Example for integration: simulate sending to external API
        try:
            response = requests.post(
                "https://example.com/api/post",
                json={"platform": post.platform, "content": post.content},
                timeout=30
            )
            
            # Update status based on response
            if response.status_code == 200:
                post.status = 'posted'
                logger.info(f"Successfully posted {post_id} to {post.platform}")
            else:
                post.status = 'failed'
                logger.error(f"Failed to post {post_id}: HTTP {response.status_code}")
            
            post.save()
            
        except requests.RequestException as e:
            # Retry on network errors
            logger.error(f"Network error publishing post {post_id}: {e}")
            raise self.retry(exc=e)
            
    except Post.DoesNotExist:
        logger.error(f"Post with ID {post_id} does not exist")
        # Don't retry if post doesn't exist
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
