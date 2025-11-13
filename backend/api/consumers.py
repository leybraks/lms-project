# backend/api/consumers.py
import json # <-- ¡Importación que faltaba!
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Lesson, Message, Conversation, User, Enrollment,Quiz # <-- ¡Importa User!
from .serializers import MessageSerializer, UserSerializer
from django.db.models import F
from django.core.cache import cache
# (User = get_user_model() no es necesario si lo importamos directamente)

class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.lesson_id = self.scope['url_route']['kwargs']['lesson_id']
        self.user = self.scope['user']
        
        if not self.user.is_authenticated:
            await self.close()
            return

        self.lesson = await self.get_lesson()
        if not self.lesson:
            await self.close()
            return
        is_enrolled = await self.check_enrollment()
        is_professor = self.user == self.lesson.module.course.professor
        
        if not (is_enrolled or is_professor):
            await self.close() # Rechaza si no es alumno ni profesor
            return
        
        self.conversation = await self.get_or_create_conversation()
        
        await self.add_user_to_conversation()
        self.room_group_name = f'chat_lesson_{self.lesson_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()

        

    async def disconnect(self, close_code):
        # Primero, comprueba si la conexión tuvo éxito
        # (es decir, si 'connect' llegó a crear estos atributos)
        if hasattr(self, 'room_group_name') and hasattr(self, 'user') and self.user.is_authenticated:
            
            # Si todo existe, AHORA SÍ podemos enviar el aviso "user_left"
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left', 
                    'user_id': self.user.id
                }
            )
            
            # Y sacar al usuario del grupo
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # --- ¡¡¡MÉTODO 'receive' ACTUALIZADO!!! ---
    
    async def receive(self, text_data):
        
        # --- ¡PRINT 1: Muestra todo lo que llega! ---
        print(f"\n[CONSUMER LOG] Mensaje recibido: {text_data}")
        
        data = json.loads(text_data)
        message_type = data.get('message_type')
        
        # --- Ruta 1: Es un mensaje de Chat (TEXT o CODE) ---
        if message_type in ['TEXT', 'CODE']:
            print(f"[CONSUMER LOG] Detectado: Mensaje de Chat")
            content = data.get('content')
            language = data.get('language')
            if not content: return

            message = await self.create_message(message_type, content, language)
            message_data = await self.serialize_message(message)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message', # Llama a la función 'chat_message'
                    'message': message_data
                }
            )
            
        # --- Ruta 2: Es un evento de Gamificación ---
        elif message_type == 'GIVE_XP':
            print(f"[CONSUMER LOG] Detectado: GIVE_XP")
            # 1. Comprobar si el que envía es Profesor
            if not self.user.role == 'PROFESSOR':
                return # Ignora la petición si no es un profesor
                
            # 2. Obtener los datos
            target_user_id = data.get('target_user_id')
            points = data.get('points', 10) # 10 puntos por defecto
            
            if not target_user_id:
                return

            # 3. Otorgar los puntos en la BBDD
            target_user = await self.award_points(target_user_id, points)
            
            if target_user:
                # 4. Retransmitir la notificación a TODOS en la sala
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'xp_notification', # Llama a la función 'xp_notification'
                        'user_id': target_user.id,
                        'username': target_user.username,
                        'points': points,
                        'total_xp': target_user.experience_points
                    }
                )
        elif message_type == 'START_QUIZ':
            if not self.user.role == 'PROFESSOR':
                return
            quiz_id = data.get('quiz_id')
            if not quiz_id:
                return

            # 1. Obtener la pregunta (tu código existente)
            first_question = await self.get_quiz_question(quiz_id, 0)

            if first_question:

                # --- ¡AÑADE ESTA LÓGICA DE CACHÉ! ---
                # 2. Inicializar el marcador para esta pregunta
                cache_key = f"quiz_stats_{first_question['question_id']}"

                # Crea un diccionario de contadores para cada opción
                initial_stats = {
                    'choices': {choice['id']: 0 for choice in first_question['choices']},
                    'total': 0
                }
                # Guarda el marcador en el caché por 10 minutos
                cache.set(cache_key, initial_stats, timeout=600)
                # --- FIN DE LA LÓGICA DE CACHÉ ---

                # 3. Retransmitir la pregunta (tu código existente)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'quiz_question',
                        'question_data': first_question
                    }
                )
        # --- ¡NUEVA RUTA! 4: Alumno envía respuesta ---
        elif message_type == 'SUBMIT_ANSWER':
            question_id = data.get('question_id')
            choice_id = data.get('choice_id')

            # --- ¡INICIA LA NUEVA LÓGICA DE VOTACIÓN! ---
            cache_key = f"quiz_stats_{question_id}"
            stats = cache.get(cache_key)

            if stats and choice_id in stats['choices']:
                # (Opcional: añadir lógica para evitar que un usuario vote dos veces)

                # 1. Actualiza el contador
                stats['choices'][choice_id] += 1
                stats['total'] += 1

                # 2. Guarda el nuevo marcador en el caché
                cache.set(cache_key, stats, timeout=600)

                # 3. ¡Retransmite las nuevas estadísticas a TODOS!
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'quiz_stats_update', # ¡Nuevo handler!
                        'stats': stats,
                        'question_id': question_id
                    }
                )
            # --- FIN DE LA NUEVA LÓGICA ---
            else:
                # El quiz expiró del caché o la respuesta es inválida
                print(f"Stats no encontradas para {cache_key} o choice_id {choice_id} inválido")
        
        elif message_type == 'ANNOUNCE_PRESENCE':
            # --- ¡PRINT 2: El más importante! ---
            print(f"[CONSUMER LOG] Detectado: ANNOUNCE_PRESENCE para {self.user.username}")
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_joined', 
                    'user': {
                        'id': self.user.id,
                        'username': self.user.username
                    }
                }
            )
        else:
            # --- PRINT 3: Si el mensaje no es reconocido ---
            print(f"[CONSUMER LOG] ADVERTENCIA: Mensaje tipo '{message_type}' no reconocido.")

    async def quiz_question(self, event):
        # Envía la pregunta a todos los clientes (alumnos y tutor)
        await self.send(text_data=json.dumps({
            'type': 'quiz_question', # Tipo para que React sepa qué es
            'data': event['question_data']
        }))
        
    # --- ¡NUEVO HANDLER! (para el tipo 'quiz_answer_received') ---
    async def quiz_answer_received(self, event):
        # Envía la notificación de respuesta a todos
        await self.send(text_data=json.dumps({
            'type': 'quiz_answer_received',
            'data': {
                'user_id': event['user_id'],
                'username': event['username']
            }
        }))
    # --- ¡NUEVO! Handler para enviar notificaciones de XP ---
    async def xp_notification(self, event):
        # Simplemente reenvía el evento a todos los clientes
        # (El frontend decidirá si muestra o no una alerta)
        await self.send(text_data=json.dumps(event))

    # --- Handler de Chat (ACTUALIZADO) ---
    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'chat_message', # <-- Añadimos un tipo
            'message': message
        }))
    async def user_joined(self, event):
        """
        Envía un mensaje a este WebSocket cuando un *nuevo* usuario se une.
        """
        print(f"[CONSUMER LOG] Retransmitiendo 'user_joined' para: {event['user']['username']}")
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user': event['user'] # { 'id': ..., 'username': ... }
        }))

    async def user_left(self, event):
        """
        Envía un mensaje a este WebSocket cuando un usuario se va.
        """
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user_id': event['user_id']
        }))
    async def quiz_stats_update(self, event):
        """
        Envía las estadísticas actualizadas del quiz a todos en el grupo.
        """
        await self.send(text_data=json.dumps({
            'type': 'quiz_stats_update',
            'data': {
                'stats': event['stats'],
                'question_id': event['question_id']
            }
        }))
    # --- Funciones de Base de Datos (Seguras) ---
    @database_sync_to_async
    def get_quiz_question(self, quiz_id, question_index=0):
        try:
            # Obtenemos el quiz
            quiz = Quiz.objects.get(id=quiz_id)
            
            # Obtenemos la primera pregunta (o la que toque)
            question = quiz.questions.order_by('order').all()[question_index]
            
            # Obtenemos las opciones
            choices = list(question.choices.all().values('id', 'text'))
            
            # Preparamos el paquete de datos para enviar al frontend
            # ¡Importante! NO enviamos 'is_correct' al alumno
            return {
                'quiz_title': quiz.title,
                'question_id': question.id,
                'question_text': question.text,
                'choices': choices # Lista de {'id': 1, 'text': 'Opción A'}
            }
        except Exception as e:
            print(f"Error al obtener pregunta de quiz: {e}")
            return None
    @database_sync_to_async
    def get_lesson(self):
        try:
            return Lesson.objects.select_related(
                'chat_conversation', 
                'module__course__professor'
            ).get(id=self.lesson_id)
        except Lesson.DoesNotExist:
            return None

    @database_sync_to_async
    def get_or_create_conversation(self):
        if self.lesson.chat_conversation:
            return self.lesson.chat_conversation
        
        # Fallback si el signal no se ejecutó
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
        # (Pasamos el 'UserSerializer' al contexto para el 'sender' anidado)
        return MessageSerializer(message, context={'user_serializer': UserSerializer}).data
        
    # --- ¡NUEVA FUNCIÓN DE BBDD! ---
    @database_sync_to_async
    def award_points(self, user_id, points):
        try:
            user_to_award = User.objects.get(id=user_id)
            # Usamos F() para evitar 'race conditions' (conflictos)
            from django.db.models import F
            user_to_award.experience_points = F('experience_points') + points
            user_to_award.save(update_fields=['experience_points'])
            
            # Recargamos el objeto para obtener el nuevo valor total
            user_to_award.refresh_from_db()
            return user_to_award
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def check_enrollment(self):
        """
        Comprueba si el usuario está inscrito en el curso de esta lección.
        """
        return Enrollment.objects.filter(
            user=self.user,
            course=self.lesson.module.course
        ).exists()

