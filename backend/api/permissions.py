# backend/api/permissions.py

from rest_framework import permissions
from .models import Enrollment, Lesson, Module

class IsEnrolledPermission(permissions.BasePermission):
    """
    Permiso personalizado para permitir el acceso solo a usuarios
    inscritos en el curso al que pertenece el objeto.
    
    Este permiso es más complejo porque debe funcionar para Lecciones,
    Módulos, Tareas, etc.
    """

    message = 'Debes estar inscrito en este curso para ver este contenido.'

    def has_permission(self, request, view):
        """
        Esta comprobación se ejecuta ANTES de 'has_object_permission'.
        Comprueba la inscripción basándose en la URL.
        """
        
        # Si la vista es 'LessonDetailView', la URL tendrá 'pk' (el ID de la lección)
        if 'pk' in view.kwargs:
            lesson_id = view.kwargs['pk']
            try:
                # Buscamos la lección y su curso
                lesson = Lesson.objects.get(id=lesson_id)
                course = lesson.module.course
            except Lesson.DoesNotExist:
                return False # Si la lección no existe, denegar (aunque dará 404)

        # Si la vista es 'AssignmentDetailView', la URL tendrá 'lesson_id'
        elif 'lesson_id' in view.kwargs:
            lesson_id = view.kwargs['lesson_id']
            try:
                lesson = Lesson.objects.get(id=lesson_id)
                course = lesson.module.course
            except Lesson.DoesNotExist:
                return False

        else:
            # No podemos determinar el curso desde la URL, 
            # así que dejamos que 'has_object_permission' se encargue (si aplica)
            return True

        # Una vez que tenemos el 'course', verificamos la inscripción
        is_enrolled = Enrollment.objects.filter(
            user=request.user, 
            course=course
        ).exists()

        return is_enrolled

    def has_object_permission(self, request, view, obj):
        """
        Esta comprobación es una segunda capa de seguridad DESPUÉS de 
        que el objeto se ha cargado (ej. para vistas 'Update' o 'Delete').
        """
        # (La lógica de 'has_permission' ya hizo el trabajo pesado 
        # para nuestras vistas de detalle, pero mantenemos esto por si acaso)
        
        course = None
        if isinstance(obj, Lesson):
            course = obj.module.course
        elif isinstance(obj, Module):
            course = obj.course
        
        if not course:
            return False # No podemos determinar el curso, denegar

        # Comprobación final
        return Enrollment.objects.filter(
            user=request.user, 
            course=course
        ).exists()