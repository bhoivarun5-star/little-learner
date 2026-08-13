from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LearningModuleViewSet

router = DefaultRouter()
router.register(r'', LearningModuleViewSet, basename='modules')

urlpatterns = [path('', include(router.urls))]
