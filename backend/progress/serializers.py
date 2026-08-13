from rest_framework import serializers
from .models import Progress, LessonCompletion, GameScore, QuizResult, Badge


class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progress
        fields = ('id', 'child', 'module', 'percent_complete', 'last_accessed', 'streak_days', 'total_time_seconds')
        read_only_fields = ('id',)


class LessonCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonCompletion
        fields = ('id', 'child', 'lesson', 'completed_at', 'time_spent_seconds')
        read_only_fields = ('id', 'completed_at')


class GameScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameScore
        fields = ('id', 'child', 'game', 'score', 'max_score', 'level', 'time_taken_seconds', 'completed_at', 'local_id')
        read_only_fields = ('id', 'completed_at')


class QuizResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizResult
        fields = ('id', 'child', 'quiz', 'score', 'total_points', 'time_taken_seconds', 'completed_at', 'answers_json', 'local_id')
        read_only_fields = ('id', 'completed_at')


class BadgeSerializer(serializers.ModelSerializer):
    badge_label = serializers.CharField(source='get_badge_type_display', read_only=True)

    class Meta:
        model = Badge
        fields = ('id', 'child', 'badge_type', 'badge_label', 'earned_at')
        read_only_fields = ('id', 'earned_at')
