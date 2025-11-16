# backend/api/consumers.py
import json # <-- ¡Importación que faltaba!
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
from channels.db import database_sync_to_async
from .models import Lesson, Message, Conversation, User, Enrollment,Quiz, Question, Choice,LiveCodeChallenge,CodeChallenge # <-- ¡Importa User!
from .serializers import MessageSerializer, UserSerializer,LiveCodeChallengeSerializer
from django.db.models import F
from django.core.cache import cache
from asgiref.sync import async_to_sync
import google.generativeai as genai
from django.conf import settings
# (User = get_user_model() no es necesario si lo importamos directamente)
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    print(f"ADVERTENCIA (Consumer): No se pudo configurar la API de Gemini. {e}")

class ChatConsumer(AsyncWebsocketConsumer):
    """
    Este Consumer maneja todo lo que pasa en la lección en vivo:
    1. Chat de la Lección
    2. Sistema de Presencia (Conectado/Desconectado)
    3. Gamificación Pilar 1 (Dar XP)
    4. Gamificación Pilar 2 (Juego de Quiz en Vivo)
    """
    
    async def connect(self):
        # --- 1. CONFIGURACIÓN INICIAL ---
        print("\n[CONSUMER LOG] connect() INICIADO.")
        
        self.lesson_id = self.scope['url_route']['kwargs']['lesson_id']
        self.user = self.scope['user']
        
        print(f"[CONSUMER LOG] Usuario desde middleware: {self.user}")

        # --- 2. VALIDACIÓN (GUARDIA) ---
        if not self.user.is_authenticated:
            print("[CONSUMER LOG] RECHAZADO: Usuario no autenticado.")
            await self.close()
            return

        self.lesson = await self.get_lesson()
        if not self.lesson:
            print("[CONSUMER LOG] RECHAZADO: Lección no encontrada.")
            await self.close()
            return

        is_enrolled = await self.check_enrollment()
        is_professor = self.user == self.lesson.module.course.professor
        
        if not (is_enrolled or is_professor):
            print(f"[CONSUMER LOG] RECHAZADO: Usuario '{self.user}' no inscrito ni es profesor.")
            await self.close()
            return
        
        # --- 3. CONFIGURACIÓN EXITOSA ---
        self.conversation = await self.get_or_create_conversation()
        await self.add_user_to_conversation()
        self.room_group_name = f'chat_lesson_{self.lesson_id}'
        self.game_cache_key = f"live_quiz_{self.room_group_name}" # Clave para el estado del juego
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        print(f"[CONSUMER LOG] ACEPTADO: Conexión aceptada para {self.user.username}.")
        await self.accept()
        

    async def disconnect(self, close_code):
        # Comprueba si la conexión tuvo éxito antes de hacer nada
        if hasattr(self, 'room_group_name') and hasattr(self, 'user') and self.user.is_authenticated:
            
            # Avisa a todos que el usuario se fue
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left', 
                    'user_id': self.user.id
                }
            )
            
            # Saca al usuario del grupo
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """
        El "router" principal. Recibe todos los mensajes del frontend.
        """
        print(f"\n[CONSUMER LOG] Mensaje recibido: {text_data}")
        
        data = json.loads(text_data)
        message_type = data.get('message_type')
        
        # --- Ruta 1: Mensaje de Chat (TEXT o CODE) ---
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
                    'type': 'chat_message',
                    'message': message_data
                }
            )
            
        # --- Ruta 2: Dar XP (Pilar 1) ---
        elif message_type == 'GIVE_XP':
            print(f"[CONSUMER LOG] Detectado: GIVE_XP")
            if not self.user.role == 'PROFESSOR': return
            
            target_user_id = data.get('target_user_id')
            points = data.get('points', 10)
            if not target_user_id: return

            target_user = await self.award_points(target_user_id, points)
            
            if target_user:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'xp_notification',
                        'user_id': target_user.id,
                        'username': target_user.username,
                        'points': points,
                        'total_xp': target_user.experience_points
                    }
                )

        # --- Ruta 3: Iniciar Quiz (Pilar 2) ---
        elif message_type == 'START_QUIZ':
            print(f"[CONSUMER LOG] Detectado: START_QUIZ")
            if not self.user.role == 'PROFESSOR': return
            
            quiz_id = data.get('quiz_id')
            if not quiz_id: return
            await self.start_game(quiz_id)

        # --- Ruta 4: Responder Quiz (Pilar 2) ---
        elif message_type == 'SUBMIT_ANSWER':
            print(f"[CONSUMER LOG] Detectado: SUBMIT_ANSWER")
            question_id = data.get('question_id')
            choice_id = data.get('choice_id')
            await self.record_answer(question_id, choice_id, self.user)
        
        # --- Ruta 5: Anunciar Presencia (Sistema de Conexión) ---
        elif message_type == 'ANNOUNCE_PRESENCE':
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
        elif message_type == 'START_CODE_CHALLENGE':
            print(f"[CONSUMER LOG] Detectado: START_CODE_CHALLENGE")
            if not self.user.role == 'PROFESSOR': return
            
            challenge_id = data.get('challenge_id')
            if not challenge_id: return
            
            # Llama a una nueva función para iniciar el desafío de código
            await self.start_code_game(challenge_id)
        elif message_type == 'SUBMIT_CODE_SOLUTION':
            print(f"[CONSUMER LOG] Detectado: SUBMIT_CODE_SOLUTION")
            challenge_id = data.get('challenge_id')
            user_code = data.get('code', '')
            
            # Llama a un nuevo helper ASÍNCRONO
            await self.handle_code_submission(challenge_id, user_code, self.user)
        # --- FIN DEL BLOQUE NUEVO ---
        else:
            print(f"[CONSUMER LOG] ADVERTENCIA: Mensaje tipo '{message_type}' no reconocido.")

    # ====================================================================
    # --- HANDLERS (Envían mensajes AL FRONTEND) ---
    # ====================================================================

    async def chat_message(self, event):
        """ Handler para: 'chat_message' """
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def xp_notification(self, event):
        """ Handler para: 'xp_notification' """
        await self.send(text_data=json.dumps(event))

    async def user_joined(self, event):
        """ Handler para: 'user_joined' """
        print(f"[CONSUMER LOG] Retransmitiendo 'user_joined' para: {event['user']['username']}")
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user': event['user']
        }))

    async def user_left(self, event):
        """ Handler para: 'user_left' """
        print(f"[CONSUMER LOG] Retransmitiendo 'user_left' para: {event['user_id']}")
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user_id': event['user_id']
        }))

    async def quiz_question(self, event):
        """ Handler para: 'quiz_question' """
        print(f"[CONSUMER LOG] Retransmitiendo 'quiz_question'")
        await self.send(text_data=json.dumps({
            'type': 'quiz_question',
            'data': event['data']
        }))

    async def quiz_ranking_update(self, event):
        """ Handler para: 'quiz_ranking_update' """
        print(f"[CONSUMER LOG] Retransmitiendo 'quiz_ranking_update'")
        await self.send(text_data=json.dumps({
            'type': 'quiz_ranking_update',
            'data': event['data']
        }))

    async def quiz_final_results(self, event):
        """ Handler para: 'quiz_final_results' """
        print(f"[CONSUMSito! ER LOG] Retransmitiendo 'quiz_final_results'")
        await self.send(text_data=json.dumps({
            'type': 'quiz_final_results',
            'data': event['data']
        }))

    # ====================================================================
    # --- LÓGICA DEL JUEGO DE QUIZ (Pilar 2) ---
    # ====================================================================

    async def start_game(self, quiz_id):
        """ Carga el quiz y prepara el estado del juego en el caché. """
        questions = await self.get_all_quiz_questions(quiz_id)
        if not questions:
            print(f"Error: No se encontraron preguntas para el quiz {quiz_id}")
            return
            
        game_state = {
            "quiz_id": quiz_id,
            "current_question_index": 0,
            "questions": questions,
            "ranking": {},
            "current_question_answers": {}
        }
        
        cache.set(self.game_cache_key, game_state, timeout=3600)
        print(f"Juego {quiz_id} iniciado y guardado en caché.")
        await self.send_next_question()

    async def send_next_question(self):
        """
        Envía la siguiente pregunta del estado del juego o termina el juego.
        """
        game_state = cache.get(self.game_cache_key)
        if not game_state: return

        index = game_state["current_question_index"]
        
        if index < len(game_state["questions"]):
            question = game_state["questions"][index]
            
            # Resetea las respuestas de la pregunta actual
            game_state["current_question_answers"] = {}
            cache.set(self.game_cache_key, game_state, timeout=3600)

            print(f"Enviando pregunta {index + 1}")
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'quiz_question',
                    'data': {
                        'question': question,
                        'question_number': index + 1,
                        'total_questions': len(game_state["questions"]),
                        'timer': 15 # ¡Temporizador de 15 segundos!
                    }
                }
            )
            
            # ¡Inicia el temporizador!
            # Después de 15s, llama a 'end_question_round'
            await asyncio.sleep(15) 
            
            # --- ¡CAMBIO IMPORTANTE! ---
            # 'show_ranking' se ha renombrado a 'end_question_round'
            await self.end_question_round() 
            
        else:
            # ¡Se acabaron las preguntas!
            await self.end_game()

    async def record_answer(self, question_id, choice_id, user):
        """
        Registra la respuesta de un alumno Y le da feedback inmediato.
        """
        game_state = cache.get(self.game_cache_key)
        if not game_state: return
        
        if user.id in game_state["current_question_answers"]:
            print(f"Usuario {user.username} ya respondió.")
            return

        index = game_state["current_question_index"]
        question = game_state["questions"][index]
        
        if question['id'] != question_id:
            print("Respuesta de una pregunta anterior. Ignorando.")
            return
            
        is_correct = await self.check_answer_correct(choice_id)
        
        # --- ¡NUEVO! Feedback Inmediato ---
        # Envía un mensaje PRIVADO solo a este usuario
        await self.send(text_data=json.dumps({
            'type': 'answer_result',
            'data': {
                'is_correct': is_correct,
                'choice_id': choice_id
            }
        }))
        # --- FIN DEL FEEDBACK ---
        
        points = 0
        if is_correct:
            points = max(100, 1000 - (len(game_state["current_question_answers"]) * 50))
            
        if user.id not in game_state["ranking"]:
            game_state["ranking"][user.id] = { "username": user.username, "score": 0 }
        
        game_state["ranking"][user.id]["score"] += points
        game_state["current_question_answers"][user.id] = True
        
        cache.set(self.game_cache_key, game_state, timeout=3600)

    async def end_question_round(self):
        """
        Se ejecuta cuando el temporizador de 15s se acaba.
        Controla el ritmo: Estadísticas -> Ranking -> Siguiente Pregunta.
        """
        game_state = cache.get(self.game_cache_key)
        if not game_state: return
        
        print(f"Ronda {game_state['current_question_index'] + 1} terminada.")

        # --- MEJORA 3: Enviar Gráfico de Barras a TODOS ---
        # (Esto arregla tu bug)
        stats = {
            'choices': { choice['id']: 0 for choice in game_state["questions"][game_state["current_question_index"]]["choices"] },
            'total': len(game_state["current_question_answers"])
        }
        # (Lógica para contar votos - ¡necesitamos mejorar 'record_answer' para esto!)
        # (Por ahora, solo enviamos el total)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'quiz_stats_update',
                'data': {
                    'stats': stats, # (Datos del gráfico de barras)
                    'question_id': game_state["questions"][game_state["current_question_index"]]['id']
                }
            }
        )
        await asyncio.sleep(5) # 5 segundos para ver el gráfico

        # --- MEJORA 2: Enviar Ranking a TODOS ---
        sorted_ranking = sorted(game_state["ranking"].values(), key=lambda x: x['score'], reverse=True)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'quiz_ranking_update',
                'data': { 'ranking': sorted_ranking, 'is_final': False }
            }
        )
        await asyncio.sleep(3) # 3 segundos para ver el ranking

        # --- MEJORA 2: Enviar "Prepárate" ---
        game_state["current_question_index"] += 1
        cache.set(self.game_cache_key, game_state, timeout=3600)
        
        if game_state["current_question_index"] < len(game_state["questions"]):
            await self.channel_layer.group_send(
                self.room_group_name,
                { 'type': 'quiz_get_ready' }
            )
            await asyncio.sleep(3) # 3 segundos para "prepárate"
            await self.send_next_question() # Llamar a la siguiente
        else:
            await self.end_game() # Se acabaron las preguntas

    async def end_game(self):
        """ Termina el juego, otorga puntos de mascota y muestra el ranking final. """
        game_state = cache.get(self.game_cache_key)
        if not game_state: return
        
        sorted_ranking = sorted(
            game_state["ranking"].values(), 
            key=lambda x: x['score'], 
            reverse=True
        )
        
        prizes = [15, 10, 5]
        for i, player in enumerate(sorted_ranking[:3]):
            player_id = next((uid for uid, data in game_state["ranking"].items() if data["username"] == player["username"]), None)
            if player_id:
                print(f"Dando {prizes[i]} XP a {player['username']}")
                await self.award_points(player_id, prizes[i])

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'quiz_final_results',
                'data': {
                    'ranking': sorted_ranking,
                    'is_final': True
                }
            }
        )
        
        cache.delete(self.game_cache_key)
    async def code_challenge_question(self, event):
        """
        Handler: Envía el desafío de código a todos los alumnos.
        """
        print(f"[CONSUMER LOG] Retransmitiendo 'code_challenge_question'")
        await self.send(text_data=json.dumps({
            'type': 'code_challenge_question',
            'data': event['data'] # { challenge: ..., timer: 300 }
        }))

    async def start_code_game(self, challenge_id):
        """
        Carga el desafío, lo envía a todos
        E INICIA EL TEMPORIZADOR DE 5 MINUTOS.
        """
        challenge_data = await self.get_live_code_challenge(challenge_id)
        if not challenge_data:
            print(f"Error: No se encontró el LiveCodeChallenge {challenge_id}")
            return

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

        print(f"Enviando Desafío de Código {challenge_id}")
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'code_challenge_question',
                'data': {
                    'challenge': challenge_data,
                    'timer': 300, # 300 segundos (5 minutos)
                    'language': 'python'
                }
            }
        )

        # --- ¡TEMPORIZADOR RESTAURADO! ---
        await asyncio.sleep(300) # Espera 5 minutos

        # Comprueba si el juego sigue activo antes de terminarlo
        final_game_state = cache.get(self.game_cache_key)
        if final_game_state and final_game_state.get("game_type") == "code":
            print(f"Temporizador del desafío de código {challenge_id} terminado.")
            await self.end_game() # Llama a la función que muestra los resultados finales

    @database_sync_to_async
    def get_live_code_challenge(self, challenge_id):
        """
        Obtiene un LiveCodeChallenge y lo serializa.
        No envía la 'solución'.
        """
        try:
            challenge = LiveCodeChallenge.objects.get(id=challenge_id)
            # Usamos el serializer para controlar qué datos enviamos
            # (¡Importante! El serializer NO debe enviar el campo 'solution')
            serializer = LiveCodeChallengeSerializer(challenge)
            return serializer.data
        except Exception as e:
            print(f"Error al obtener LiveCodeChallenge: {e}")
            return None
    # ====================================================================
    # --- FUNCIONES DE BASE DE DATOS (Seguras) ---
    # ====================================================================

    @database_sync_to_async
    def get_all_quiz_questions(self, quiz_id):
        """ Obtiene un Quiz y TODAS sus preguntas y opciones. """
        try:
            quiz = Quiz.objects.get(id=quiz_id, quiz_type='LIVE')
            questions_data = []
            for question in quiz.questions.order_by('order').prefetch_related('choices'):
                questions_data.append({
                    'id': question.id,
                    'text': question.text,
                    'choices': list(question.choices.all().values('id', 'text'))
                })
            return questions_data
        except Exception as e:
            print(f"Error al obtener todas las preguntas del quiz: {e}")
            return None

    @database_sync_to_async
    def check_answer_correct(self, choice_id):
        """ Verifica si una 'Choice' (Opción) es correcta. """
        try:
            # Asegurarse de que el choice_id sea un entero
            return Choice.objects.get(id=int(choice_id)).is_correct
        except (Choice.DoesNotExist, ValueError, TypeError):
            return False

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
        return MessageSerializer(message, context={'user_serializer': UserSerializer}).data
        
    @database_sync_to_async
    def award_points(self, user_id, points):
        try:
            user_to_award = User.objects.get(id=user_id)
            user_to_award.experience_points = F('experience_points') + points
            user_to_award.save(update_fields=['experience_points'])
            
            user_to_award.refresh_from_db()
            return user_to_award
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def check_enrollment(self):
        return Enrollment.objects.filter(
            user=self.user,
            course=self.lesson.module.course
        ).exists()
    async def answer_result(self, event):
        """ Handler para: 'answer_result' (PRIVADO) """
        # Este tipo de evento se envía con 'self.send'
        # Así que no necesitamos un handler, ¡se envía directo!
        pass # (Dejamos el comentario como referencia)

    async def quiz_get_ready(self, event):
        """ Handler para: 'quiz_get_ready' """
        await self.send(text_data=json.dumps({
            'type': 'quiz_get_ready'
        }))
    
    @database_sync_to_async
    def evaluate_code_solution(self, challenge_id, user_code, user):
        """
        Llama a la IA de Gemini para evaluar el código
        Y LUEGO actualiza el ranking del juego.
        """
        try:
            challenge = LiveCodeChallenge.objects.get(id=challenge_id)
            
            # 1. Llama a la IA (igual que en views.py)
            prompt = f"""
            Eres un tutor de programación experto. Evalúa este código.
            PROBLEMA: {challenge.description}
            SOLUCIÓN DEL ALUMNO:
            ```python
            {user_code}
            ```
            SOLUCIÓN ÓPTIMA:
            ```python
            {challenge.solution}
            ```
            Responde SOLO con un JSON: {{ "is_correct": [true o false] }}
            """
            
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            json_response = response.text.strip().replace("```json", "").replace("```", "")
            ia_data = json.loads(json_response)
            
            is_correct = ia_data.get('is_correct', False)
            
            # 2. Envía el feedback PRIVADO al alumno
            # (Usamos 'async_to_sync' porque estamos en una función de BBDD)
            async_to_sync(self.send)(text_data=json.dumps({
                'type': 'answer_result',
                'data': { 'is_correct': is_correct, 'choice_id': None }
            }))

            # 3. Si es correcto, actualiza el ranking
            if is_correct:
                game_state = cache.get(self.game_cache_key)
                if not game_state: return

                # Evita respuestas duplicadas
                if user.id in game_state["current_question_answers"]:
                    return
                
                # Calcula puntos por velocidad
                points = max(100, 1000 - (len(game_state["current_question_answers"]) * 50))
                
                if user.id not in game_state["ranking"]:
                    game_state["ranking"][user.id] = { "username": user.username, "score": 0 }
                
                game_state["ranking"][user.id]["score"] += points
                game_state["current_question_answers"][user.id] = True
                
                cache.set(self.game_cache_key, game_state, timeout=3600)
                
                # 4. Retransmite el ranking a TODOS
                sorted_ranking = sorted(game_state["ranking"].values(), key=lambda x: x['score'], reverse=True)
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'quiz_ranking_update',
                        'data': { 'ranking': sorted_ranking, 'is_final': False }
                    }
                )

        except Exception as e:
            print(f"ERROR EN LA EVALUACIÓN DE IA: {e}")
            # Envía un error de vuelta al alumno
            async_to_sync(self.send)(text_data=json.dumps({
                'type': 'answer_result',
                'data': { 'is_correct': False }
            }))
    async def handle_code_submission(self, challenge_id, user_code, user):
        """
        Evalúa el código y actualiza el ranking.
        ¡YA NO TERMINA EL JUEGO!
        """
        try:
            # Revisa el estado del juego ANTES de llamar a la IA
            game_state = cache.get(self.game_cache_key)
            if not game_state or game_state.get("game_type") != "code":
                return # El juego ya terminó

            if user.id in game_state["current_question_answers"]:
                return # El usuario ya envió una respuesta correcta

            # Llama a la IA
            print(f"[CONSUMER] Enviando código de {user.username} a la IA...")
            ia_result = await self.run_ia_evaluation(challenge_id, user_code)
            is_correct = ia_result.get('is_correct', False)

            # Envía el feedback PRIVADO ("¡Correcto!" o "¡Incorrecto!")
            await self.send(text_data=json.dumps({
                'type': 'answer_result',
                'data': { 'is_correct': is_correct, 'choice_id': None }
            }))

            print(f"[CONSUMER] Feedback enviado a {user.username}: {'Correcto' if is_correct else 'Incorrecto'}")

            # Si es correcto, actualiza el ranking
            if is_correct:
                # 'update_code_ranking' es async y envía la actualización del ranking
                await self.update_code_ranking(user, challenge_id)

            # ¡YA NO HAY LÓGICA DE 'is_first_winner'!

        except Exception as e:
            print(f"ERROR GRANDE en handle_code_submission: {e}")
            await self.send(text_data=json.dumps({
                'type': 'answer_result',
                'data': { 'is_correct': False }
            }))
    # 2. La Tarea SÍNCRONA (La "IA" - Marcada como @database_sync_to_async)
    @database_sync_to_async
    def run_ia_evaluation(self, challenge_id, user_code):
        """
        Paso 2 (Sync): Ejecuta la IA y la BBDD en un hilo síncrono.
        """
        try:
            # (Asegúrate de que el modelo 'LiveCodeChallenge' esté importado)
            challenge = LiveCodeChallenge.objects.get(id=challenge_id)
            
            prompt = f"""
            Eres un tutor de programación experto. Evalúa este código.
            PROBLEMA: {challenge.description}
            SOLUCIÓN DEL ALUMNO:
            ```python
            {user_code}
            ```
            SOLUCIÓN ÓPTIMA:
            ```python
            {challenge.solution}
            ```
            Responde SOLO con un JSON: {{ "is_correct": [true o false] }}
            """
            
            # (Asegúrate de que 'genai' esté importado)
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            json_response = response.text.strip().replace("```json", "").replace("```", "")
            ia_data = json.loads(json_response)
            
            return ia_data # Devuelve el resultado al helper async
            
        except Exception as e:
            print(f"ERROR DENTRO DE run_ia_evaluation: {e}")
            return { "is_correct": False } # Devuelve un error

    # 3. El Helper ASÍNCRONO (El "Ranking")
    async def update_code_ranking(self, user, challenge_id):
        """
        Paso 3 (Async): Actualiza el caché (que es async)
        """
        game_state = cache.get(self.game_cache_key)
        if not game_state: return
        if user.id in game_state["current_question_answers"]: return

        print(f"[CONSUMER] Actualizando ranking para {user.username}")
        
        points = max(100, 1000 - (len(game_state["current_question_answers"]) * 50))
        
        if user.id not in game_state["ranking"]:
            game_state["ranking"][user.id] = { "username": user.username, "score": 0 }
        
        game_state["ranking"][user.id]["score"] += points
        game_state["current_question_answers"][user.id] = True
        
        cache.set(self.game_cache_key, game_state, timeout=3600)
        
        sorted_ranking = sorted(game_state["ranking"].values(), key=lambda x: x['score'], reverse=True)
        
        # Retransmite el ranking a TODOS
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'quiz_ranking_update',
                'data': { 'ranking': sorted_ranking, 'is_final': False }
            }
        )
    async def code_challenge_question(self, event):
        """
        Handler: Envía el desafío de código a todos los alumnos.
        (Es llamado por 'start_code_game')
        """
        print(f"[CONSUMER LOG] Retransmitiendo 'code_challenge_question'")
        await self.send(text_data=json.dumps({
            'type': 'code_challenge_question',
            'data': event['data'] # { challenge: ..., timer: 300 }
        }))
    async def start_code_game(self, challenge_id):
        """
        (Llamado por 'receive')
        Carga el desafío de código, lo envía a todos
        E INICIA EL TEMPORIZADOR.
        """
        challenge_data = await self.get_live_code_challenge(challenge_id)
        if not challenge_data:
            print(f"Error: No se encontró el LiveCodeChallenge {challenge_id}")
            return
            
        # Prepara el "estado de juego" (similar al quiz)
        game_state = {
            "game_type": "code", # ¡Importante!
            "quiz_id": f"code_{challenge_id}", # ID de juego único
            "current_question_index": 0,
            "questions": [challenge_data], # Solo 1 desafío
            "ranking": {}, # Ranking vacío
            "current_question_answers": {} # Quién ha respondido
        }
        
        # --- ¡LÍNEA CORREGIDA! ---
        # (Usa la variable 'self.room_group_name' que ya existe)
        self.game_cache_key = f"live_game_{self.room_group_name}" 
        cache.set(self.game_cache_key, game_state, timeout=3600) # 1 hora
        # --- FIN DE LA CORRECCIÓN ---
        
        print(f"Enviando Desafío de Código {challenge_id}")
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'code_challenge_question',
                'data': {
                    'challenge': challenge_data,
                    'timer': 300, # 300 segundos (5 minutos)
                    'language': 'python'
                }
            }
        )
        
        # --- ¡LÓGICA DEL TEMPORIZADOR! ---
        await asyncio.sleep(300) # Espera 5 minutos
        
        print(f"Temporizador del desafío de código {challenge_id} terminado.")
        await self.end_game()

    @database_sync_to_async
    def get_live_code_challenge(self, challenge_id):
        """
        Obtiene un LiveCodeChallenge y lo serializa (sin la solución).
        """
        try:
            challenge = LiveCodeChallenge.objects.get(id=challenge_id)
            # ¡Editamos el serializer para que NO envíe la solución!
            serializer = LiveCodeChallengeSerializer(challenge)
            data = serializer.data
            
            # ¡Seguridad! No enviar la solución al frontend
            if 'solution' in data:
                del data['solution'] 
                
            return data
        except Exception as e:
            print(f"Error al obtener LiveCodeChallenge: {e}")
            return None
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