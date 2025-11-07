# backend/api/urls.py

from django.urls import path, include
# ¡ESTA ES LA IMPORTACIÓN CORREGIDA!
# Usamos los nombres exactos definidos en api/views.py
from django.conf import settings # Importa
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import (
    ListaDeCursosView, 
    DetalleDeCursoView, 
    EnrollmentCreateView, 
    MyEnrollmentListView,
    LessonCompleteView,
    LessonDetailView,
    MyLessonCompletionsListView,
    AssignmentDetailView,    # <-- ¡Importa esta!
    SubmissionCreateUpdateView,
    MySubmissionsListView,
    QuizDetailView,
    UpcomingLessonsView,
    MyMentorsView,
    MessageListView,
    ContactListView,
    StartDirectMessageView, # <-- Esta la vamos a borrar
    GroupChatListView,
    LessonNoteViewSet,
    get_dashboard_stats,
    get_me_view # Importamos esta también, ya que existe en views.py
) 

# --- Define un router (si no tienes uno) ---
router = DefaultRouter()
# Registra el ViewSet para la ruta: /api/lessons/<lesson_id>/notes/
router.register(
    r'lessons/(?P<lesson_id>\d+)/notes', 
    LessonNoteViewSet, 
    basename='lesson-notes'
)

urlpatterns = [
    # Rutas de Cursos (usan las vistas corregidas)
    path('courses/', ListaDeCursosView.as_view(), name='course-list'),
    path('courses/<int:pk>/', DetalleDeCursoView.as_view(), name='course-detail'),
    
    # Rutas de Inscripción
    path('enroll/', EnrollmentCreateView.as_view(), name='enrollment-create'), 
    path('enrollments/my_enrollments/', MyEnrollmentListView.as_view(), name='my-enrollments'),

    # Opcional: Ruta para obtener datos del usuario
    path('users/me/', get_me_view, name='get-me'),
    path('lessons/complete/', LessonCompleteView.as_view(), name='lesson-complete'),
    path('completions/my_completions/', MyLessonCompletionsListView.as_view(), name='my-lesson-completions'),
    path('assignments/lesson/<int:lesson_id>/', AssignmentDetailView.as_view(), name='assignment-detail-by-lesson'),
    # Enviar una entrega
    path('submissions/', SubmissionCreateUpdateView.as_view(), name='submission-create'),
    path('lessons/<int:pk>/', LessonDetailView.as_view(), name='lesson-detail'),
    path('submissions/my_submissions/', MySubmissionsListView.as_view(), name='my-submissions'),
    path('quizzes/module/<int:module_id>/', QuizDetailView.as_view(), name='quiz-detail-by-module'),
    path('dashboard/stats/', get_dashboard_stats, name='dashboard-stats'),
    path('dashboard/upcoming_lessons/', UpcomingLessonsView.as_view(), name='dashboard-upcoming'),
    path('dashboard/my_mentors/', MyMentorsView.as_view(), name='dashboard-my-mentors'),
    path('completions/', LessonCompleteView.as_view(), name='lesson-complete'), 
    path('completions/my_completions/', MyLessonCompletionsListView.as_view(), name='my-completions'),
    path('inbox/group_chats/', GroupChatListView.as_view(), name='group-chat-list'), # (Nueva)
    path('inbox/conversations/<int:conversation_id>/messages/', MessageListView.as_view(), name='message-list-create'),
    path('inbox/contacts/', ContactListView.as_view(), name='contact-list'),
    path('inbox/start_dm/', StartDirectMessageView.as_view(), name='start-direct-message'),
    path('courses/all/', ListaDeCursosView.as_view(), name='course-list-all'),
    path('', include(router.urls)),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

