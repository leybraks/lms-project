# backend/api/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Enrollment, Conversation, Course, User, Lesson,Message

@receiver(post_save, sender=Enrollment)
def add_user_to_course_chat(sender, instance, created, **kwargs):
    """
    Cuando se crea una nueva Inscripción (Enrollment),
    automáticamente añade al usuario al chat grupal de ese curso
    Y a TODOS los chats de lecciones de ese curso.
    """
    if created: # Solo se ejecuta cuando se crea una *nueva* inscripción
        try:
            course = instance.course
            user = instance.user

            # --- PARTE 1: Añadir al chat principal del curso ---
            # (Se busca el chat grupal que NO está atado a una lección)
            group_chat, created_chat = Conversation.objects.get_or_create(
                course=course,
                is_group=True,
                lesson_chat__isnull=True, # <-- Ser explícito es mejor
                defaults={'name': f"Grupo: {course.title}"}
            )
            
            group_chat.participants.add(user)
            
            # Asegurarse de que el profesor también esté
            if course.professor:
                group_chat.participants.add(course.professor)

            # --- PARTE 2: (LA CORRECCIÓN) ---
            # Añadir al usuario a TODOS los chats de lecciones existentes de ese curso
            
            # 1. Encontrar todas las conversaciones que SÍ están atadas a una lección de este curso
            lesson_chats = Conversation.objects.filter(
                course=course,
                is_group=True,
                lesson_chat__isnull=False # <-- Solo chats de lección
            )
            
            # 2. Añadir al nuevo usuario a cada uno de esos chats
            for lesson_chat in lesson_chats:
                lesson_chat.participants.add(user)
            # --- FIN DE LA CORRECCIÓN PARTE 2 ---

        except Exception as e:
            # (Es bueno tener un log por si algo falla)
            print(f"Error en el signal add_user_to_course_chat: {e}")

@receiver(post_save, sender=Lesson)
def create_lesson_chat(sender, instance, created, **kwargs):
    """
    Cuando se crea una nueva Lección (Lesson),
    automáticamente crea una Conversación de chat grupal para ella
    Y añade al profesor Y a TODOS los alumnos ya inscritos.
    """
    if created and not instance.chat_conversation:
        try:
            course = instance.module.course

            # 1. Crear la nueva conversación
            group_chat = Conversation.objects.create(
                course=course, # Vincula al curso principal
                is_group=True,
                name=f"Chat: {instance.title}" # Nombre del chat
            )
            
            # 2. Asignar el chat a la lección
            instance.chat_conversation = group_chat
            instance.save()
            
            # 3. (Opcional) Añadir al profesor al chat
            if course.professor:
                group_chat.participants.add(course.professor)
                
            # --- PARTE 2: (LA CORRECCIÓN) ---
            # Añadir a TODOS los alumnos que ya están inscritos en el curso
            
            # 1. Buscar los IDs de todos los usuarios inscritos
            enrolled_student_ids = Enrollment.objects.filter(
                course=course
            ).values_list('user_id', flat=True)
            
            # 2. Añadir a todos esos usuarios a los participantes del chat
            if enrolled_student_ids:
                group_chat.participants.add(*enrolled_student_ids)
            # --- FIN DE LA CORRECCIÓN PARTE 2 ---

        except Exception as e:
            print(f"Error en el signal create_lesson_chat: {e}")

@receiver(post_save, sender=Message)
def update_conversation_last_message(sender, instance, created, **kwargs):
    """
    Cuando se crea un nuevo Mensaje,
    actualiza el campo 'last_message' en su Conversación.
    """
    if created:
        try:
            Conversation.objects.filter(id=instance.conversation.id).update(
            last_message=instance,
            )
        except Exception as e:
            print(f"Error en el signal update_conversation_last_message: {e}")