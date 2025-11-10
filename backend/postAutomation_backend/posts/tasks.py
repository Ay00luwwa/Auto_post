from celery import shared_task
from django.utils import timezone
from .models import Post
import requests

@shared_task
def publish_post(post_id):
    from .models import Post  # Import inside to avoid circular imports
    try:
        post = Post.objects.get(id=post_id)
        # Simulate posting to platform (you’ll replace this with actual API call)
        print(f"Posting to {post.platform}: {post.content}")

        # Example for integration: simulate sending to external API
        response = requests.post(
            "https://example.com/api/post",
            json={"platform": post.platform, "content": post.content}
        )

        # Update status
        post.status = 'posted' if response.status_code == 200 else 'failed'
        post.save()
    except Post.DoesNotExist:
        print(f"Post with ID {post_id} does not exist")
