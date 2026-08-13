from django.db import models
from django.conf import settings
import uuid


class ChildProfile(models.Model):
    AVATAR_CHOICES = [
        ('bear', 'Bear'),
        ('cat', 'Cat'),
        ('dog', 'Dog'),
        ('elephant', 'Elephant'),
        ('fox', 'Fox'),
        ('lion', 'Lion'),
        ('owl', 'Owl'),
        ('penguin', 'Penguin'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='children'
    )
    name = models.CharField(max_length=100)
    avatar = models.CharField(max_length=20, choices=AVATAR_CHOICES, default='bear')
    date_of_birth = models.DateField(null=True, blank=True)
    pin = models.CharField(max_length=4, blank=True, help_text='4-digit PIN for offline child login')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'children_childprofile'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} (parent: {self.parent.email})"
