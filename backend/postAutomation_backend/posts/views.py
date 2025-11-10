from rest_framework import viewsets
from .models import Post
from .serializers import PostSerializer
from .tasks import publish_post
from datetime import datetime
from django.utils import timezone
import pytz

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    def perform_create(self, serializer):
        post = serializer.save(user=self.request.user)
        # Schedule the post at its scheduled_time
        if post.scheduled_time > timezone.now():
            publish_post.apply_async((post.id,), eta=post.scheduled_time)
        else:
            publish_post.delay(post.id)
        return post
