from django.db import models
from learning.models import LearningModule
import uuid


class Game(models.Model):
    ALPHABET_MATCH = 'alphabet_match'
    NUMBER_MATCH = 'number_match'
    MEMORY_CARDS = 'memory_cards'
    SHAPE_SORTER = 'shape_sorter'
    COUNTING = 'counting'
    COLOR_MATCH = 'color_match'
    DRAG_DROP = 'drag_drop'

    GAME_TYPE_CHOICES = [
        (ALPHABET_MATCH, 'Alphabet Matching'),
        (NUMBER_MATCH, 'Number Matching'),
        (MEMORY_CARDS, 'Memory Cards'),
        (SHAPE_SORTER, 'Shape Sorter'),
        (COUNTING, 'Counting Game'),
        (COLOR_MATCH, 'Color Matching'),
        (DRAG_DROP, 'Drag and Drop'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(LearningModule, on_delete=models.CASCADE, related_name='games', null=True, blank=True)
    title = models.CharField(max_length=200)
    game_type = models.CharField(max_length=30, choices=GAME_TYPE_CHOICES)
    description = models.TextField(blank=True)
    config_json = models.JSONField(default=dict, help_text='Game levels, items, difficulties')
    max_level = models.PositiveIntegerField(default=3)
    icon_emoji = models.CharField(max_length=10, default='🎮')
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'games_game'
        ordering = ['title']

    def __str__(self):
        return self.title
