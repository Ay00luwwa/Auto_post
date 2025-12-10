from django.contrib import admin
from .models import Post, SocialAccount

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'platform', 'status', 'scheduled_time', 'created_at')
    list_filter = ('platform', 'status', 'scheduled_time')
    search_fields = ('content', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'scheduled_time'

@admin.register(SocialAccount)
class SocialAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'platform', 'platform_username', 'is_active', 'connected_at', 'last_used_at')
    list_filter = ('platform', 'is_active', 'connected_at')
    search_fields = ('user__username', 'platform_username', 'platform_user_id')
    readonly_fields = ('connected_at', 'last_used_at')
