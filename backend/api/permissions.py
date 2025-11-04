# backend/api/permissions.py

from rest_framework import permissions
from .models import Enrollment, Lesson, Module, Assignment, Quiz

class IsEnrolledPermission(permissions.BasePermission):
    """
    Permiso personalizado para permitir el acceso solo a usuarios
    inscritos en el curso al que pertenece el contenido.
    """
    message = 'Debes estar inscrito en este curso para ver este contenido.'

    def has_permission(self, request, view):
        """
        Comprueba la inscripción basándose en la URL.
        """
        
        course = None
        
        # 1. Comprobar si es una Lección (ej: /api/lessons/6/)
        if 'pk' in view.kwargs and view.queryset.model == Lesson:
            try:
                lesson = Lesson.objects.select_related('module__course').get(pk=view.kwargs['pk'])
                course = lesson.module.course
            except Lesson.DoesNotExist:
                return False 

        # 2. Comprobar si es una Tarea (ej: /api/assignments/lesson/6/)
        elif 'lesson_id' in view.kwargs and view.queryset.model == Assignment:
            try:
                lesson = Lesson.objects.select_related('module__course').get(id=view.kwargs['lesson_id'])
                course = lesson.module.course
            except Lesson.DoesNotExist:
                return False
        
        # ==========================================================
        # 3. ¡NUEVA COMPROBACIÓN! Si es un Examen (ej: /api/quizzes/module/1/)
        # ==========================================================
        elif 'module_id' in view.kwargs and view.queryset.model == Quiz:
            try:
                module = Module.objects.select_related('course').get(id=view.kwargs['module_id'])
                course = module.course
            except Module.DoesNotExist:
                return False
        
        # 4. Si no podemos determinar el curso, denegar
        if not course:
            return False

        # 5. ¡La comprobación final!
        is_enrolled = Enrollment.objects.filter(
            user=request.user, 
            course=course
        ).exists()

        return is_enrolled