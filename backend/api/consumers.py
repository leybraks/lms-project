# backend/api/consumers.py
import json # <-- ¡Importación que faltaba!
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Lesson, Message, Conversation, User # <-- ¡Importa User!
from .serializers import MessageSerializer, UserSerializer
from django.contrib.auth import get_user_model

# (User = get_user_model() no es necesario si lo importamos directamente)

class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        # 1. Obtener el ID de la lección desde la URL
        self.lesson_id = self.scope['url_route']['kwargs']['lesson_id']
        self.user = self.scope['user']
        
        # 2. Verificar que el usuario esté autenticado
        if not self.user.is_authenticated:
            await self.close()
            return

        # 3. Obtener la lección y la conversación
        self.lesson = await self.get_lesson()
        if not self.lesson:
            await self.close()
            return
            
        self.conversation = await self.get_conversation()
        if not self.conversation:
            # (Si el signal no se ha ejecutado, crea el chat ahora)
            self.conversation = await self.create_conversation_for_lesson()
            
        # 4. Añadir al usuario a la conversación (si no está)
        #    y unirlos a un "grupo" de Channels (la sala de chat)
        await self.add_user_to_conversation()
        self.room_group_name = f'chat_lesson_{self.lesson_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        # Salir del grupo de Channels
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # --- Recibir Mensajes (desde el Frontend) ---
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('message_type', 'TEXT')
        content = data.get('content')
        language = data.get('language')

        if not content:
            return # No guardar mensajes vacíos

        # 1. Guardar el mensaje en la base de datos
        message = await self.create_message(message_type, content, language)
        
        # 2. Serializar el mensaje para enviarlo (con datos del sender)
        message_data = await self.serialize_message(message)

        # 3. Retransmitir el mensaje a todos en el grupo
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message', # Esto llama a la función chat_message
                'message': message_data
            }
        )

    # --- Enviar Mensajes (hacia el Frontend) ---
    async def chat_message(self, event):
        message = event['message']
        
        # Enviar el mensaje al WebSocket (el frontend)
        await self.send(text_data=json.dumps({
            'message': message
        }))

    # --- Funciones de Base de Datos (Seguras) ---
    
    @database_sync_to_async
    def get_lesson(self):
        try:
            # Usamos select_related para optimizar y traer todo en una consulta
            return Lesson.objects.select_related(
                'chat_conversation', 
                'module__course__professor'
            ).get(id=self.lesson_id)
        except Lesson.DoesNotExist:
            return None

    @database_sync_to_async
    def get_conversation(self):
        if self.lesson and self.lesson.chat_conversation:
            return self.lesson.chat_conversation
        return None
    
    @database_sync_to_async
    def create_conversation_for_lesson(self):
        # Fallback por si el signal falló
        group_chat = Conversation.objects.create(
            course=self.lesson.module.course,
            is_group=True,
            name=f"Chat: {self.lesson.title}"
        )
        self.lesson.chat_conversation = group_chat
        self.lesson.save()
        
        if self.lesson.module.course.professor:
            group_chat.participants.add(self.lesson.module.course.professor)
        
        return group_chat
        
    @database_sync_to_async
    def add_user_to_conversation(self):
        self.conversation.participants.add(self.user)
        
    @database_sync_to_async
    def create_message(self, msg_type, content, lang):
        return Message.objects.create(
            conversation=self.conversation,
            sender=self.user,
            message_type=msg_type,
            content=content,
            language=lang
        )

    @database_sync_to_async
    def serialize_message(self, message):
        # Pasamos el 'UserSerializer' al contexto si no lo tienes
        return MessageSerializer(message, context={'user_serializer': UserSerializer}).data