# backend/api/consumers.py
import json # <-- ¡Importación que faltaba!
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Lesson, Message, Conversation, User # <-- ¡Importa User!
from .serializers import MessageSerializer, UserSerializer
from django.contrib.auth import get_user_model

# (User = get_user_model() no es necesario si lo importamos directamente)

class ChatConsumer(AsyncWebsocketConsumer):
    
    # PEGA ESTO EN LUGAR DE TU MÉTODO connect() EXISTENTE
    async def connect(self):
        print("\n--- [WebSocket] Nueva conexión intentando ---")
        
        # 1. Obtener ID de lección y usuario
        try:
            self.lesson_id = self.scope['url_route']['kwargs']['lesson_id']
            self.user = self.scope['user']
            print(f"[WebSocket] Usuario: {self.user} | Lección ID: {self.lesson_id}")
        except Exception as e:
            print(f"[WebSocket] ERROR: No se pudo leer scope. {e}")
            await self.close()
            return

        # 2. Verificar que el usuario esté autenticado
        if not self.user.is_authenticated:
            print("[WebSocket] RECHAZADO: Usuario no autenticado.")
            await self.close()
            return
        
        print("[WebSocket] PASO 1: Usuario autenticado.")

        # 3. Obtener la lección y la conversación
        self.lesson = await self.get_lesson()
        if not self.lesson:
            print(f"[WebSocket] RECHAZADO: Lección ID {self.lesson_id} no encontrada.")
            await self.close()
            return
            
        print("[WebSocket] PASO 2: Lección encontrada.")
            
        self.conversation = await self.get_conversation()
        if not self.conversation:
            print("[WebSocket] ADVERTENCIA: No se encontró conversación, creando una nueva...")
            self.conversation = await self.create_conversation_for_lesson()
            
        print("[WebSocket] PASO 3: Conversación asegurada.")

        # 4. Unirse al grupo de Channels
        try:
            await self.add_user_to_conversation()
            self.room_group_name = f'chat_lesson_{self.lesson_id}'
            
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            print(f"[WebSocket] PASO 4: Usuario añadido al grupo '{self.room_group_name}'.")
        except Exception as e:
            # Esto fallará si Redis no está corriendo
            print(f"[WebSocket] RECHAZADO: Error al unirse al channel layer. ¿Redis está caído? {e}")
            await self.close()
            return

        # 5. Aceptar la conexión (¡SÓLO AL FINAL!)
        await self.accept()
        print("--- [WebSocket] Conexión ACEPTADA ---")

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
    

class InboxConsumer(AsyncWebsocketConsumer):
    """
    Este Consumer maneja las conexiones de WebSocket para
    las conversaciones 1-a-1 y grupales del Inbox.
    
    Solo se encarga de 'escuchar' y retransmitir. El envío
    inicial de mensajes se sigue haciendo por HTTP POST.
    """
    
    async def connect(self):
        # 1. Obtener ID de conversación y usuario
        try:
            self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
            self.user = self.scope['user']
            self.room_group_name = f'chat_conversation_{self.conversation_id}'
        except Exception as e:
            print(f"[WS Inbox] ERROR: Faltan parámetros en el scope. {e}")
            await self.close()
            return

        # 2. Verificar que el usuario esté autenticado
        if not self.user.is_authenticated:
            print("[WS Inbox] RECHAZADO: Usuario no autenticado.")
            await self.close()
            return

        # 3. ¡VERIFICACIÓN DE PERMISOS!
        #    Comprueba si el usuario es realmente un participante
        is_participant = await self.check_participation()
        
        if not is_participant:
            # Si no, cierra la conexión (¡Esto arregla el 500 y el 403!)
            print(f"[WS Inbox] RECHAZADO: Usuario {self.user} no es participante de la convo {self.conversation_id}")
            await self.close()
            return

        # 4. Si todo OK, unirse al grupo y aceptar
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"[WS Inbox] ACEPTADO: Usuario {self.user} se unió a la convo {self.conversation_id}")

    async def disconnect(self, close_code):
        # Salir del grupo
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # --- Enviar Mensajes (hacia el Frontend) ---
    # Este método es llamado por el 'group_send' desde la vista HTTP
    async def chat_message(self, event):
        message = event['message']
        
        # Enviar el mensaje al WebSocket (el frontend)
        await self.send(text_data=json.dumps({
            'message': message
        }))

    # --- Funciones de Base de Datos ---
    
    @database_sync_to_async
    def check_participation(self):
        """
        Comprueba si el 'self.user' es participante de 'self.conversation_id'.
        """
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            # Comprueba si el usuario está en los 'participants'
            return conversation.participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist:
            return False