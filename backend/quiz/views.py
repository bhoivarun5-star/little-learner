from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Quiz
from .serializers import QuizSerializer, QuizDetailSerializer


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    filterset_fields = ['module']

    def get_queryset(self):
        return Quiz.objects.filter(is_published=True).prefetch_related('questions__answers')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailSerializer
        return QuizSerializer
