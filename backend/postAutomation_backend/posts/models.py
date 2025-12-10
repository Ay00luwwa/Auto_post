from django.db import models
from django.conf import settings
import json

class Post(models.Model):
    PLATFORM_CHOICES = [
        ('instagram', 'Instagram'),
        ('twitter', 'Twitter'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('posted', 'Posted'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES)
    content = models.TextField()
    media_url = models.URLField(blank=True, null=True)
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    celery_task_id = models.CharField(max_length=255, blank=True, null=True)
    external_post_id = models.CharField(max_length=255, blank=True, null=True, help_text="ID returned by the platform API")

    class Meta:
        ordering = ['-scheduled_time']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['platform', 'status']),
            models.Index(fields=['scheduled_time']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.platform} - {self.status}"


class SocialAccount(models.Model):
    """
    Store OAuth tokens and credentials for each user's social media accounts
    """
    PLATFORM_CHOICES = [
        ('instagram', 'Instagram'),
        ('twitter', 'Twitter'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='social_accounts')
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES)
    
    # OAuth tokens
    access_token = models.TextField(help_text="OAuth access token")
    refresh_token = models.TextField(blank=True, null=True, help_text="OAuth refresh token")
    token_expires_at = models.DateTimeField(blank=True, null=True, help_text="When the access token expires")
    
    # Platform-specific IDs
    platform_user_id = models.CharField(max_length=255, blank=True, null=True, help_text="User ID on the platform")
    platform_username = models.CharField(max_length=255, blank=True, null=True, help_text="Username on the platform")
    
    # Additional metadata stored as JSON
    metadata = models.JSONField(default=dict, blank=True, help_text="Additional platform-specific data")
    
    # Status
    is_active = models.BooleanField(default=True, help_text="Whether this account is active and can be used")
    connected_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        unique_together = ['user', 'platform']
        indexes = [
            models.Index(fields=['user', 'platform']),
            models.Index(fields=['platform', 'is_active']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.platform}"
    
    def is_connected(self):
        """Check if account has valid credentials"""
        return bool(self.access_token and self.is_active)
