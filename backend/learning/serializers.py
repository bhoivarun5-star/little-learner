from rest_framework import serializers
from .models import LearningModule, Lesson


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ('id', 'module', 'title', 'order', 'content_json', 'audio_url', 'duration_seconds', 'is_published', 'updated_at')
        read_only_fields = ('id',)


class LearningModuleSerializer(serializers.ModelSerializer):
    lesson_count = serializers.SerializerMethodField()

    class Meta:
        model = LearningModule
        fields = (
            'id', 'slug', 'title', 'description', 'module_type',
            'thumbnail_url', 'icon_emoji', 'color_hex', 'size_bytes',
            'version', 'order', 'is_published', 'is_free',
            'lesson_count', 'updated_at'
        )
        read_only_fields = ('id',)

    def get_lesson_count(self, obj):
        return obj.lessons.filter(is_published=True).count()


class LearningModuleDetailSerializer(LearningModuleSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta(LearningModuleSerializer.Meta):
        fields = LearningModuleSerializer.Meta.fields + ('lessons',)
