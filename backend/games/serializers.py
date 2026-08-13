from rest_framework import serializers
from .models import Game


class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ('id', 'module', 'title', 'game_type', 'description', 'config_json', 'max_level', 'icon_emoji', 'updated_at')
        read_only_fields = ('id',)
