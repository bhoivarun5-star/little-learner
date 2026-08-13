from django.db import models
from learning.models import LearningModule
import uuid


class Quiz(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(LearningModule, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    time_limit_seconds = models.PositiveIntegerField(default=0, help_text='0 = no limit')
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quiz_quiz'

    def __str__(self):
        return f"{self.module.title} Quiz: {self.title}"


class Question(models.Model):
    MULTIPLE_CHOICE = 'multiple_choice'
    IMAGE_CHOICE = 'image_choice'
    TRUE_FALSE = 'true_false'

    QUESTION_TYPE_CHOICES = [
        (MULTIPLE_CHOICE, 'Multiple Choice'),
        (IMAGE_CHOICE, 'Image Choice'),
        (TRUE_FALSE, 'True/False'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=500)
    image_url = models.URLField(blank=True)
    audio_url = models.URLField(blank=True)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default=MULTIPLE_CHOICE)
    order = models.PositiveIntegerField(default=0)
    points = models.PositiveIntegerField(default=10)

    class Meta:
        db_table = 'quiz_question'
        ordering = ['order']

    def __str__(self):
        return self.text[:60]


class Answer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    text = models.CharField(max_length=300)
    image_url = models.URLField(blank=True)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'quiz_answer'
        ordering = ['order']

    def __str__(self):
        return f"{'✓' if self.is_correct else '✗'} {self.text[:40]}"
