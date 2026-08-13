from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChildProfileViewSet

router = DefaultRouter()
router.register(r'', ChildProfileViewSet, basename='children')

urlpatterns = [
    path('', include(router.urls)),
]
