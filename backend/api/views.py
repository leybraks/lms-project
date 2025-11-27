# backend/api/views.py

from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .permissions import IsEnrolledPermission, IsEnrolledOrProfessor
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.db.models import Max, Count
from datetime import datetime, timezone as dt_timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone # <-- ¡ASEGÚRATE DE IMPORTAR TIMEZONE!
from django.db.models import OuterRef, Subquery, Exists, Value
from django.db.models.functions import Coalesce
from django.core.exceptions import PermissionDenied
import requests
from django.db import transaction
from rest_framework.pagination import PageNumberPagination
import google.generativeai as genai
from django.conf import settings
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    print(f"ADVERTENCIA: No se pudo configurar la API de Gemini. {e}")
# Imports de Modelos y Serializers de tu app
from .models import Course, Enrollment, Lesson, LessonCompletion, Assignment, Submission, Quiz, User,Conversation, Message,LessonNote,ReadReceipt,CodeChallenge,Module,LiveCodeChallenge,Resource
from .serializers import CourseSerializer, CourseDetailSerializer, UserSerializer, EnrollmentSerializer, LessonSerializer, LessonCompletionSerializer, AssignmentSerializer, SubmissionSerializer, QuizSerializer,ConversationListSerializer,MessageSerializer, MessageCreateSerializer, LessonNoteSerializer, GradedItemSerializer,ReadReceiptSerializer,StudentListSerializer, Question, Choice,CodeChallengeSerializer,ModuleSerializer,ModuleChallengeSerializer,LiveCodeChallengeSerializer,ResourceSerializer

# ====================================================================
# 1. Vistas de Cursos
# ====================================================================

class CourseViewSet(viewsets.ModelViewSet):
    """
    API endpoint para administración de cursos (CRUD).
    Usado típicamente en rutas de admin o si usas routers.
    """
    queryset = Course.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    def get_queryset(self):
        # --- ¡LA MAGIA ESTÁ AQUÍ! ---
        # Usamos .annotate() para contar módulos y estudiantes eficientemente
        return Course.objects.all().annotate(
            modules_count=Count('modules', distinct=True),
            enrollments_count=Count('enrollments', distinct=True)
        ).order_by('-created_at')
    
class ListaDeCursosView(generics.ListAPIView):
    """
    Devuelve una lista de todos los cursos (Usado en el Catálogo del frontend).
    AHORA ESTÁ OPTIMIZADO.
    """
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        return Course.objects.filter(is_published=True) \
                             .select_related('professor') \
                             .annotate(
                                 modules_count=Count('modules', distinct=True),
                                 # --- ¡FALTABA ESTA LÍNEA! ---
                                 enrollments_count=Count('enrollments', distinct=True) 
                             ).order_by('-created_at')

class DetalleDeCursoView(generics.RetrieveAPIView):
    """
    Devuelve el detalle de un curso específico.
    """
    queryset = Course.objects.all()
    serializer_class = CourseDetailSerializer
    permission_classes = [IsAuthenticated]

# ====================================================================
# 2. Vistas de Autenticación/Usuario
# ====================================================================

@api_view(['GET']) 
@permission_classes([IsAuthenticated]) 
def get_me_view(request):
    """
    Devuelve los datos del usuario autenticado (Usado en AuthContext para validar token).
    """
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)

# ====================================================================
# 3. Vistas de Inscripción (Enrollment)
# ====================================================================

