# backend/api/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Enrollment, Conversation, Course, User

@receiver(post_save, sender=Enrollment)
def add_user_to_course_chat(sender, instance, created, **kwargs):
    """
    Cuando se crea una nueva Inscripción (Enrollment),
    automáticamente añade al usuario al chat grupal de ese curso.
    """
    if created: # Solo se ejecuta cuando se crea una *nueva* inscripción
        try:
            course = instance.course
            user = instance.user

            # 1. Encontrar (o crear) el chat grupal para este curso
            group_chat, created_chat = Conversation.objects.get_or_create(
                course=course,
                is_group=True,
                defaults={'name': f"Grupo: {course.title}"} # Asigna el nombre si se crea
            )
            
            # 2. Añadir al nuevo alumno a los participantes
            group_chat.participants.add(user)
            
            # 3. (Importante) Asegurarse de que el profesor también esté
            if course.professor:
                group_chat.participants.add(course.professor)

        except Exception as e:
            # (Es bueno tener un log por si algo falla)
            print(f"Error en el signal add_user_to_course_chat: {e}")