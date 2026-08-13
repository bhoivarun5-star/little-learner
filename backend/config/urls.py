from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/children/', include('children.urls')),
    path('api/modules/', include('learning.urls')),
    path('api/games/', include('games.urls')),
    path('api/quiz/', include('quiz.urls')),
    path('api/progress/', include('progress.urls')),
    path('api/content/', include('content.urls')),
    path('api/sync/', include('sync_engine.urls')),
    path('ping/', lambda request: __import__('django.http', fromlist=['JsonResponse']).JsonResponse({'status': 'ok'})),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
