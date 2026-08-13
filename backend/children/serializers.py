from rest_framework import serializers
from .models import ChildProfile


class ChildProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildProfile
        fields = ('id', 'name', 'avatar', 'date_of_birth', 'pin', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {'pin': {'write_only': True}}

    def create(self, validated_data):
        validated_data['parent'] = self.context['request'].user
        return super().create(validated_data)
