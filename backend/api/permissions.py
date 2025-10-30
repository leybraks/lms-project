# backend/api/permissions.py

from rest_framework import permissions
from .models import Enrollment, Lesson

class IsEnrolledPermission(permissions.BasePermission):
    """
    Permiso personalizado para permitir el acceso solo a usuarios
    inscritos en el curso al que pertenece el objeto (Lección).
    """

    message = 'Debes estar inscrito en este curso para ver esta lección.'

    def has_object_permission(self, request, view, obj):
        # 1. Asegurarse de que el objeto es una Lección
        if not isinstance(obj, Lesson):
            # Si no es una lección, no aplicamos este permiso aquí
            # (podrías querer devolver False si solo se usa para lecciones)
            return True # O False dependiendo de tu lógica

        # 2. Obtener la lección y su curso asociado
        lesson = obj
        course = lesson.module.course

        # 3. Verificar si existe una inscripción activa para este usuario y curso
        is_enrolled = Enrollment.objects.filter(
            user=request.user, 
            course=course
        ).exists()

        return is_enrolled