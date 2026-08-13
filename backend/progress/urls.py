from django.urls import path
from .views import ChildProgressView, LessonCompleteView, GameScoreView, QuizResultView, BadgeView

urlpatterns = [
    path('<uuid:child_id>/', ChildProgressView.as_view(), name='child-progress'),
    path('<uuid:child_id>/badges/', BadgeView.as_view(), name='child-badges'),
    path('lesson-complete/', LessonCompleteView.as_view(), name='lesson-complete'),
    path('game-score/', GameScoreView.as_view(), name='game-score'),
    path('quiz-result/', QuizResultView.as_view(), name='quiz-result'),
]
