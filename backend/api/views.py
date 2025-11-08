# backend/api/views.py

from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .permissions import IsEnrolledPermission
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.db.models import Max, Count
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
# Imports de Modelos y Serializers de tu app
from .models import Course, Enrollment, Lesson, LessonCompletion, Assignment, Submission, Quiz, User,Conversation, Message,LessonNote
from .serializers import CourseSerializer, CourseDetailSerializer, UserSerializer, EnrollmentSerializer, LessonSerializer, LessonCompletionSerializer, AssignmentSerializer, SubmissionSerializer, QuizSerializer,ConversationListSerializer,MessageSerializer, MessageCreateSerializer, LessonNoteSerializer, GradedItemSerializer
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
    
class ListaDeCursosView(generics.ListAPIView):
    """
    Devuelve una lista de todos los cursos (Usado en el Catálogo del frontend).
    AHORA ESTÁ OPTIMIZADO.
    """
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated] # O [AllowAny] si quieres que todos vean los cursos

    def get_queryset(self):
        # 1. Solo muestra cursos que están 'publicados'
        # 2. Usa 'select_related' para traer al profesor en la misma consulta (eficiente)
        # 3. Usa 'annotate' para contar los módulos de cada curso (súper eficiente)
        return Course.objects.filter(is_published=True) \
                             .select_related('professor') \
                             .annotate(modules_count=Count('modules'))

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
    permission_classes = [IsAuthenticated, IsEnrolledPermission]


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
    """
    Devuelve un resumen de las estadísticas del usuario logueado
    para el Dashboard del Frontend.
    """
    user = request.user
    
    # 1. Contar Cursos Inscritos
    enrolled_courses_count = Enrollment.objects.filter(user=user).count()
    
    # 2. Contar Lecciones Completadas
    lessons_completed_count = LessonCompletion.objects.filter(user=user).count()
    
    # 3. Contar Tareas Entregadas (Status SUBMITTED o GRADED)
    submissions_count = Submission.objects.filter(
        user=user, 
        status__in=['SUBMITTED', 'GRADED']
    ).count()

    # (En el futuro, aquí podríamos añadir las insignias)
    
    # Prepara la respuesta JSON
    data = {
        'enrolled_courses': enrolled_courses_count,
        'lessons_completed': lessons_completed_count,
        'assignments_submitted': submissions_count,
        # 'badges_unlocked': 0 # (Para el futuro)
    }
    
    return Response(data, status=status.HTTP_200_OK)
# ====================================================================
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
class MessageListView(generics.ListCreateAPIView):
    """
    GET: Devuelve todos los mensajes de una conversación específica.
    POST: Crea un nuevo mensaje en esa conversación.
    """
    permission_classes = [IsAuthenticated]

    def get_conversation(self):
        """ Helper para obtener y validar la conversación """
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Comprueba que el usuario sea participante
        if not self.request.user in conversation.participants.all():
            raise PermissionDenied("No tienes permiso para ver esta conversación.")
        return conversation

    def get_serializer_class(self):
        # Usa un serializer diferente para GET (leer) vs POST (crear)
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer # <-- Este es el serializer "completo"

    def get_queryset(self):
        # Obtiene la conversación (ya incluye la validación de permisos)
        conversation = self.get_conversation()
        # Devuelve los mensajes de esa conversación
        return conversation.messages.all().order_by('timestamp')

    def perform_create(self, serializer):
        conversation = self.get_conversation()
        
        # --- ¡LÓGICA ACTUALIZADA! ---
        file_name = None
        file_size = None

        # Revisa si hay un archivo en la petición
        if 'file_upload' in self.request.FILES:
            file = self.request.FILES['file_upload']
            file_name = file.name
            file_size = file.size
        
        # Guarda todo junto
        serializer.save(
            sender=self.request.user, 
            conversation=conversation,
            file_name=file_name,
            file_size=file_size
        )
    # --- ¡¡¡AQUÍ ESTÁ LA CORRECCIÓN!!! ---
    # Sobrescribimos el método 'create' para cambiar lo que devuelve
    def create(self, request, *args, **kwargs):
        # 1. Usar el serializer de CREACIÓN para validar la data de entrada
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 2. Guardar el objeto (perform_create se llamará automáticamente)
        self.perform_create(serializer)
        
        # 3. ¡LA CLAVE!
        # En lugar de devolver serializer.data (que es el de creación),
        # creamos un nuevo serializer (el COMPLETO, 'MessageSerializer')
        # con la instancia que acabamos de crear (serializer.instance)
        # y devolvemos SUS datos.
        
        # Usamos MessageSerializer (el de GET) para la respuesta
        read_serializer = MessageSerializer(serializer.instance, context=self.get_serializer_context())
        
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
