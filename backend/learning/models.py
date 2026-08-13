from django.db import models
import uuid


class LearningModule(models.Model):
    ALPHABET = 'alphabet'
    NUMBERS = 'numbers'
    COLORS = 'colors'
    SHAPES = 'shapes'
    ANIMALS = 'animals'
    FRUITS = 'fruits'
    WORDS = 'words'
    STORIES = 'stories'
    MATHEMATICS = 'mathematics'
    ENGLISH = 'english'

    MODULE_TYPE_CHOICES = [
        (ALPHABET, 'Alphabet'),
        (NUMBERS, 'Numbers'),
        (COLORS, 'Colors'),
        (SHAPES, 'Shapes'),
        (ANIMALS, 'Animals'),
        (FRUITS, 'Fruits & Vegetables'),
        (WORDS, 'Basic Words'),
        (STORIES, 'Stories'),
        (MATHEMATICS, 'Mathematics'),
        (ENGLISH, 'English'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    module_type = models.CharField(max_length=20, choices=MODULE_TYPE_CHOICES)
    thumbnail_url = models.URLField(blank=True)
    icon_emoji = models.CharField(max_length=10, default='📚')
    color_hex = models.CharField(max_length=7, default='#6C63FF')
    size_bytes = models.BigIntegerField(default=0)
    version = models.CharField(max_length=20, default='1.0.0')
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    is_free = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'learning_module'
        ordering = ['order', 'title']

    def __str__(self):
        return self.title


class Lesson(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(LearningModule, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    content_json = models.JSONField(default=dict, help_text='Lesson content: slides, activities, text')
    audio_url = models.URLField(blank=True)
    duration_seconds = models.PositiveIntegerField(default=120)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'learning_lesson'
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"
