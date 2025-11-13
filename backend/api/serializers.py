# backend/api/serializers.py

from rest_framework import serializers
from .models import (
    User, 
    Course, 
    Enrollment, 
    Module, 
    Lesson, 
    LessonCompletion, 
    Assignment, 
    Submission, 
    Grade,
    Quiz, 
    Question, 
    Choice,
    Resource,
    LearningObjective,
    Requirement,
    CourseBenefit,
    Conversation,
    Message,
    LessonNote,
    ReadReceipt
    
)

class LearningObjectiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningObjective
        fields = ['id', 'description']

class RequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Requirement
        fields = ['id', 'description']

class CourseBenefitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseBenefit
        fields = ['id', 'description', 'icon'] # <-- Enviamos el ícono
# ====================================================================
# NUEVO: Serializer de Recurso
# ====================================================================
class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'title', 'file']

# 1. Serializer de Usuario (Básico)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role','title', 'bio','experience_points']

# 2. Serializer de Lección (El más interno)
class LessonSerializer(serializers.ModelSerializer):
    module_id = serializers.ReadOnlyField(source='module.id')
    course_id = serializers.ReadOnlyField(source='module.course.id')
    
    next_lesson_id = serializers.SerializerMethodField()
    prev_lesson_id = serializers.SerializerMethodField()
    
    resources = ResourceSerializer(many=True, read_only=True)
    
    # --- ¡¡¡AÑADE ESTE CAMPO!!! ---
    # Esto envía el ID (un número) de la conversación de chat
    chat_conversation = serializers.PrimaryKeyRelatedField(read_only=True) 

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'order', 'content', 'video_url', 
            'live_session_room',
            'module_id', 'course_id',
            'next_lesson_id', 'prev_lesson_id',
            'resources',
            'chat_conversation' # <-- ¡AÑADIDO A LA LISTA!
        ]
    
    # --- (Si no tienes estas funciones, añádelas) ---
    def _get_adjacent_lesson(self, obj, direction='next'):
        if direction == 'next':
            query = Lesson.objects.filter(
                module=obj.module, 
                order__gt=obj.order
            ).order_by('order').first()
        else: # 'prev'
            query = Lesson.objects.filter(
                module=obj.module, 
                order__lt=obj.order
            ).order_by('-order').first()
        return query.id if query else None

    def get_next_lesson_id(self, obj):
        return self._get_adjacent_lesson(obj, 'next')

    def get_prev_lesson_id(self, obj):
        return self._get_adjacent_lesson(obj, 'prev')
    
# 3. Serializer de Módulo (Anida Lecciones)
class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    quiz = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'lessons','quiz']

# 4. Serializer de Curso (Para la lista)
class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer enriquecido para las tarjetas del catálogo de cursos.
    """
    # Anidamos el serializer del profesor para obtener su nombre
    professor = UserSerializer(read_only=True)
    
    # Este campo se llenará usando 'annotate' en la vista
    modules_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        # ¡Enviamos todos los campos nuevos que creamos en models.py!
        fields = [
            'id', 
            'title', 
            'description', 
            'main_image_url',   # <-- La imagen del curso
            'professor',          # <-- El objeto del profesor
            'modules_count'       # <-- El conteo de módulos
        ]

# 5. Serializer de Detalle de Curso (Anida Módulos)
class CourseDetailSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    
    # --- ¡NUEVOS CAMPOS! ---
    # Asume que tu modelo 'Course' tiene un FK a 'professor'
    professor = UserSerializer(read_only=True) 
    
    # Esto es más complejo, tendrías que añadir 
    # modelos 'Requirement' y 'LearningObjective'
    requirements = serializers.SerializerMethodField()
    learning_objectives = serializers.SerializerMethodField()
    learning_objectives = LearningObjectiveSerializer(many=True, read_only=True)
    requirements = RequirementSerializer(many=True, read_only=True)
    benefits = CourseBenefitSerializer(many=True, read_only=True)
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'created_at', 'modules', 
            'professor', # <-- Nuevo
            'requirements', # <-- Nuevo
            'learning_objectives', # <-- Nuevo
            'main_image_url', 
            'estimated_duration',
            'learning_objectives',
            'requirements',
            'benefits'
        ]

    def get_requirements(self, obj):
        # Lógica para obtener la lista de requisitos
        return ["Requisito 1 (desde la API)", "Requisito 2 (desde la API)"]
    
    def get_learning_objectives(self, obj):
        # Lógica para obtener los objetivos
        return ["Objetivo 1 (desde la API)", "Objetivo 2 (desde la API)"]
    
# 6. Serializer de Inscripción (Enrollment)
class EnrollmentSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(write_only=True)
    course = CourseSerializer(read_only=True) 
    
    # --- ¡NUEVOS CAMPOS PARA EL PROGRESO! ---
    lessons_completed_count = serializers.SerializerMethodField()
    total_lessons_count = serializers.SerializerMethodField()
    # ----------------------------------------

    class Meta:
        model = Enrollment
        # ¡Añade los nuevos campos a la lista 'fields'!
        fields = [
            'id', 'user', 'course', 'date_enrolled', 'completed', 'course_id', 
            'lessons_completed_count', 'total_lessons_count' 
        ]
        read_only_fields = ['user']

    def get_total_lessons_count(self, obj):
        """
        Devuelve el número total de lecciones en el curso de esta inscripción.
        (obj es la instancia de Enrollment)
        """
        # obj.course es el curso asociado a esta inscripción
        # Buscamos lecciones cuyo módulo pertenezca a este curso
        return Lesson.objects.filter(module__course=obj.course).count()

    def get_lessons_completed_count(self, obj):
        """
        Devuelve cuántas lecciones de ese curso ha completado el usuario.
        (obj es la instancia de Enrollment)
        """
        # obj.user es el usuario de esta inscripción
        # obj.course es el curso
        return LessonCompletion.objects.filter(
            user=obj.user,
            lesson__module__course=obj.course
        ).count()

# 7. Serializer de Completar Lección
class LessonCompletionSerializer(serializers.ModelSerializer):
    lesson_id = serializers.IntegerField(write_only=True)
    lesson = LessonSerializer(read_only=True)

    class Meta:
        model = LessonCompletion
        fields = ['id', 'user', 'lesson', 'date_completed', 'lesson_id']
        read_only_fields = ['user']

# ====================================================================
# 8. ACTUALIZADO: Serializer de Tarea (Assignment)
# ====================================================================
class AssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar las instrucciones de una Tarea.
    Ahora incluye los campos de fecha límite y edición.
    """
    class Meta:
        model = Assignment
        # ¡CAMPOS AÑADIDOS!
        fields = ['id', 'lesson', 'title', 'description', 'due_date', 'allow_edits']

