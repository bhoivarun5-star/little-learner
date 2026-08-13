from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from learning.models import LearningModule


class ContentVersionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Return current versions of all published modules for cache invalidation."""
        modules = LearningModule.objects.filter(is_published=True).values('slug', 'version', 'updated_at')
        return Response({
            'app_version': '1.0.0',
            'modules': list(modules),
        })
