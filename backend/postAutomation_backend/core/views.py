from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.core.cache import cache
import redis

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint to verify API, database, and Redis connectivity
    """
    health_status = {
        'status': 'healthy',
        'services': {}
    }
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['services']['database'] = 'healthy'
    except Exception as e:
        health_status['services']['database'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'degraded'
    
    # Check Redis/Celery broker
    try:
        from django.conf import settings
        import redis as redis_client
        
        redis_url = settings.CELERY_BROKER_URL
        if redis_url.startswith('redis://'):
            # Parse Redis URL
            redis_url = redis_url.replace('redis://', '')
            if '@' in redis_url:
                # Has password
                parts = redis_url.split('@')
                password = parts[0].split(':')[-1] if ':' in parts[0] else None
                host_port = parts[1]
            else:
                password = None
                host_port = redis_url
            
            host, port = host_port.split(':') if ':' in host_port else (host_port, 6379)
            port = int(port.split('/')[0])  # Remove database number if present
            
            r = redis_client.Redis(host=host, port=port, password=password, socket_connect_timeout=2)
            r.ping()
            health_status['services']['redis'] = 'healthy'
        else:
            health_status['services']['redis'] = 'not_configured'
    except Exception as e:
        health_status['services']['redis'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'degraded'
    
    http_status = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return Response(health_status, status=http_status)



