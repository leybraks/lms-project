# backend/api/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Enrollment, Conversation, Course, User,Lesson

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

@receiver(post_save, sender=Lesson)
def create_lesson_chat(sender, instance, created, **kwargs):
    """
    Cuando se crea una nueva Lección (Lesson),
    automáticamente crea una Conversación de chat grupal para ella.
    """
    if created and not instance.chat_conversation:
        try:
            # 1. Crear la nueva conversación
            group_chat = Conversation.objects.create(
                course=instance.module.course, # Vincula al curso principal
                is_group=True,
                name=f"Chat: {instance.title}" # Nombre del chat
            )
            
            # 2. Asignar el chat a la lección
            instance.chat_conversation = group_chat
            instance.save()
            
            # 3. (Opcional) Añadir al profesor al chat
            if instance.module.course.professor:
                group_chat.participants.add(instance.module.course.professor)
                
            # (Los alumnos se añadirán al chat general del CURSO,
            # pero este chat de LECCIÓN estará listo para usarse en el
            # consumer cuando los alumnos se conecten a la lección)

        except Exception as e:
            print(f"Error en el signal create_lesson_chat: {e}")