class EnrollmentCreateView(generics.CreateAPIView):
    """
    Permite a un usuario autenticado inscribirse en un curso.
    """
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    # Sobrescribimos 'create' para añadir nuestra lógica personalizada
    def create(self, request, *args, **kwargs):
        
        # 1. Validar que 'course_id' fue enviado
        course_id = request.data.get('course_id')
        if not course_id:
            return Response(
                {"detail": "Se requiere el 'course_id'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Obtener los objetos (el usuario viene del token)
        course = get_object_or_404(Course, id=course_id)
        user = request.user

        # 3. Verificar si el usuario ya está inscrito (409 Conflict)
        if Enrollment.objects.filter(user=user, course=course).exists():
            return Response(
                {"detail": "Ya estás inscrito en este curso."},
                status=status.HTTP_409_CONFLICT
            )

        # 4. Validar los datos del request (aunque solo usamos course_id)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 5. ¡LA SOLUCIÓN!
        # Inyectamos el 'user' y el 'course' (que son read_only)
        # directamente en el método .save().
        serializer.save(user=user, course=course)

        # 6. Respuesta de éxito
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )

class MyEnrollmentListView(generics.ListAPIView):
    """
    Muestra todos los cursos en los que el usuario logueado está inscrito (Usado para verificación).
    """
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtra las inscripciones por el usuario que hace la solicitud
        return Enrollment.objects.filter(user=self.request.user).select_related('course')
    
class LessonDetailView(generics.RetrieveAPIView):
    """
    Devuelve el detalle de una lección específica.
    Ahora SÓLO si el usuario está inscrito en el curso.
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    # ¡APLICAMOS EL NUEVO PERMISO!
    # El usuario debe estar autenticado Y TAMBIÉN inscrito
    permission_classes = [IsEnrolledOrProfessor]


    # ====================================================================
# NUEVA VISTA: Marcar Lección como Completada
# ====================================================================
class LessonCompleteView(generics.CreateAPIView):
    """
    Permite a un usuario autenticado marcar una lección como completada.
    """
    queryset = LessonCompletion.objects.all()
    serializer_class = LessonCompletionSerializer
    permission_classes = [IsAuthenticated] # Solo usuarios logueados

    def create(self, request, *args, **kwargs):
        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            return Response(
                {"detail": "Se requiere el 'lesson_id'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lesson = get_object_or_404(Lesson, id=lesson_id)
        user = request.user

        # TODO: Verificar si el usuario está inscrito en el curso
        # (Usando el IsEnrolledPermission que ya creamos)

        # Verificar si ya la completó
        if LessonCompletion.objects.filter(user=user, lesson=lesson).exists():
            return Response(
                {"detail": "Ya has completado esta lección."},
                status=status.HTTP_409_CONFLICT
            )
        
        # Guardar la finalización
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Inyectamos el usuario y la lección (que son read_only)
        serializer.save(user=user, lesson=lesson) 

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
# ====================================================================
# NUEVA VISTA: Mis Lecciones Completadas
# ====================================================================
class MyLessonCompletionsListView(generics.ListAPIView):
    """
    Muestra todas las lecciones que el usuario logueado ha completado.
    """
    serializer_class = LessonCompletionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtra las lecciones completadas por el usuario que realiza la solicitud
        return LessonCompletion.objects.filter(user=self.request.user)
    
# ====================================================================
# NUEVA VISTA: Detalle de Tarea (por Lección)
# ====================================================================
class AssignmentDetailView(generics.RetrieveAPIView):
    """
    Devuelve la Tarea asociada a un ID de Lección.
    Usamos 'lesson__id' para buscar la tarea a través de la lección.
    """
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated] # TODO: Deberíamos usar IsEnrolledPermission
    lookup_field = 'lesson_id' # Le decimos que busque por 'lesson_id'
    lookup_url_kwarg = 'lesson_id' # El nombre del parámetro en la URL

# ====================================================================
# ACTUALIZADO: Crear/Actualizar una Entrega (Submission)
# ====================================================================
# ====================================================================
# ACTUALIZADO: Crear/Actualizar una Entrega (Submission)
# ====================================================================
class SubmissionCreateUpdateView(generics.CreateAPIView):
    """
    Permite a un usuario crear (POST) o actualizar (PUT/PATCH) una entrega.
    AHORA VERIFICA 'allow_edits' y 'due_date'.
    """
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        assignment_id = request.data.get('assignment_id')
        content = request.data.get('content')
        file = request.FILES.get('file_submission')
        
        if not assignment_id:
            return Response(
                {"detail": "Se requiere 'assignment_id'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not content and not file:
             return Response(
                {"detail": "Se requiere 'content' o 'file_submission'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        assignment = get_object_or_404(Assignment, id=assignment_id)
        user = request.user
        
        # --- ¡¡¡NUEVA LÓGICA DE VALIDACIÓN!!! ---
        
        # 1. Buscar si ya existe una entrega
        existing_submission = Submission.objects.filter(user=user, assignment=assignment).first()
        
        # 2. Verificar la fecha de entrega
        if assignment.due_date and timezone.now() > assignment.due_date:
            return Response(
                {"detail": "La fecha límite de entrega ya ha pasado."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # 3. Verificar si se permiten ediciones (si ya existe una entrega)
        if existing_submission and not assignment.allow_edits:
            return Response(
                {"detail": "Esta tarea no permite editar la entrega."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # --- FIN DE LA VALIDACIÓN ---

        file_name = None
        file_size = None
        if file:
            file_name = file.name
            file_size = file.size
        
        # Usar 'update_or_create' para manejar re-entregas
        submission, created = Submission.objects.update_or_create(
            user=user, 
            assignment=assignment,
            defaults={
                'content': content, 
                'file_submission': file, 
                'file_name': file_name,
                'file_size': file_size,
                'status': 'SUBMITTED' # Re-envía como 'SUBMITTED'
            }
        )
        
        serializer = self.get_serializer(submission)
        
        if created:
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.data, status=status.HTTP_200_OK)

class MySubmissionsListView(generics.ListAPIView):
    """
    Muestra todas las entregas (submissions) del usuario logueado.
    """
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtra las entregas por el usuario que realiza la solicitud
        return Submission.objects.filter(user=self.request.user)

# ====================================================================
# NUEVA VISTA: Detalle de Examen (por Módulo)
# ====================================================================
class QuizDetailView(generics.RetrieveAPIView):
    """
    Devuelve el Examen asociado a un ID de Módulo.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, IsEnrolledPermission] # Protegido
    
    # Buscamos el examen usando el ID del módulo (OneToOneField)
    lookup_field = 'module_id' 
    lookup_url_kwarg = 'module_id' # El nombre del parámetro en la URL
