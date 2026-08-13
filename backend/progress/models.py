from django.db import models
from django.conf import settings
from children.models import ChildProfile
from learning.models import LearningModule, Lesson
from games.models import Game
from quiz.models import Quiz
import uuid


class Progress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name='progress')
    module = models.ForeignKey(LearningModule, on_delete=models.CASCADE, related_name='progress')
    percent_complete = models.FloatField(default=0.0)
    last_accessed = models.DateTimeField(auto_now=True)
    streak_days = models.PositiveIntegerField(default=0)
    total_time_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'progress_progress'
        unique_together = ('child', 'module')

    def __str__(self):
        return f"{self.child.name} - {self.module.title}: {self.percent_complete:.0f}%"


class LessonCompletion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name='lesson_completions')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='completions')
    completed_at = models.DateTimeField(auto_now_add=True)
    time_spent_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'progress_lesson_completion'
        unique_together = ('child', 'lesson')


class GameScore(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name='game_scores')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='scores')
    score = models.PositiveIntegerField(default=0)
    max_score = models.PositiveIntegerField(default=100)
    level = models.PositiveIntegerField(default=1)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)
    local_id = models.CharField(max_length=100, blank=True, help_text='Client-side UUID for sync deduplication')

    class Meta:
        db_table = 'progress_game_score'
        ordering = ['-completed_at']


class QuizResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name='quiz_results')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='results')
    score = models.PositiveIntegerField(default=0)
    total_points = models.PositiveIntegerField(default=0)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)
    answers_json = models.JSONField(default=list, help_text='List of {question_id, answer_id, is_correct}')
    local_id = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'progress_quiz_result'
        ordering = ['-completed_at']


class Badge(models.Model):
    FIRST_LESSON = 'first_lesson'
    LESSON_STREAK_3 = 'lesson_streak_3'
    LESSON_STREAK_7 = 'lesson_streak_7'
    PERFECT_QUIZ = 'perfect_quiz'
    GAME_MASTER = 'game_master'
    ALPHABET_COMPLETE = 'alphabet_complete'
    NUMBERS_COMPLETE = 'numbers_complete'
    COLORS_COMPLETE = 'colors_complete'
    SHAPES_COMPLETE = 'shapes_complete'
    ANIMALS_COMPLETE = 'animals_complete'
    ALL_MODULES = 'all_modules'

    BADGE_TYPE_CHOICES = [
        (FIRST_LESSON, 'First Lesson! 🌟'),
        (LESSON_STREAK_3, '3-Day Streak! 🔥'),
        (LESSON_STREAK_7, 'Week Warrior! 🏆'),
        (PERFECT_QUIZ, 'Quiz Champion! 🎯'),
        (GAME_MASTER, 'Game Master! 🎮'),
        (ALPHABET_COMPLETE, 'ABC Expert! 🔤'),
        (NUMBERS_COMPLETE, 'Number Ninja! 🔢'),
        (COLORS_COMPLETE, 'Color Wizard! 🎨'),
        (SHAPES_COMPLETE, 'Shape Star! ⭐'),
        (ANIMALS_COMPLETE, 'Animal Friend! 🐾'),
        (ALL_MODULES, 'Super Learner! 🚀'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name='badges')
    badge_type = models.CharField(max_length=30, choices=BADGE_TYPE_CHOICES)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'progress_badge'
        unique_together = ('child', 'badge_type')

    def __str__(self):
        return f"{self.child.name} - {self.get_badge_type_display()}"