class InboxConsumer(AsyncWebsocketConsumer):
    """
    Este Consumer maneja las conexiones de WebSocket para
    las conversaciones 1-a-1 y grupales del Inbox.
    """
    
    async def connect(self):
        # ... (tu método connect() está perfecto, no lo cambies) ...
        try:
            print("\n[CONSUMER LOG] connect() INICIADO.")
            self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
            self.user = self.scope['user']
            self.room_group_name = f'chat_conversation_{self.conversation_id}'
            print(f"[CONSUMER LOG] Usuario desde middleware: {self.user}")
        except Exception as e:
            print(f"[WS Inbox] ERROR: Faltan parámetros en el scope. {e}")
            await self.close()
            return
        if not self.user.is_authenticated:
            print("[WS Inbox] RECHAZADO: Usuario no autenticado.")
            await self.close()
            return
        is_participant = await self.check_participation()
        if not is_participant:
            print(f"[WS Inbox] RECHAZADO: Usuario {self.user} no es participante de la convo {self.conversation_id}")
            await self.close()
            return
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"[WS Inbox] ACEPTADO: Usuario {self.user} se unió a la convo {self.conversation_id}")

    async def disconnect(self, close_code):
        # ... (tu método disconnect() está perfecto, no lo cambies) ...
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # --- ¡MÉTODO 'RECEIVE' CORREGIDO! ---
    # Reemplaza 'receive_json' por este 'receive'
    async def receive(self, text_data):
        try:
            content = json.loads(text_data)
        except json.JSONDecodeError:
            print("[WS Inbox] ERROR: Recibido un JSON inválido")
            return

        event_type = content.get('type')
        
        if event_type == 'typing':
            # Si es un evento "typing", retransmitirlo
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_event', # Llama a typing_event()
                    'user': self.user.username,
                    'is_typing': content.get('is_typing', False)
                }
            )
    # --- FIN DE LA CORRECCIÓN ---

    # --- Enviar Mensajes (hacia el Frontend) ---
    
    # Este método es llamado por el 'group_send' desde la vista HTTP
    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'chat_message', # Identificador para React
            'message': message
        }))

    # Este método es llamado por el 'group_send' desde receive_json
    async def typing_event(self, event):
        # Retransmite el evento de typing al frontend
        await self.send(text_data=json.dumps({
            'type': 'typing_event', # Identificador para React
            'user': event['user'],
            'is_typing': event['is_typing']
        }))

    # --- Funciones de Base de Datos ---
    
    @database_sync_to_async
    def check_participation(self):
        # ... (tu método check_participation() está perfecto, no lo cambies) ...
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return conversation.participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist:
            return False