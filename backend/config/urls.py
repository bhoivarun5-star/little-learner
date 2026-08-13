from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints with /api/ prefix
    path('api/auth/', include('accounts.urls')),
    path('api/children/', include('children.urls')),
    path('api/modules/', include('learning.urls')),
    path('api/games/', include('games.urls')),
    path('api/quiz/', include('quiz.urls')),
    path('api/progress/', include('progress.urls')),
    path('api/content/', include('content.urls')),
    path('api/sync/', include('sync_engine.urls')),

    # Fallback routes without /api/ prefix
    path('auth/', include('accounts.urls')),
    path('children/', include('children.urls')),
    path('modules/', include('learning.urls')),
    path('games/', include('games.urls')),
    path('quiz/', include('quiz.urls')),
    path('progress/', include('progress.urls')),
    path('content/', include('content.urls')),
    path('sync/', include('sync_engine.urls')),

    path('ping/', lambda request: __import__('django.http', fromlist=['JsonResponse']).JsonResponse({'status': 'ok'})),
    path('', lambda request: __import__('django.http', fromlist=['JsonResponse']).JsonResponse({
        'status': 'ok',
        'app': 'Little Learner API',
        'version': '1.0.0',
        'database': 'Supabase PostgreSQL'
    })),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