# ====================================================================
# NUEVA VISTA: Estadísticas del Dashboard
# ====================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_stats(request):
    user = request.user
    
    if user.role == 'PROFESSOR':
        # --- LÓGICA REAL PARA PROFESOR ---
        # 1. Cursos creados por mí
        my_courses_count = Course.objects.filter(professor=user).count()
        
        # 2. Total de estudiantes únicos en mis cursos
        total_students = Enrollment.objects.filter(
            course__professor=user
        ).values('user').distinct().count()
        
        # 3. Tareas pendientes de calificar (Status = SUBMITTED)
        pending_grading = Submission.objects.filter(
            assignment__lesson__module__course__professor=user,
            status='SUBMITTED'
        ).count()
        
        return Response({
            'role': 'PROFESSOR',
            'courses_created': my_courses_count,
            'total_students': total_students,
            'pending_tasks': pending_grading
        })

    else:
        # --- LÓGICA REAL PARA ESTUDIANTE (Ya la tenías) ---
        enrolled_count = Enrollment.objects.filter(user=user).count()
        completed_count = LessonCompletion.objects.filter(user=user).count()
        submitted_count = Submission.objects.filter(user=user).count()
        
        return Response({
            'role': 'STUDENT',
            'enrolled_courses': enrolled_count,
            'lessons_completed': completed_count,
            'assignments_submitted': submitted_count,
            # Calculamos XP y Nivel para la mascota
            'total_xp': user.experience_points
        })

# 2. AGREGA ESTA NUEVA VISTA (Para el Feed de Actividad)
class ProfessorActivityFeedView(generics.ListAPIView):
    """
    Devuelve las últimas 5 entregas de tareas de los alumnos del profesor.
    """
    serializer_class = SubmissionSerializer # Reutilizamos este serializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Solo submissions de cursos donde soy el profesor
        return Submission.objects.filter(
            assignment__lesson__module__course__professor=self.request.user
        ).order_by('-submitted_at')[:5] # Las 5 más recientes
# NUEVA VISTA: Lecciones Próximas para el Dashboard
# ====================================================================
class UpcomingLessonsView(generics.ListAPIView):
    """
    Devuelve las próximas 5 lecciones pendientes del usuario logueado.
    """
    serializer_class = LessonSerializer # Reutilizamos el LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Obtener los IDs de los cursos en los que el usuario está inscrito
        enrolled_courses_ids = Enrollment.objects.filter(user=user).values_list('course_id', flat=True)
        
        # 2. Obtener los IDs de las lecciones que el usuario YA completó
        completed_lessons_ids = LessonCompletion.objects.filter(user=user).values_list('lesson_id', flat=True)
        
        # 3. Buscar lecciones que pertenezcan a los cursos inscritos
        #    Y que NO estén en la lista de completadas.
        queryset = Lesson.objects.filter(
            module__course_id__in=enrolled_courses_ids
        ).exclude(
            id__in=completed_lessons_ids
        ).order_by('module__order', 'order') # Ordena por módulo y luego lección
        
        # Devuelve solo las primeras 5
        return queryset[:5]
    
# ====================================================================
# NUEVA VISTA: Mentores del Dashboard
# ====================================================================
class MyMentorsView(generics.ListAPIView):
    """
    Devuelve la lista de Profesores (Mentores) de los cursos
    en los que el usuario logueado está inscrito.
    """
    serializer_class = UserSerializer # Reutilizamos tu UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Esta consulta busca:
        # 1. Usuarios (User)
        # 2. Cuyo rol sea 'PROFESSOR'
        # 3. Que enseñen cursos (courses_taught)
        # 4. Donde esos cursos tengan inscripciones (enrollments)
        # 5. Cuyo usuario (user) sea el que hace la solicitud (el alumno).
        # .distinct() asegura que no tengamos duplicados si el alumno
        # está en 2 cursos con el mismo profesor.
        return User.objects.filter(
            role='PROFESSOR',
            courses_taught__enrollments__user=user
        ).distinct()

# ====================================================================
# NUEVA VISTA: Lista de Conversaciones (Inbox)
# ====================================================================
class GroupChatListView(generics.ListAPIView):
    """
    Devuelve todos los chats grupales (cursos)
    en los que el usuario actual participa.
    """
    serializer_class = ConversationListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Devuelve solo las conversaciones que son de GRUPO
        return self.request.user.conversations.filter(
            is_group=True
        ).annotate(
            last_message_time=Max('messages__timestamp')
        ).order_by('-last_message_time')

# ====================================================================
# ACTUALIZADO: Lista/Creación de Mensajes (Chat Activo)
# ====================================================================

class MessagePagination(PageNumberPagination):
    page_size = 30
    page_size_query_param = 'page_size'
    max_page_size = 100

