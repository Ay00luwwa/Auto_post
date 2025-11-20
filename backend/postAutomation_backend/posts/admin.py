from django.contrib import admin
from .models import Post

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'platform', 'status', 'scheduled_time', 'created_at')
    list_filter = ('platform', 'status', 'scheduled_time')
    search_fields = ('content', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'scheduled_time'
