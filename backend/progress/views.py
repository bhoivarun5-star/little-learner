from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from children.models import ChildProfile
from .models import Progress, LessonCompletion, GameScore, QuizResult, Badge
from .serializers import (
    ProgressSerializer, LessonCompletionSerializer,
    GameScoreSerializer, QuizResultSerializer, BadgeSerializer
)


def get_child_or_403(user, child_id):
    return get_object_or_404(ChildProfile, id=child_id, parent=user)


class ChildProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, child_id):
        child = get_child_or_403(request.user, child_id)
        progress = Progress.objects.filter(child=child).select_related('module')
        badges = Badge.objects.filter(child=child)
        game_scores = GameScore.objects.filter(child=child).order_by('-completed_at')[:20]
        quiz_results = QuizResult.objects.filter(child=child).order_by('-completed_at')[:20]
        completions = LessonCompletion.objects.filter(child=child).count()

        return Response({
            'child_id': str(child.id),
            'child_name': child.name,
            'progress': ProgressSerializer(progress, many=True).data,
            'badges': BadgeSerializer(badges, many=True).data,
            'recent_game_scores': GameScoreSerializer(game_scores, many=True).data,
            'recent_quiz_results': QuizResultSerializer(quiz_results, many=True).data,
            'total_lessons_completed': completions,
        })


class LessonCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        child = get_child_or_403(request.user, request.data.get('child_id'))
        serializer = LessonCompletionSerializer(data={**request.data, 'child': str(child.id)})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GameScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        child = get_child_or_403(request.user, request.data.get('child_id'))
        # Deduplicate by local_id
        local_id = request.data.get('local_id', '')
        if local_id and GameScore.objects.filter(local_id=local_id).exists():
            existing = GameScore.objects.get(local_id=local_id)
            return Response(GameScoreSerializer(existing).data, status=status.HTTP_200_OK)
        serializer = GameScoreSerializer(data={**request.data, 'child': str(child.id)})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuizResultView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        child = get_child_or_403(request.user, request.data.get('child_id'))
        local_id = request.data.get('local_id', '')
        if local_id and QuizResult.objects.filter(local_id=local_id).exists():
            existing = QuizResult.objects.get(local_id=local_id)
            return Response(QuizResultSerializer(existing).data, status=status.HTTP_200_OK)
        serializer = QuizResultSerializer(data={**request.data, 'child': str(child.id)})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BadgeView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BadgeSerializer

    def get_queryset(self):
        child_id = self.kwargs['child_id']
        child = get_child_or_403(self.request.user, child_id)
        return Badge.objects.filter(child=child)
