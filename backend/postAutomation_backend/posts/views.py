from rest_framework import viewsets, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import Post, SocialAccount
from .serializers import PostSerializer, SocialAccountSerializer, SocialAccountCreateSerializer
from .tasks import publish_post

class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing posts with filtering, search, and permissions
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['platform', 'status']
    search_fields = ['content']
    ordering_fields = ['scheduled_time', 'created_at', 'status']
    ordering = ['-scheduled_time']

    def get_queryset(self):
        """Return posts for the authenticated user only"""
        return Post.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create a post and schedule it"""
        post = serializer.save(user=self.request.user)
        
        # Check if user has connected account for this platform
        has_account = SocialAccount.objects.filter(
            user=self.request.user,
            platform=post.platform,
            is_active=True
        ).exists()
        
        if not has_account:
            raise serializers.ValidationError(
                f"You need to connect your {post.platform} account before scheduling posts."
            )
        
        # Schedule the post at its scheduled_time
        if post.scheduled_time > timezone.now():
            task = publish_post.apply_async((post.id,), eta=post.scheduled_time)
        else:
            task = publish_post.delay(post.id)
        
        # Store task ID for potential cancellation
        post.celery_task_id = task.id
        post.save(update_fields=['celery_task_id'])
        return post

    def perform_update(self, serializer):
        """Update post only if it's pending and not yet scheduled"""
        post = self.get_object()
        if post.status != 'pending':
            raise serializers.ValidationError("Only pending posts can be updated.")
        if post.scheduled_time <= timezone.now():
            raise serializers.ValidationError("Cannot update posts that are scheduled in the past.")
        serializer.save()

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a scheduled post"""
        from celery import current_app
        
        post = self.get_object()
        if post.status != 'pending':
            return Response(
                {'error': 'Only pending posts can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if post.scheduled_time <= timezone.now():
            return Response(
                {'error': 'Cannot cancel posts that are already scheduled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Revoke the Celery task if it exists
        if post.celery_task_id:
            try:
                current_app.control.revoke(post.celery_task_id, terminate=True)
            except Exception as e:
                # Log error but continue with cancellation
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to revoke Celery task {post.celery_task_id}: {e}")
        
        post.status = 'cancelled'
        post.save()
        return Response({'message': 'Post cancelled successfully.'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics for user's posts"""
        posts = self.get_queryset()
        stats = {
            'total': posts.count(),
            'pending': posts.filter(status='pending').count(),
            'posted': posts.filter(status='posted').count(),
            'failed': posts.filter(status='failed').count(),
            'cancelled': posts.filter(status='cancelled').count(),
            'by_platform': {}
        }
        
        for platform_code, platform_name in Post.PLATFORM_CHOICES:
            stats['by_platform'][platform_name] = posts.filter(platform=platform_code).count()
        
        return Response(stats)


class SocialAccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing social media account connections
    """
    serializer_class = SocialAccountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return social accounts for the authenticated user only"""
        return SocialAccount.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Use different serializer for create/update"""
        if self.action in ['create', 'update', 'partial_update']:
            return SocialAccountCreateSerializer
        return SocialAccountSerializer
    
    def perform_create(self, serializer):
        """Create social account for the current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def disconnect(self, request, pk=None):
        """Disconnect a social account"""
        social_account = self.get_object()
        social_account.is_active = False
        social_account.save()
        return Response({'message': f'{social_account.get_platform_display()} account disconnected successfully.'})
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Get connection status for all platforms"""
        accounts = self.get_queryset()
        status_dict = {}
        
        for platform_code, platform_name in Post.PLATFORM_CHOICES:
            account = accounts.filter(platform=platform_code).first()
            status_dict[platform_code] = {
                'platform': platform_name,
                'is_connected': bool(account and account.access_token and account.is_active) if account else False,
                'is_active': account.is_active if account else False,
                'platform_username': account.platform_username if account else None,
                'connected_at': account.connected_at.isoformat() if account and account.connected_at else None,
            }
        
        return Response(status_dict)
