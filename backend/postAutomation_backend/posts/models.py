from django.db import models
from django.conf import settings

class Post(models.Model):
    PLATFORM_CHOICES = [
        ('instagram', 'Instagram'),
        ('twitter', 'Twitter'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES)
    content = models.TextField()
    media_url = models.URLField(blank=True, null=True)
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.platform} - {self.status}"
