from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from children.models import ChildProfile
from progress.models import GameScore, QuizResult, LessonCompletion, Progress
from progress.serializers import GameScoreSerializer, QuizResultSerializer, LessonCompletionSerializer, ProgressSerializer
from .models import SyncLog
import logging

logger = logging.getLogger(__name__)


class SyncPushView(APIView):
    """
    Accepts a bulk payload of offline operations from the client and applies them.
    Conflict resolution: Last-Write-Wins with server-timestamp authority.
    Progress/scores: Additive only (scores never go backward).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        operations = request.data.get('operations', [])
        results = []

        for op in operations:
            entity_type = op.get('entity_type')
            operation = op.get('operation')
            local_id = op.get('local_id')
            payload = op.get('payload', {})

            try:
                result = self._process_operation(request.user, entity_type, operation, local_id, payload)
                results.append({'local_id': local_id, 'status': 'synced', 'server_id': result})

                SyncLog.objects.create(
                    child_id=payload.get('child_id'),
                    operation=operation,
                    entity_type=entity_type,
                    local_id=local_id,
                    server_id=result,
                    payload_json=payload,
                    status=SyncLog.SYNCED,
                    synced_at=timezone.now(),
                )
            except Exception as e:
                logger.error(f"Sync error for {entity_type}/{local_id}: {e}")
                results.append({'local_id': local_id, 'status': 'failed', 'error': str(e)})
                SyncLog.objects.create(
                    operation=operation,
                    entity_type=entity_type,
                    local_id=local_id,
                    payload_json=payload,
                    status=SyncLog.FAILED,
                    last_error=str(e),
                )

        return Response({'results': results, 'processed': len(results)})

    def _process_operation(self, user, entity_type, operation, local_id, payload):
        child_id = payload.get('child_id')
        child = ChildProfile.objects.get(id=child_id, parent=user)

        if entity_type == 'game_score':
            if GameScore.objects.filter(local_id=local_id).exists():
                obj = GameScore.objects.get(local_id=local_id)
                return str(obj.id)
            obj = GameScore.objects.create(
                child=child,
                game_id=payload['game_id'],
                score=payload['score'],
                max_score=payload.get('max_score', 100),
                level=payload.get('level', 1),
                time_taken_seconds=payload.get('time_taken_seconds', 0),
                local_id=local_id,
            )
            return str(obj.id)

        elif entity_type == 'quiz_result':
            if QuizResult.objects.filter(local_id=local_id).exists():
                obj = QuizResult.objects.get(local_id=local_id)
                return str(obj.id)
            obj = QuizResult.objects.create(
                child=child,
                quiz_id=payload['quiz_id'],
                score=payload['score'],
                total_points=payload.get('total_points', 100),
                time_taken_seconds=payload.get('time_taken_seconds', 0),
                answers_json=payload.get('answers_json', []),
                local_id=local_id,
            )
            return str(obj.id)

        elif entity_type == 'lesson_completion':
            obj, _ = LessonCompletion.objects.get_or_create(
                child=child,
                lesson_id=payload['lesson_id'],
                defaults={'time_spent_seconds': payload.get('time_spent_seconds', 0)}
            )
            return str(obj.id)

        elif entity_type == 'progress':
            obj, created = Progress.objects.get_or_create(
                child=child,
                module_id=payload['module_id'],
            )
            # Additive: only update if client value is higher
            new_percent = float(payload.get('percent_complete', 0))
            if new_percent > obj.percent_complete:
                obj.percent_complete = new_percent
                obj.total_time_seconds = payload.get('total_time_seconds', obj.total_time_seconds)
                obj.save()
            return str(obj.id)

        raise ValueError(f"Unknown entity_type: {entity_type}")


class SyncPullView(APIView):
    """Pull all server-side data for a child since a given timestamp."""
    permission_classes = [IsAuthenticated]

    def get(self, request, child_id):
        child = ChildProfile.objects.get(id=child_id, parent=request.user)
        since = request.query_params.get('since')

        qs_kwargs = {}
        if since:
            from django.utils.dateparse import parse_datetime
            since_dt = parse_datetime(since)
            if since_dt:
                qs_kwargs['completed_at__gte'] = since_dt

        return Response({
            'child_id': str(child.id),
            'game_scores': GameScoreSerializer(
                GameScore.objects.filter(child=child, **qs_kwargs), many=True).data,
            'quiz_results': QuizResultSerializer(
                QuizResult.objects.filter(child=child, **({'completed_at__gte': qs_kwargs.get('completed_at__gte')} if qs_kwargs else {})), many=True).data,
            'progress': ProgressSerializer(
                Progress.objects.filter(child=child), many=True).data,
        })
