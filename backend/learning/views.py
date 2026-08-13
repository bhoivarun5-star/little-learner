from rest_framework import viewsets, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import LearningModule, Lesson
from .serializers import LearningModuleSerializer, LearningModuleDetailSerializer, LessonSerializer


class LearningModuleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return LearningModule.objects.filter(is_published=True).prefetch_related('lessons')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LearningModuleDetailSerializer
        return LearningModuleSerializer

    @action(detail=True, methods=['get'], url_path='manifest')
    def manifest(self, request, slug=None):
        """Return asset manifest for offline download."""
        module = self.get_object()
        lessons = module.lessons.filter(is_published=True)
        assets = []
        for lesson in lessons:
            if lesson.audio_url:
                assets.append({'url': lesson.audio_url, 'type': 'audio', 'lesson_id': str(lesson.id)})
            content = lesson.content_json
            if isinstance(content, dict):
                for slide in content.get('slides', []):
                    if slide.get('image_url'):
                        assets.append({'url': slide['image_url'], 'type': 'image', 'lesson_id': str(lesson.id)})
        return Response({
            'module_id': str(module.id),
            'slug': module.slug,
            'version': module.version,
            'size_bytes': module.size_bytes,
            'assets': assets,
        })

    @action(detail=True, methods=['get'])
    def lessons(self, request, slug=None):
        module = self.get_object()
        lessons = module.lessons.filter(is_published=True)
        serializer = LessonSerializer(lessons, many=True)
        return Response(serializer.data)
