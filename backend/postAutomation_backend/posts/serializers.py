from rest_framework import serializers
from .models import Post
from django.utils import timezone

class PostSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ('user', 'user_id', 'status', 'created_at')

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
