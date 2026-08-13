from django.db import models
import uuid


class SyncLog(models.Model):
    PENDING = 'PENDING'
    SYNCED = 'SYNCED'
    FAILED = 'FAILED'
    CONFLICT = 'CONFLICT'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (SYNCED, 'Synced'),
        (FAILED, 'Failed'),
        (CONFLICT, 'Conflict'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child_id = models.UUIDField(null=True, blank=True)
    operation = models.CharField(max_length=20, help_text='create|update|delete')
    entity_type = models.CharField(max_length=50, help_text='game_score|quiz_result|lesson_completion|progress')
    local_id = models.CharField(max_length=100)
    server_id = models.CharField(max_length=100, blank=True)
    payload_json = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    retry_count = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sync_log'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.operation}/{self.entity_type} [{self.status}]"
