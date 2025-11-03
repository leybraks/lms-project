# backend/api/urls.py

from django.urls import path
# ¡ESTA ES LA IMPORTACIÓN CORREGIDA!
# Usamos los nombres exactos definidos en api/views.py
from .views import (
    ListaDeCursosView, 
    DetalleDeCursoView, 
    EnrollmentCreateView, 
    MyEnrollmentListView,
    LessonCompleteView,
    MyLessonCompletionsListView,
    AssignmentDetailView,    # <-- ¡Importa esta!
    SubmissionCreateUpdateView,
    get_me_view # Importamos esta también, ya que existe en views.py
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
]
