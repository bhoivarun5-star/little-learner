from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Game
from .serializers import GameSerializer


class GameViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Game.objects.filter(is_published=True)
    serializer_class = GameSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['module', 'game_type']
