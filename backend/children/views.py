from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ChildProfile
from .serializers import ChildProfileSerializer


class ChildProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ChildProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChildProfile.objects.filter(parent=self.request.user, is_active=True)

    @action(detail=True, methods=['post'], url_path='verify-pin')
    def verify_pin(self, request, pk=None):
        """Verify child PIN for offline auth."""
        child = self.get_object()
        pin = request.data.get('pin', '')
        if child.pin and child.pin == pin:
            return Response({'valid': True, 'child_id': str(child.id), 'name': child.name})
        return Response({'valid': False}, status=status.HTTP_401_UNAUTHORIZED)
