from rest_framework import serializers
from .models import Post, SocialAccount
from django.utils import timezone

class PostSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ('user', 'user_id', 'status', 'created_at', 'external_post_id')

    def get_can_edit(self, obj):
        """Check if post can still be edited (before scheduled time)"""
        return obj.status == 'pending' and obj.scheduled_time > timezone.now()

    def get_can_cancel(self, obj):
        """Check if post can be cancelled"""
        return obj.status == 'pending' and obj.scheduled_time > timezone.now()

    def validate_scheduled_time(self, value):
        """Ensure scheduled time is in the future"""
        if value <= timezone.now():
            raise serializers.ValidationError("Scheduled time must be in the future.")
        return value

    def validate_platform(self, value):
        """Validate platform choice"""
        valid_platforms = [choice[0] for choice in Post.PLATFORM_CHOICES]
        if value not in valid_platforms:
            raise serializers.ValidationError(f"Platform must be one of: {', '.join(valid_platforms)}")
        return value


class SocialAccountSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    is_connected = serializers.SerializerMethodField()
    
    class Meta:
        model = SocialAccount
        fields = [
            'id', 'platform', 'platform_display', 'platform_username', 
            'platform_user_id', 'is_active', 'connected_at', 'last_used_at',
            'is_connected', 'metadata'
        ]
        read_only_fields = ('id', 'connected_at', 'last_used_at', 'metadata')
    
    def get_is_connected(self, obj):
        """Check if account has valid credentials"""
        return bool(obj.access_token and obj.is_active)
    
    def to_representation(self, instance):
        """Hide sensitive token information"""
        data = super().to_representation(instance)
        # Don't expose full metadata, just show connection status
        if 'metadata' in data:
            # Only show safe metadata fields
            safe_metadata = {
                'has_refresh_token': bool(instance.refresh_token),
                'token_expires_at': instance.token_expires_at.isoformat() if instance.token_expires_at else None,
            }
            data['metadata'] = safe_metadata
        return data


class SocialAccountCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating social accounts (used during OAuth flow)"""
    
    class Meta:
        model = SocialAccount
        fields = ['platform', 'access_token', 'refresh_token', 'token_expires_at', 
                  'platform_user_id', 'platform_username', 'metadata']
    
    def create(self, validated_data):
        """Create or update social account for user"""
        user = self.context['request'].user
        platform = validated_data['platform']
        
        # Update or create
        social_account, created = SocialAccount.objects.update_or_create(
            user=user,
            platform=platform,
            defaults=validated_data
        )
        
        return social_account