class MessageListView(generics.ListCreateAPIView):
    """
    GET: Devuelve todos los mensajes de una conversación específica (¡AHORA PAGINADO!)
    POST: Crea un nuevo mensaje Y LO RETRANSMITE POR WEBSOCKET.
    """
    permission_classes = [IsAuthenticated]
    
    # --- ¡CAMBIO 1: AÑADIDO! ---
    pagination_class = MessagePagination
    
    # --- (El resto de tus métodos) ---
    def get_conversation(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)
        if not self.request.user in conversation.participants.all():
            raise PermissionDenied("No tienes permiso para ver esta conversación.")
        return conversation

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer

    def get_queryset(self):
        conversation = self.get_conversation()
        # Mantenemos el orden ASC (timestamp)
        # Page 1 = Más antiguos, Last Page = Más nuevos
        return conversation.messages.all().order_by('-timestamp')

    # --- ¡CAMBIO 2: MÉTODO 'list' ACTUALIZADO! ---
    # (Reemplaza el 'list' que te di antes por este)
    def list(self, request, *args, **kwargs):
        """
        Sobrescribe el método 'list' (GET) para:
        1. Pasar el contexto al serializer (para arreglar URLs de archivos)
        2. Manejar la paginación
        """
        queryset = self.filter_queryset(self.get_queryset())

        # Paginar el queryset
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            # ¡LA LÍNEA CLAVE! Pasamos el contexto al serializador
            serializer = self.get_serializer(page, many=True, context=self.get_serializer_context())
            # Devolvemos la respuesta paginada (con count, next, etc.)
            return self.get_paginated_response(serializer.data)

        # Fallback (si no hay paginación)
        serializer = self.get_serializer(queryset, many=True, context=self.get_serializer_context())
        return Response(serializer.data)
    # --- FIN DE LOS CAMBIOS ---

    def perform_create(self, serializer):
        conversation = self.get_conversation()
        file_name = None
        file_size = None
        if 'file_upload' in self.request.FILES:
            file = self.request.FILES['file_upload']
            file_name = file.name
            file_size = file.size
        serializer.save(
            sender=self.request.user, 
            conversation=conversation,
            file_name=file_name,
            file_size=file_size
        )

    def create(self, request, *args, **kwargs):
        # ... (Tu método 'create' está perfecto, no necesita cambios)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        read_serializer = MessageSerializer(serializer.instance, context=self.get_serializer_context())
        try:
            channel_layer = get_channel_layer()
            room_group_name = f'chat_conversation_{serializer.instance.conversation.id}'
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    'type': 'chat_message', 
                    'message': read_serializer.data
                }
            )
            print(f"[Views] Mensaje {serializer.instance.id} retransmitido a {room_group_name}")
        except Exception as e:
            print(f"ERROR: No se pudo retransmitir el mensaje por WebSocket. {e}")
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
# ====================================================================
# NUEVA VISTA: Lista de "Contactos" (Compañeros y Profesores)
# ====================================================================
class ContactListView(generics.ListAPIView):
    """
    Devuelve una lista de todos los usuarios (compañeros y profesores)
    que comparten al menos un curso con el usuario actual.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Obtener los IDs de los cursos en los que el usuario está inscrito
        enrolled_course_ids = Enrollment.objects.filter(user=user).values_list('course_id', flat=True)
        
        if not enrolled_course_ids:
            return User.objects.none() # No devolver nada si no está en cursos
            
        # 2. Obtener los IDs de los profesores de esos cursos
        professor_ids = Course.objects.filter(
            id__in=enrolled_course_ids
        ).values_list('professor_id', flat=True)
        
        # 3. Obtener los IDs de todos los alumnos (compañeros) en esos cursos
        classmate_ids = Enrollment.objects.filter(
            course_id__in=enrolled_course_ids
        ).values_list('user_id', flat=True)
        
        # 4. Combinar todos los IDs (usando 'set' para eliminar duplicados)
        all_related_ids = set(professor_ids) | set(classmate_ids)
        
        # 5. Devolver los objetos User, excluyendo al propio usuario
        return User.objects.filter(
            id__in=all_related_ids
        ).exclude(id=user.id)


# ====================================================================
# NUEVA VISTA: Iniciar un Mensaje Directo (1-a-1)
# ====================================================================
class StartDirectMessageView(APIView):
    """
    POST: Inicia o recupera una conversación 1-a-1 con otro usuario.
    Espera: { "user_id": <id_del_otro_usuario> }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        target_user_id = request.data.get('user_id')
        if not target_user_id:
            return Response({"detail": "Se requiere 'user_id'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response({"detail": "Usuario no encontrado."}, status=status.HTTP_4404_NOT_FOUND)
            
        user = request.user
        
        # 1. Buscar si ya existe una conversación 1-a-1 (no-grupo)
        #    que tenga exactamente a estos dos participantes.
        existing_convo = Conversation.objects.annotate(
            num_participants=Count('participants') # <--- ¡CORREGIDO!
        ).filter(
            is_group=False,
            num_participants=2,
            participants=user
        ).filter(
            participants=target_user
        ).first()
        
        # 2. Si ya existe, devolverla
        if existing_convo:
            # Usamos ConversationListSerializer (como en tu código)
            serializer = ConversationListSerializer(existing_convo, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        # 3. Si no existe, crearla
        new_convo = Conversation.objects.create(is_group=False)
        new_convo.participants.add(user, target_user)
        
        # Serializar y devolver la nueva conversación
        serializer = ConversationListSerializer(new_convo, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
# ====================================================================
# NUEVA VISTA: ViewSet de Apuntes de Lección
# ====================================================================
class LessonNoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint para el "Bloc de Notas" de un alumno.
    Permite (GET) listar, (POST) crear, (PUT/PATCH) actualizar, y (DELETE) borrar
    apuntes para una lección específica.
    """
    serializer_class = LessonNoteSerializer
    permission_classes = [IsAuthenticated] # Solo el usuario logueado

    def get_queryset(self):
        """
        Filtra las notas para que solo muestre las del usuario actual
        Y para la lección especificada en la URL.
        """
        user = self.request.user
        lesson_id = self.kwargs['lesson_id'] # Obtiene el 'lesson_id' de la URL
        return LessonNote.objects.filter(user=user, lesson_id=lesson_id)

    def perform_create(self, serializer):
        """
        Inyecta automáticamente el 'user' y la 'lesson' al crear una nota.
        """
        lesson = get_object_or_404(Lesson, id=self.kwargs['lesson_id'])
        serializer.save(user=self.request.user, lesson=lesson)

# ====================================================================
# NUEVA VISTA: Libro de Calificaciones (por Curso)
# ====================================================================
class GradebookView(generics.ListAPIView):
    """
    Devuelve una lista de todos los "entregables" (Tareas, Quizzes)
    de un curso, junto con las entregas y notas del usuario actual.
    """
    serializer_class = GradedItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Obtiene el 'courseId' de la URL
        course_id = self.kwargs['course_id']
        
        # Devuelve todas las TAREAS que pertenecen a ese curso
        # (En el futuro, aquí también uniríamos los Quizzes)
        return Assignment.objects.filter(
            lesson__module__course_id=course_id
        ).order_by('due_date', 'lesson__order')

# ====================================================================
# NUEVA VISTA: Lista de Conversaciones (Inbox)
# ====================================================================
class GroupChatListView(generics.ListAPIView):
    """
    Devuelve todos los chats grupales (cursos)
    en los que el usuario actual participa.
    """
    serializer_class = ConversationListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Subquery base para el último mensaje
        last_message_subquery = Message.objects.filter(
            conversation=OuterRef('pk')
        ).order_by('-timestamp')

        last_read_subquery = ReadReceipt.objects.filter(
            conversation=OuterRef('pk'),
            user=user
        ).values('last_read_timestamp')[:1]

        return user.conversations.filter(
            is_group=True,
            lesson_chat__isnull=True
        ).annotate(
            last_read_time=Subquery(last_read_subquery),

            # --- ¡INICIO DE LA CORRECCIÓN! ---
            # Anotamos todos los campos que necesitamos para el snippet
            last_msg_content=Subquery(last_message_subquery.values('content')[:1]),
            last_msg_type=Subquery(last_message_subquery.values('message_type')[:1]),
            last_msg_file_name=Subquery(last_message_subquery.values('file_name')[:1]),
            last_msg_timestamp=Subquery(last_message_subquery.values('timestamp')[:1])
            # --- FIN DE LA CORRECCIÓN! ---

        ).annotate(
            unread_count=Count('messages', filter=
                Q(messages__timestamp__gt=Coalesce(
                    'last_read_time',
                    datetime.min.replace(tzinfo=dt_timezone.utc)
                )) & 
                ~Q(messages__sender=user)
            )
        ).order_by(
            Coalesce('last_msg_timestamp', datetime.min.replace(tzinfo=dt_timezone.utc)).desc()
        )
    def get_serializer_context(self):
        return {'request': self.request}

class DirectMessageListView(generics.ListAPIView):
    """
    Devuelve todos los chats 1-a-1 (no grupales)
    en los que el usuario actual participa.
    """
    serializer_class = ConversationListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        last_message_subquery = Message.objects.filter(
            conversation=OuterRef('pk')
        ).order_by('-timestamp')

        last_read_subquery = ReadReceipt.objects.filter(
            conversation=OuterRef('pk'),
            user=user
        ).values('last_read_timestamp')[:1]

        return user.conversations.filter(
            is_group=False
        ).annotate(
            last_read_time=Subquery(last_read_subquery),

            # --- ¡INICIO DE LA CORRECCIÓN! ---
            last_msg_content=Subquery(last_message_subquery.values('content')[:1]),
            last_msg_type=Subquery(last_message_subquery.values('message_type')[:1]),
            last_msg_file_name=Subquery(last_message_subquery.values('file_name')[:1]),
            last_msg_timestamp=Subquery(last_message_subquery.values('timestamp')[:1])
            # --- FIN DE LA CORRECCIÓN! ---

        ).annotate(
            unread_count=Count('messages', filter=
                Q(messages__timestamp__gt=Coalesce(
                    'last_read_time',
                    datetime.min.replace(tzinfo=dt_timezone.utc)
                )) & 
                ~Q(messages__sender=user)
            )
        ).order_by(
            Coalesce('last_msg_timestamp', datetime.min.replace(tzinfo=dt_timezone.utc)).desc()
        )
    
    def get_serializer_context(self):
        # Este método es importante para que el serializer
        # pueda acceder al 'request.user'
        return {'request': self.request}

class MarkAsReadView(APIView):
    """
    Actualiza el ReadReceipt de un usuario para una conversación.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id, *args, **kwargs):
        user = request.user
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Comprueba que el usuario sea participante
        if not conversation.participants.filter(id=user.id).exists():
            raise PermissionDenied("No eres participante de esta conversación.")
            
        # Actualiza o crea el recibo de lectura a la hora actual
        ReadReceipt.objects.update_or_create(
            user=user, 
            conversation=conversation,
            defaults={'last_read_timestamp': timezone.now()}
        )
        
        return Response(status=status.HTTP_200_OK)
    

class LessonChatListView(generics.ListAPIView):
    """
    Devuelve todos los chats grupales de LECCIONES
    en los que el usuario actual participa.
    """
    serializer_class = ConversationListSerializer 
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        last_message_subquery = Message.objects.filter(
            conversation=OuterRef('pk')
        ).order_by('-timestamp')

        last_read_subquery = ReadReceipt.objects.filter(
            conversation=OuterRef('pk'),
            user=user
        ).values('last_read_timestamp')[:1]

        queryset = user.conversations.filter(
            is_group=True,
            lesson_chat__isnull=False
        )

        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(lesson_chat__module__course_id=course_id)

        module_id = self.request.query_params.get('module_id')
        if module_id:
            queryset = queryset.filter(lesson_chat__module_id=module_id)

        return queryset.annotate(
            last_read_time=Subquery(last_read_subquery),

            # --- ¡INICIO DE LA CORRECCIÓN! ---
            last_msg_content=Subquery(last_message_subquery.values('content')[:1]),
            last_msg_type=Subquery(last_message_subquery.values('message_type')[:1]),
            last_msg_file_name=Subquery(last_message_subquery.values('file_name')[:1]),
            last_msg_timestamp=Subquery(last_message_subquery.values('timestamp')[:1])
            # --- FIN DE LA CORRECCIÓN! ---

        ).annotate(
            unread_count=Count('messages', filter=
                Q(messages__timestamp__gt=Coalesce(
                    'last_read_time',
                    datetime.min.replace(tzinfo=dt_timezone.utc)
                )) & 
                ~Q(messages__sender=user)
            )
        ).order_by(
            Coalesce('last_msg_timestamp', datetime.min.replace(tzinfo=dt_timezone.utc)).desc()
        )

    def get_serializer_context(self):
        return {'request': self.request}
    

class ReadReceiptListView(generics.ListAPIView):
    serializer_class = ReadReceiptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        conversation = get_object_or_404(Conversation, id=conversation_id)

        if not conversation.participants.filter(id=self.request.user.id).exists():
            raise PermissionDenied("No eres parte de esta conversación.")

        # Devuelve todos los recibos, EXCEPTO el del propio usuario
        return conversation.read_receipts.exclude(user=self.request.user).select_related('user')

@api_view(['GET'])
@permission_classes([IsAuthenticated]) # Deberías crear un permiso IsProfessor
def get_course_students(request, course_id):
    """
    Devuelve la lista de alumnos inscritos en un curso.
    """
    if not request.user.role == 'PROFESSOR':
        return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Usamos tus modelos: Enrollment y User
        enrollments = Enrollment.objects.filter(
            course_id=course_id, 
            user__role='STUDENT'
        ).select_related('user') # Optimiza la consulta
        
        students = [enroll.user for enroll in enrollments]
        serializer = StudentListSerializer(students, many=True)
        return Response(serializer.data)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated]) # Deberías crear un permiso IsProfessor
def add_experience_points(request, user_id):
    """
    Otorga puntos de experiencia (XP) a un alumno específico.
    ¡AHORA USA DJANGO CHANNELS PARA NOTIFICAR!
    """
    if not request.user.role == 'PROFESSOR':
        return Response({'error': 'No tienes permiso para dar puntos'}, status=403)
    
    try:
        # 1. ACTUALIZA LA BASE DE DATOS (DJANGO)
        student = User.objects.get(id=user_id, role='STUDENT')
        points_to_add = int(request.data.get('points', 0))

        if points_to_add == 0:
            return Response({'error': 'No se especificaron puntos'}, status=400)

        student.experience_points += points_to_add
        student.save(update_fields=['experience_points'])

        # 2. NOTIFICA AL ALUMNO (¡Usando Channels!)
        try:
            channel_layer = get_channel_layer()
            
            # Este es el "canal" privado de notificaciones del alumno
            user_channel_name = f"user_{student.id}_notifications" 
            
            async_to_sync(channel_layer.group_send)(
                user_channel_name,
                {
                    "type": "xp_update_message", # ¡Nuevo tipo de mensaje!
                    "payload": {
                        'newXp': student.experience_points,
                        'pointsAdded': points_to_add
                    }
                }
            )
            print(f"[Django View] Notificación de XP enviada a {user_channel_name}")
            
        except Exception as e:
            # Si Channels falla, no rompemos la app, solo lo registramos
            print(f"ADVERTENCIA: No se pudo notificar por Channels. Error: {e}")
            pass 

        # 3. RESPONDE AL TUTOR (REACT)
        return Response({
            'status': 'ok',
            'user_id': student.id,
            'new_total_xp': student.experience_points
        })

    except User.DoesNotExist:
        return Response({'error': 'Alumno no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_quizzes(request, course_id):
    """
    Devuelve una lista de todos los Quizzes EN VIVO (tipo Kahoot)
    asociados a un curso.
    """
    if not request.user.role == 'PROFESSOR':
        return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # --- ¡CAMBIO EN EL FILTRO! ---
        # Antes buscaba por 'module__course_id'.
        # Ahora buscamos directamente por 'course_id' Y por el nuevo 'quiz_type'.
        quizzes = Quiz.objects.filter(
            course_id=course_id,
            quiz_type='LIVE' # <-- ¡SOLO TRAE LOS QUIZZES EN VIVO!
        )
        
        serializer = QuizSerializer(quizzes, many=True)
        return Response(serializer.data)

    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_live_quiz(request, lesson_id):
    """
    Crea un nuevo Quiz de tipo 'LIVE' vinculado a una LECCIÓN.
    """
    if not request.user.role == 'PROFESSOR':
        return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)

    try:
        lesson = Lesson.objects.get(id=lesson_id) # <-- ¡CAMBIO! Usa Lesson
        data = request.data

        # 1. Crear el Quiz principal
        live_quiz = Quiz.objects.create(
            lesson=lesson, # <-- ¡CAMBIO! Vinculado a Lesson
            quiz_type='LIVE',
            title=data.get('title', 'Nuevo Quiz en Vivo')
        )

        # 2. Iterar sobre las preguntas
        questions_data = data.get('questions', [])
        for q_order, question_data in enumerate(questions_data):
            question = Question.objects.create(
                quiz=live_quiz,
                text=question_data.get('text', 'Sin texto'),
                order=q_order
            )

            # 3. Iterar sobre las opciones
            choices_data = question_data.get('choices', [])
            for choice_data in choices_data:
                Choice.objects.create(
                    question=question,
                    text=choice_data.get('text', 'Sin texto'),
                    is_correct=choice_data.get('is_correct', False)
                )

        serializer = QuizSerializer(live_quiz)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Lesson.DoesNotExist: # <-- ¡CAMBIO!
        return Response({'error': 'Lección no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Error creando el quiz: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lesson_challenges(request, lesson_id):
    """
    Obtiene todos los desafíos de código para una lección específica.
    """
    try:
        challenges = CodeChallenge.objects.filter(lesson_id=lesson_id)
        serializer = CodeChallengeSerializer(challenges, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_challenge_solution(request, challenge_id):
    """
    Recibe la solución de un alumno, la evalúa con IA y devuelve feedback.
    """
    try:
        challenge = CodeChallenge.objects.get(id=challenge_id)
        user_code = request.data.get('code', '')

        if not user_code:
            return Response({'error': 'No se envió código.'}, status=400)

        # --- ¡AQUÍ ESTÁ LA MAGIA DE LA IA! ---

        # 1. Prepara el "prompt" para la IA
        # (Este es el prompt que te sugerí que usarías, ¡ahora lo estamos implementando!)
        prompt = f"""
        Eres un tutor de programación experto. Un alumno ha enviado una solución
        para un desafío de código.

        EL PROBLEMA:
        {challenge.description}

        LA SOLUCIÓN DEL ALUMNO:
        ```python
        {user_code}
        ```

        LA SOLUCIÓN ÓPTIMA (para tu referencia):
        ```python
        {challenge.solution}
        ```

        Por favor, evalúa la solución del alumno y responde en formato JSON
        con la siguiente estructura:
        {{
          "is_correct": [true o false, basado en si el código resuelve el problema],
          "feedback": [Un comentario breve y amable sobre el código del alumno],
          "code_review": [El código original del alumno, pero con comentarios 
                          inline (ej. # ¡Buen trabajo!) explicando los errores 
                          o mejoras. Si es perfecto, solo pon un comentario 
                          positivo.]
        }}
        """

        # 2. Llama a la API de Gemini
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)

        # Limpia la respuesta de la IA (quitando los ```json ... ```)
        json_response = response.text.strip().replace("```json", "").replace("```", "")
        ia_data = json.loads(json_response)

        points_awarded = 0
        if ia_data.get('is_correct', False):
            points_awarded = 50 # (O los puntos que quieras)

            # ¡Otorga los puntos de mascota!
            user = request.user
            user.experience_points = F('experience_points') + points_awarded
            user.save(update_fields=['experience_points'])
            user.refresh_from_db()

            # (Opcional: Envía un WebSocket para que la mascota se actualice)
            # ... (lógica de channel_layer.group_send) ...

        # 3. Devuelve la respuesta de la IA al frontend
        return Response({
            'is_correct': ia_data.get('is_correct'),
            'feedback': ia_data.get('feedback'),
            'code_review': ia_data.get('code_review'),
            'points_awarded': points_awarded,
            'new_total_xp': request.user.experience_points
        })

    except CodeChallenge.DoesNotExist:
        return Response({'error': 'Desafío no encontrado'}, status=404)
    except Exception as e:
        print(f"ERROR EN LA EVALUACIÓN DE IA: {e}")
        return Response({'error': f'Error al evaluar la solución: {e}'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_practice_world_data(request, course_id):
    """
    Devuelve la estructura de datos completa para el "Mundo de Práctica"
    de un curso (Pilar 3A).
    """
    try:
        # 1. Busca el curso principal
        course = Course.objects.get(id=course_id)
        
        # 2. Busca todos los módulos (como antes)
        modules = Module.objects.filter(
            course_id=course_id
        ).prefetch_related(
            'lessons',
            'lessons__code_challenges' 
        ).order_by('order')
        
        # 3. Serializa los datos
        course_serializer = CourseSerializer(course) # Serializer simple del curso
        modules_serializer = ModuleChallengeSerializer(modules, many=True)
        
        # 4. ¡Devuelve TODO en un solo objeto!
        return Response({
            'course': course_serializer.data,
            'modules': modules_serializer.data
        })

    except Exception as e:
        return Response({'error': f'Error al construir el mundo: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_live_code_challenge(request, lesson_id): # <-- ¡Ahora recibe lesson_id!
    """
    Crea un nuevo Desafío de Código EN VIVO (Pilar 3B) para una lección.
    """
    if not request.user.role == 'PROFESSOR':
        return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)

    try:
        # --- ¡ARREGLADO! ---
        # 1. Busca la Lección, no el Curso
        lesson = Lesson.objects.get(id=lesson_id) 
        data = request.data
        
        serializer = LiveCodeChallengeSerializer(data=data)
        
        # 2. Valida los datos
        if serializer.is_valid(raise_exception=True):
            # 3. Guarda el desafío, asignando la lección
            # (El serializer ya sabe de 'title', 'description', 'solution')
            serializer.save(lesson=lesson) 
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        # (El raise_exception=True se encargará de los campos vacíos)

    except Lesson.DoesNotExist: # <-- ¡ARREGLADO!
        return Response({'error': 'Lección no encontrada'}, status=status.F_404_NOT_FOUND)
    except Exception as e:
        # Esto atrapará errores de validación (como 'solution' vacía)
        print(f"ERROR AL CREAR DESAFÍO: {e}")
        return Response({'error': f'Error creando el desafío: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lesson_live_quizzes(request, lesson_id):
    """
    Obtiene todos los Quizzes en Vivo (Pilar 2)
    asociados a una LECCIÓN específica.
    """
    if not request.user.role == 'PROFESSOR':
        return Response({'error': 'No tienes permiso'}, status=403)
    
    try:
        quizzes = Quiz.objects.filter(
            lesson_id=lesson_id,
            quiz_type='LIVE' # Solo los de tipo "en vivo"
        )
        serializer = QuizSerializer(quizzes, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lesson_live_challenges(request, lesson_id):
    """
    Obtiene todos los Desafíos de Código en Vivo (Pilar 3B)
    asociados a una LECCIÓN específica.
    """
    if not request.user.role == 'PROFESSOR':
        return Response({'error': 'No tienes permiso'}, status=403)
    
    try:
        challenges = LiveCodeChallenge.objects.filter(lesson_id=lesson_id)
        serializer = LiveCodeChallengeSerializer(challenges, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

class LessonResourceListCreateView(generics.ListCreateAPIView):
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        lesson_id = self.kwargs['lesson_id']
        return Resource.objects.filter(lesson_id=lesson_id).order_by('-uploaded_at')

    def perform_create(self, serializer):
        lesson = get_object_or_404(Lesson, id=self.kwargs['lesson_id'])
        
        # --- DEPURACIÓN: IMPRIMIR QUÉ ESTÁ LLEGANDO ---
        print(f"--- SUBIENDO ARCHIVO A LECCIÓN {lesson.id} ---")
        file_obj = self.request.FILES.get('file')
        
        if file_obj:
            print(f"Nombre: {file_obj.name}")
            print(f"Tamaño detectado (bytes): {file_obj.size}")
        else:
            print("¡ALERTA! No se detectó archivo en request.FILES")
        # ----------------------------------------------

        file_size_str = "0 KB"

        if file_obj:
            try:
                size_bytes = file_obj.size
                
                # Lógica de cálculo
                if size_bytes < 1024:
                    file_size_str = f"{size_bytes} Bytes"
                elif size_bytes < 1024 * 1024:
                    kb_size = size_bytes / 1024
                    file_size_str = f"{round(kb_size, 1)} KB"
                else:
                    mb_size = size_bytes / (1024 * 1024)
                    file_size_str = f"{round(mb_size, 1)} MB"
            except Exception as e:
                print(f"Error calculando tamaño: {e}")

        # Guardamos
        serializer.save(
            lesson=lesson,
            file_size=file_size_str
        )


class LessonResourceDetailView(generics.DestroyAPIView):
    """
    DELETE: Elimina un archivo específico.
    """
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Asegura que solo borres archivos de la lección correcta
        return Resource.objects.filter(lesson_id=self.kwargs['lesson_id'])



# 1. Vista para obtener TODOS los recursos de un curso (de todas sus lecciones)
class CourseResourcesListView(generics.ListAPIView):
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_id = self.kwargs['course_id']
        return Resource.objects.filter(lesson__module__course_id=course_id)\
                               .select_related('lesson', 'lesson__module')\
                               .order_by('lesson__module__order', 'lesson__order', '-uploaded_at')

# 2. Vista para Archivar/Publicar Curso
class CourseStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        course = get_object_or_404(Course, id=pk)
        # Solo el profesor dueño puede hacerlo
        if course.professor != request.user:
             return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
        
        # Cambiar estado
        new_status = request.data.get('is_published')
        if new_status is not None:
            course.is_published = new_status
            course.save()
            return Response({"status": "updated", "is_published": course.is_published})
        return Response({"error": "Dato inválido"}, status=status.HTTP_400_BAD_REQUEST)























