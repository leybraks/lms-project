import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
from channels.db import database_sync_to_async
from .models import Lesson, Message, Conversation, User, Enrollment, Quiz, Question, Choice, LiveCodeChallenge
from .serializers import MessageSerializer, UserSerializer, LiveCodeChallengeSerializer
from django.db.models import F
from django.core.cache import cache
from asgiref.sync import async_to_sync
import google.generativeai as genai
from django.conf import settings

# Configuración de Gemini
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    print(f"ADVERTENCIA (Consumer): No se pudo configurar la API de Gemini. {e}")

class ChatConsumer(AsyncWebsocketConsumer):
    """
    Maneja: Chat de Lección, Presencia, XP, Quiz en Vivo y Desafíos de Código.
    """
    
    async def connect(self):
        print("\n[CONSUMER LOG] connect() INICIADO.")
        self.lesson_id = self.scope['url_route']['kwargs']['lesson_id']
        self.user = self.scope['user']
        
        # Validaciones
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
            await self.close()
            return
        
        # Configuración de Sala
        self.conversation = await self.get_or_create_conversation()
        await self.add_user_to_conversation()
        self.room_group_name = f'chat_lesson_{self.lesson_id}'
        self.game_cache_key = f"live_game_{self.room_group_name}" 

        if self.user.role != 'PROFESSOR':
            self.connected_users_key = f"connected_users_{self.room_group_name}"
            cache.sadd(self.connected_users_key, self.user.id)

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        print(f"[CONSUMER LOG] ACEPTADO: {self.user.username}.")
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name') and hasattr(self, 'user') and self.user.is_authenticated:
            if self.user.role != 'PROFESSOR' and hasattr(self, 'connected_users_key'):
                cache.srem(self.connected_users_key, self.user.id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {'type': 'user_left', 'user_id': self.user.id}
            )
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """ Router Principal de Mensajes """
        data = json.loads(text_data)
        message_type = data.get('message_type')
        
        # 1. Chat
        if message_type in ['TEXT', 'CODE']:
            content = data.get('content')
            language = data.get('language')
            if content:
                message = await self.create_message(message_type, content, language)
                message_data = await self.serialize_message(message)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {'type': 'chat_message', 'message': message_data}
                )
            
        # 2. Dar XP
        elif message_type == 'GIVE_XP':
            if self.user.role == 'PROFESSOR':
                target_user = await self.award_points(data.get('target_user_id'), data.get('points', 10))
                if target_user:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'xp_notification',
                            'user_id': target_user.id,
                            'username': target_user.username,
                            'points': data.get('points', 10),
                            'total_xp': target_user.experience_points
                        }
                    )

        # 3. Quiz (Inicio y Respuesta)
        elif message_type == 'START_QUIZ':
            if self.user.role == 'PROFESSOR':
                await self.start_game(data.get('quiz_id'))

        elif message_type == 'SUBMIT_ANSWER':
            await self.record_answer(data.get('question_id'), data.get('choice_id'), self.user)
        
        # 4. Presencia
        elif message_type == 'ANNOUNCE_PRESENCE':
            await self.channel_layer.group_send(
                self.room_group_name,
                {'type': 'user_joined', 'user': {'id': self.user.id, 'username': self.user.username}}
            )

        # 5. Desafío de Código
        elif message_type == 'START_CODE_CHALLENGE':
            if self.user.role == 'PROFESSOR':
                await self.start_code_game(data.get('challenge_id'))

        elif message_type == 'SUBMIT_CODE_SOLUTION':
            await self.handle_code_submission(data.get('challenge_id'), data.get('code', ''), self.user)

        elif message_type == 'STOP_GAME':
            print(f"[CONSUMER LOG] Detectado: STOP_GAME solicitado por {self.user.username}")
            # Solo el profesor puede detener el juego a la fuerza
            if self.user.role == 'PROFESSOR':
                await self.end_game()
    # ====================================================================
    # --- HANDLERS (Retransmisión al Frontend) ---
    # ====================================================================

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def xp_notification(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_joined(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_left(self, event):
        await self.send(text_data=json.dumps(event))

    async def quiz_question(self, event):
        await self.send(text_data=json.dumps(event))

    async def quiz_ranking_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def quiz_final_results(self, event):
        await self.send(text_data=json.dumps(event))
    
    async def quiz_stats_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def quiz_get_ready(self, event):
        await self.send(text_data=json.dumps(event))

    async def code_challenge_question(self, event):
        await self.send(text_data=json.dumps(event))

    # ====================================================================
    # --- LÓGICA DEL QUIZ (Preguntas) ---
    # ====================================================================

    async def start_game(self, quiz_id):
        questions = await self.get_all_quiz_questions(quiz_id)
        if not questions: return
            
        game_state = {
            "quiz_id": quiz_id,
            "current_question_index": 0,
            "questions": questions,
            "ranking": {},
            "current_question_answers": {}
        }
        cache.set(self.game_cache_key, game_state, timeout=3600)
        await self.send_next_question()

    async def send_next_question(self):
        game_state = cache.get(self.game_cache_key)
        if not game_state: return

        index = game_state["current_question_index"]
        if index < len(game_state["questions"]):
            question = game_state["questions"][index]
            game_state["current_question_answers"] = {}
            cache.set(self.game_cache_key, game_state, timeout=3600)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'quiz_question',
                    'data': {
                        'question': question,
                        'question_number': index + 1,
                        'total_questions': len(game_state["questions"]),
                        'timer': 15
                    }
                }
            )
            await asyncio.sleep(15) 
            await self.end_question_round() 
        else:
            await self.end_game()

    async def record_answer(self, question_id, choice_id, user):
        game_state = cache.get(self.game_cache_key)
        if not game_state: return
        
        if str(user.id) in game_state["current_question_answers"]: return # Evitar doble respuesta

        index = game_state["current_question_index"]
        question = game_state["questions"][index]
        
        is_correct = await self.check_answer_correct(choice_id)
        
        # Feedback privado
        await self.send(text_data=json.dumps({
            'type': 'answer_result',
            'data': {'is_correct': is_correct, 'choice_id': choice_id}
        }))
        
        points = 0
        if is_correct:
            points = max(100, 1000 - (len(game_state["current_question_answers"]) * 50))
            
        user_id_str = str(user.id) # Usar string para claves JSON consistentes
        if user_id_str not in game_state["ranking"]:
            game_state["ranking"][user_id_str] = { "username": user.username, "score": 0 }
        
        if is_correct:
            game_state["ranking"][user_id_str]["score"] += points

        game_state["current_question_answers"][user_id_str] = True
        cache.set(self.game_cache_key, game_state, timeout=3600)

    async def end_question_round(self):
        game_state = cache.get(self.game_cache_key)
        if not game_state: return
        
        # Stats
        stats = {'total': len(game_state["current_question_answers"])}
        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'quiz_stats_update', 'data': {'stats': stats}}
        )
        await asyncio.sleep(5)

        # Ranking
        sorted_ranking = sorted(game_state["ranking"].values(), key=lambda x: x['score'], reverse=True)
        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'quiz_ranking_update', 'data': {'ranking': sorted_ranking, 'is_final': False}}
        )
        await asyncio.sleep(3)

        # Next
        game_state["current_question_index"] += 1
        cache.set(self.game_cache_key, game_state, timeout=3600)
        
        if game_state["current_question_index"] < len(game_state["questions"]):
            await self.channel_layer.group_send(self.room_group_name, {'type': 'quiz_get_ready'})
            await asyncio.sleep(3)
            await self.send_next_question()
        else:
            await self.end_game()

    async def end_game(self):
        game_state = cache.get(self.game_cache_key)
        if not game_state: return
        
        sorted_ranking = sorted(
            game_state["ranking"].values(), 
            key=lambda x: x['score'], 
            reverse=True
        )

        # --- CÁLCULO DE ESTADÍSTICAS PARA EL PROFESOR ---
        # En el desafío de código, quien está en el ranking es porque acertó.
        total_correct = len(sorted_ranking)
        # (Para saber los incorrectos necesitaríamos saber el total de conectados, 
        #  por ahora enviaremos solo los correctos y el total de participantes activos)
        
        stats = {
            "correct": total_correct,
            "top_3": sorted_ranking[:3] # Enviamos el podio
        }
        # -----------------------------------------------
        
        # Dar XP a los ganadores (Código existente...)
        for i, player in enumerate(sorted_ranking[:3]):
            player_id = next((uid for uid, data in game_state["ranking"].items() if data["username"] == player["username"]), None)
            if player_id:
                await self.award_points(int(player_id), [15, 10, 5][i])

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'quiz_final_results',
                'data': {
                    'ranking': sorted_ranking,
                    'stats': stats, # <--- ¡AÑADIMOS ESTO!
                    'is_final': True
                }
            }
        )
        
        cache.delete(self.game_cache_key)

    # ====================================================================
    # --- LÓGICA DEL CODE CHALLENGE (Pilar 3) ---
    # ====================================================================

    async def start_code_game(self, challenge_id):
        challenge_data = await self.get_live_code_challenge(challenge_id)
        if not challenge_data: return

        game_state = {
            "game_type": "code",
            "quiz_id": f"code_{challenge_id}",
            "current_question_index": 0,
            "questions": [challenge_data],
            "ranking": {},
            "current_question_answers": {}
        }
        
        self.game_cache_key = f"live_game_{self.room_group_name}" 
        cache.set(self.game_cache_key, game_state, timeout=3600)

        # Enviar el desafío a los alumnos
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'code_challenge_question',
                'data': {
                    'challenge': challenge_data, 
                    'timer': 300, 
                    'language': 'python'
                }
            }
        )
        
        # --- CORRECCIÓN CRÍTICA: USAR create_task ---
        # Esto lanza el temporizador en PARALELO y libera al servidor para escuchar el botón STOP
        asyncio.create_task(self.run_game_timer(300, challenge_id))


    async def run_game_timer(self, duration, challenge_id):
        """
        Cuenta el tiempo en segundo plano sin bloquear el WebSocket.
        """
        print(f"[TIMER] Iniciando cuenta atrás de {duration}s para desafío {challenge_id}")
        
        # Esperamos el tiempo definido (5 minutos)
        await asyncio.sleep(duration)
        
        # Al despertar, verificamos si el juego SIGUE siendo el mismo
        # (Por si el profesor ya lo detuvo manualmente antes)
        final_state = cache.get(self.game_cache_key)
        current_quiz_id = f"code_{challenge_id}"
        
        if final_state and final_state.get("quiz_id") == current_quiz_id:
            print(f"[TIMER] Tiempo agotado. Cerrando juego automáticamente.")
            await self.end_game()
        else:
            print("[TIMER] El temporizador expiró, pero el juego ya había terminado o cambiado.")

    
    async def handle_code_submission(self, challenge_id, user_code, user):
        print(f"[CONSUMER LOG] Evaluando entrega de {user.username}")
        
        game_state = cache.get(self.game_cache_key)
        # 1. Validar que el juego existe y es de código
        if not game_state or game_state.get("game_type") != "code":
            return 

        user_id_str = str(user.id)
        
        # 2. Validar "UNA SOLA OPORTUNIDAD"
        # Si el usuario ya está en la lista de respuestas, no le dejamos enviar más.
        if user_id_str in game_state["current_question_answers"]: 
            print(f"[CONSUMER LOG] {user.username} ya gastó su oportunidad.")
            # Opcional: Avisarle que ya no puede intentar
            return

        # 3. Evaluación IA
        try:
            ia_result = await self.run_ia_evaluation(challenge_id, user_code)
            is_correct = ia_result.get('is_correct', False)
        except Exception as e:
            print(f"[ERROR IA] {e}")
            is_correct = False 

        # 4. Enviar Feedback al Alumno ("Correcto" o "Incorrecto")
        await self.send(text_data=json.dumps({
            'type': 'answer_result',
            'data': {'is_correct': is_correct, 'choice_id': None}
        }))

        # 5. MARCAR COMO "YA RESPONDIÓ" (Sea correcto o incorrecto)
        # Guardamos True/False para saber cómo le fue, pero lo importante es que la clave user_id ya existe.
        game_state["current_question_answers"][user_id_str] = is_correct
        
        # Si es correcto, calculamos puntos y ranking
        if is_correct:
            points = max(100, 1000 - (len(game_state["current_question_answers"]) * 50))
            
            if user_id_str not in game_state["ranking"]:
                game_state["ranking"][user_id_str] = { "username": user.username, "score": 0 }
            
            game_state["ranking"][user_id_str]["score"] += points
            
            # Actualizamos ranking visual para todos
            sorted_ranking = sorted(game_state["ranking"].values(), key=lambda x: x['score'], reverse=True)
            await self.channel_layer.group_send(
                self.room_group_name,
                {'type': 'quiz_ranking_update', 'data': {'ranking': sorted_ranking, 'is_final': False}}
            )

        # Guardamos el estado actualizado en Redis
        cache.set(self.game_cache_key, game_state, timeout=3600)

        # ==========================================================
        # 6. LÓGICA DE CIERRE AUTOMÁTICO (TODOS TERMINARON)
        # ==========================================================
        
        # A. Contamos conectados (usando el Set de Redis que creamos antes)
        connected_key = f"connected_users_{self.room_group_name}"
        connected_count = cache.scard(connected_key) or 1
        
        # B. Contamos cuántos han "gastado su turno" (correctos + incorrectos)
        attempts_count = len(game_state["current_question_answers"])
        
        print(f"[AUTO-END CHECK] Intentos: {attempts_count} / Conectados: {connected_count}")

        # C. Si Intentos >= Conectados -> CERRAMOS
        if attempts_count >= connected_count:
             print("[AUTO-END] Todos los alumnos han participado. Cerrando juego...")
             # Esperamos 3 segundos para que el último alumno vea si acertó o falló
             await asyncio.sleep(3) 
             await self.end_game()


    @database_sync_to_async
    def run_ia_evaluation(self, challenge_id, user_code):
        try:
            print(f"[IA LOG] Evaluando desafío {challenge_id}...")
            challenge = LiveCodeChallenge.objects.get(id=challenge_id)
            
            prompt = f"""
            Evalúa este código Python.
            PROBLEMA: {challenge.description}
            CÓDIGO ALUMNO:
            {user_code}
            SOLUCIÓN REFERENCIA:
            {challenge.solution}
            
            IMPORTANTE: Responde SOLO un JSON válido. Estructura: {{ "is_correct": boolean }}
            Si el código del alumno funciona y resuelve el problema, es true. Si tiene errores de sintaxis o lógica, false.
            """
            
            # USAMOS EL MODELO CORRECTO (1.5-flash)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            # Limpieza agresiva del JSON (Gemini a veces mete comillas extra)
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text.replace("```json", "").replace("```", "")
            elif clean_text.startswith("```"):
                clean_text = clean_text.replace("```", "")
            
            print(f"[IA LOG] Respuesta cruda Gemini: {clean_text}")
            return json.loads(clean_text)

        except Exception as e:
            print(f"!!! ERROR CRÍTICO EN IA: {e}")
            # Devuelve False en lugar de romper, para que el flujo continúe
            return {"is_correct": False}



    @database_sync_to_async
    def run_ia_evaluation(self, challenge_id, user_code):
        try:
            challenge = LiveCodeChallenge.objects.get(id=challenge_id)
            prompt = f"""
            Eres un tutor de programación experto. Evalúa este código.
            PROBLEMA: {challenge.description}
            SOLUCIÓN DEL ALUMNO: ```python {user_code} ```
            SOLUCIÓN ÓPTIMA: ```python {challenge.solution} ```
            Responde SOLO con un JSON: {{ "is_correct": [true o false] }}
            """
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            clean_text = response.text.strip().replace("```json", "").replace("```", "")
            return json.loads(clean_text)
        except Exception as e:
            print(f"ERROR IA: {e}")
            return {"is_correct": False}

    async def update_code_ranking(self, user, challenge_id):
        game_state = cache.get(self.game_cache_key)
        if not game_state: return
        
        user_id_str = str(user.id)
        if user_id_str in game_state["current_question_answers"]: return

        points = max(100, 1000 - (len(game_state["current_question_answers"]) * 50))
        
        if user_id_str not in game_state["ranking"]:
            game_state["ranking"][user_id_str] = { "username": user.username, "score": 0 }
        
        game_state["ranking"][user_id_str]["score"] += points
        game_state["current_question_answers"][user_id_str] = True
        
        cache.set(self.game_cache_key, game_state, timeout=3600)
        
        sorted_ranking = sorted(game_state["ranking"].values(), key=lambda x: x['score'], reverse=True)
        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'quiz_ranking_update', 'data': {'ranking': sorted_ranking, 'is_final': False}}
        )

    # ====================================================================
    # --- HELPERS DB ---
    # ====================================================================

    @database_sync_to_async
    def get_lesson(self):
        try:
            return Lesson.objects.select_related('chat_conversation', 'module__course__professor').get(id=self.lesson_id)
        except Lesson.DoesNotExist: return None

    @database_sync_to_async
    def check_enrollment(self):
        return Enrollment.objects.filter(user=self.user, course=self.lesson.module.course).exists()

    @database_sync_to_async
    def get_or_create_conversation(self):
        if self.lesson.chat_conversation: return self.lesson.chat_conversation
        group_chat = Conversation.objects.create(course=self.lesson.module.course, is_group=True, name=f"Chat: {self.lesson.title}")
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
        return Message.objects.create(conversation=self.conversation, sender=self.user, message_type=msg_type, content=content, language=lang)

    @database_sync_to_async
    def serialize_message(self, message):
        return MessageSerializer(message, context={'user_serializer': UserSerializer}).data
        
    @database_sync_to_async
    def award_points(self, user_id, points):
        try:
            u = User.objects.get(id=user_id)
            u.experience_points = F('experience_points') + points
            u.save(update_fields=['experience_points'])
            u.refresh_from_db()
            return u
        except User.DoesNotExist: return None

    @database_sync_to_async
    def get_all_quiz_questions(self, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id, quiz_type='LIVE')
            q_data = []
            for q in quiz.questions.order_by('order').prefetch_related('choices'):
                q_data.append({
                    'id': q.id, 'text': q.text,
                    'choices': list(q.choices.all().values('id', 'text'))
                })
            return q_data
        except: return None

    @database_sync_to_async
    def check_answer_correct(self, choice_id):
        try: return Choice.objects.get(id=int(choice_id)).is_correct
        except: return False

    @database_sync_to_async
    def get_live_code_challenge(self, challenge_id):
        try:
            c = LiveCodeChallenge.objects.get(id=challenge_id)
            data = LiveCodeChallengeSerializer(c).data
            if 'solution' in data: del data['solution'] # Seguridad
            return data
        except: return None


class InboxConsumer(AsyncWebsocketConsumer):
    """
    Maneja el chat privado/Inbox.
    """
    async def connect(self):
        try:
            self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
            self.user = self.scope['user']
            self.room_group_name = f'chat_conversation_{self.conversation_id}'
        except:
            await self.close()
            return

        if not self.user.is_authenticated:
            await self.close()
            return

        if not await self.check_participation():
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            content = json.loads(text_data)
            if content.get('type') == 'typing':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {'type': 'typing_event', 'user': self.user.username, 'is_typing': content.get('is_typing', False)}
                )
        except json.JSONDecodeError: pass

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'type': 'chat_message', 'message': event['message']}))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def check_participation(self):
        try:
            return Conversation.objects.get(id=self.conversation_id).participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist: return False