# 9. Serializer de Entrega (Submission)
class SubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer para LEER y CREAR entregas.
    Ahora maneja 'file_submission'.
    """
    user = UserSerializer(read_only=True)
    assignment_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'assignment', 'user', 'content', 
            'status', 'submitted_at', 'assignment_id',
            'file_submission', 'file_name', 'file_size' # <-- ¡AÑADIDOS!
        ]
        read_only_fields = [
            'assignment', 'status', 'submitted_at', 
            'file_name', 'file_size' # El backend los asignará
        ]
        
        # Hacemos 'content' opcional
        extra_kwargs = {
            'content': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

# 10. Serializer de Nota (Grade)
class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['id', 'submission', 'score', 'comments', 'graded_at']

# ====================================================================
# 11. NUEVO: Serializer de Opción (Choice)
# ====================================================================
class ChoiceSerializer(serializers.ModelSerializer):
    """
    Muestra una opción de respuesta.
    ¡Importante! NO incluimos el campo 'is_correct'.
    """
    class Meta:
        model = Choice
        fields = ['id', 'text'] # Solo el ID y el texto

# ====================================================================
# 12. NUEVO: Serializer de Pregunta (Question)
# ====================================================================
class QuestionSerializer(serializers.ModelSerializer):
    """
    Muestra una pregunta, anidando sus opciones.
    """
    # 'choices' es el related_name que definimos en el modelo Choice
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'choices']

# ====================================================================
# 13. NUEVO: Serializer de Examen (Quiz)
# ====================================================================
class QuizSerializer(serializers.ModelSerializer):
    """
    Muestra el examen completo, anidando sus preguntas (y sus opciones).
    """
    # 'questions' es el related_name que definimos en el modelo Question
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        # Enviamos toda la info que el frontend necesita
        fields = ['id', 'module', 'title', 'due_date', 'max_attempts', 'questions']

# ====================================================================
# ACTUALIZADO: Serializer de Mensaje (para leer)
# ====================================================================
class MessageSerializer(serializers.ModelSerializer):
    """
    Muestra un mensaje, anidando la información del remitente.
    AHORA CONSTRUYE LA URL ABSOLUTA PARA LOS ARCHIVOS.
    """
    sender = UserSerializer(read_only=True) 
    
    # --- ¡INICIO DE LA CORRECCIÓN! ---
    
    # 1. Creamos un nuevo campo de solo lectura para la URL
    file_upload_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'message_type', 
            'content', 'language', 
            'file_upload_url',  # <-- 2. Usamos el nuevo campo
            'file_name',
            'file_size',
            'timestamp'
            # 'file_upload' (el campo original) ya no es necesario
        ]

    # 3. Añadimos la función que construye la URL
    def get_file_upload_url(self, obj):
        if obj.file_upload:
            request = self.context.get('request')
            if request:
                # Construye la URL completa (ej: http://.../media/...)
                return request.build_absolute_uri(obj.file_upload.url)
            
            # Fallback por si no hay request (ej: en un consumer)
            # Esto seguirá enviando la ruta relativa
            return obj.file_upload.url
        return None
# ====================================================================
# ACTUALIZADO: Serializer de Creación de Mensaje (para escribir)
# ====================================================================
class MessageCreateSerializer(serializers.ModelSerializer):
    """
    Usado solo para crear un nuevo mensaje.
    AHORA ACEPTA UN ARCHIVO y 'content' es opcional.
    """
    class Meta:
        model = Message
        fields = [
            'content', 
            'message_type', 
            'language', 
            'file_upload' # <-- ¡NUEVO! Acepta el archivo
        ]
        # Hacemos que 'content' y 'language' no sean requeridos,
        # ya que un mensaje puede ser solo una imagen.
        extra_kwargs = {
            'content': {'required': False, 'allow_null': True, 'allow_blank': True},
            'language': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

class SimpleMessageSerializer(serializers.ModelSerializer):
    """Serializer simple solo para el último mensaje"""
    class Meta:
        model = Message
        fields = ['content', 'timestamp']
# ====================================================================
# ACTUALIZADO: Serializer de Lista de Conversaciones (para el sidebar)
# ====================================================================
class ConversationListSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)

    # Leemos los campos anotados por la vista (agregados con annotate en views)
    unread_count = serializers.IntegerField(read_only=True)
    last_msg_content = serializers.CharField(read_only=True, default=None, required=False, allow_null=True)
    last_msg_type = serializers.CharField(read_only=True, default=None, required=False, allow_null=True)
    last_msg_file_name = serializers.CharField(read_only=True, default=None, required=False, allow_null=True)
    last_message_timestamp = serializers.DateTimeField(read_only=True, source='last_msg_timestamp', required=False, allow_null=True)

    # --- Campo calculado que React usa para mostrar el resumen del último mensaje ---
    last_message_snippet = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id',
            'name',
            'is_group',
            'participants',
            'unread_count',
            'last_msg_content',       # ✅ agregado
            'last_msg_type',          # ✅ agregado
            'last_msg_file_name',
            'last_message_timestamp',
            'last_message_snippet',   # ✅ lo mantenemos
        ]

    # --- Método que construye el snippet, igual que en React ---
    def get_last_message_snippet(self, obj):
        content = getattr(obj, 'last_msg_content', None)
        msg_type = getattr(obj, 'last_msg_type', 'TEXT')
        file_name = getattr(obj, 'last_msg_file_name', None)

        if content:
            return content

        if msg_type == 'CODE':
            return 'Código compartido'
        if msg_type == 'IMAGE':
            return 'Imagen'
        if msg_type == 'FILE':
            return file_name or 'Archivo'

        return "Sin mensajes"

    
# ====================================================================
# NUEVO: Serializer de Apuntes de Lección
# ====================================================================
class LessonNoteSerializer(serializers.ModelSerializer):
    """
    Serializer para leer, crear, y actualizar un apunte.
    El 'user' y 'lesson' se inyectarán desde la vista.
    """
    class Meta:
        model = LessonNote
        # Enviamos 'lesson' también para que el frontend pueda (opcionalmente) confirmar
        fields = ['id', 'lesson', 'content', 'is_completed', 'created_at']
        read_only_fields = ['lesson']

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['score', 'comments', 'graded_at']



class GradedItemSerializer(serializers.ModelSerializer):  
    """
    Serializer para una Tarea (Assignment).
    Muestra la entrega (Submission) y la nota (Grade) del usuario actual.
    """
    submission = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment # La base de nuestra lista son las Tareas
        fields = ['id', 'title', 'due_date', 'submission']

    def get_submission(self, obj):
        """
        Busca la entrega y nota solo para el usuario que hace la petición.
        """
        user = self.context['request'].user
        
        try:
            # Busca la entrega
            submission = Submission.objects.get(assignment=obj, user=user)
            
            # Prepara la data de la nota (si existe)
            grade_data = None
            if hasattr(submission, 'grade'):
                grade_data = GradeSerializer(submission.grade).data
                
            # Devuelve un objeto con todo
            return {
                'status': submission.status,
                'submitted_at': submission.submitted_at,
                'grade': grade_data # Esto será un objeto o None
            }
        except Submission.DoesNotExist:
            return None # El usuario no ha entregado esta tarea
        

class ReadReceiptSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = ReadReceipt
        fields = ['user', 'last_read_timestamp']


class StudentListSerializer(serializers.ModelSerializer):
    """
    Serializer simple para la lista de 'Participantes' del tutor.
    Muestra solo lo esencial + los puntos de experiencia.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'experience_points']















