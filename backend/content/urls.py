from django.urls import path
from .views import ContentVersionView

urlpatterns = [
    path('version/', ContentVersionView.as_view(), name='content-version'),
]
