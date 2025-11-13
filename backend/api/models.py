from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.utils import timezone

# ====================================================================
# 1. Modelo de Usuario
# ====================================================================
class User(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Alumno'),
        ('PROFESSOR', 'Profesor'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    title = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Ej: Desarrollador Full-Stack & Experto en IA"
    )
    experience_points = models.IntegerField(default=0, help_text="XP para la mascota")
    bio = models.TextField(blank=True, null=True, help_text="Biografía del instructor")
    profile_image = models.ImageField(
        upload_to='profile_pics/', 
        null=True, 
        blank=True
    )
    # Nota: Asegúrate de tener 'api.User' en tu settings.AUTH_USER_MODEL

# ====================================================================
# 2. Modelo de Curso
# ====================================================================
class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    professor = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Usar settings.AUTH_USER_MODEL es más flexible
        on_delete=models.CASCADE, 
        related_name='courses_taught'
    )
    aforo_max = models.PositiveIntegerField(default=50) # (Lo mantuve de tu modelo original)
    created_at = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=False)
    main_image_url = models.URLField(
        blank=True, 
        null=True, 
        help_text="URL de la imagen de portada (ej: Unsplash)"
    )
    estimated_duration = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        help_text="Ej: Aprox. 3h 30m"
    )

    def __str__(self):
        return self.title
    

# ====================================================================
# 3. Modelo de Inscripción (Enrollment) - (Versión Limpia)
# ====================================================================
class Enrollment(models.Model):
    """Modelo para registrar la inscripción de un usuario a un curso."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    date_enrolled = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'course')
        verbose_name = 'Inscripción'
        verbose_name_plural = 'Inscripciones'

    def __str__(self):
        return f'{self.user.username} inscrito en {self.course.title}'

# ====================================================================
# 4. Modelo de Módulo (Module)
# ====================================================================
class Module(models.Model):
    """Un Módulo o "sección" de un curso."""
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE, 
        related_name='modules'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0) 

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.course.title} - Módulo {self.order}: {self.title}'

# ====================================================================
# 5. Modelo de Lección (Lesson)
# ====================================================================
class Lesson(models.Model):
    module = models.ForeignKey(
        Module, 
        on_delete=models.CASCADE, 
        related_name='lessons'
    )
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0) 
    content = models.TextField(blank=True)
    video_url = models.URLField(blank=True, null=True)
    live_session_room = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Nombre de la sala para la clase en vivo"
    )
    
    # --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    # Usamos 'Conversation' (como string) porque el modelo
    # Conversation se define MÁS ADELANTE en este mismo archivo.
    chat_conversation = models.OneToOneField(
        'Conversation', # <-- ¡ARREGLADO!
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lesson_chat'
    )

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.module.title} - Lección {self.order}: {self.title}'
# ====================================================================
# 6. Modelo de Progreso (LessonCompletion)
# ====================================================================
class LessonCompletion(models.Model):
    """Registra cuándo un usuario completa una lección específica."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lesson_completions'
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='completions'
    )
    date_completed = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'lesson')
        verbose_name = 'Lección Completada'
        verbose_name_plural = 'Lecciones Completadas'

    def __str__(self):
        return f'{self.user.username} completó {self.lesson.title}'
    
# ====================================================================
# 7. Modelo de Tarea (Assignment)
# ====================================================================
class Assignment(models.Model):
    """Una Tarea o "Asignación" asociada a una Lección específica."""
    lesson = models.OneToOneField(
        Lesson,
        on_delete=models.CASCADE,
        related_name='assignment'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(
        help_text="Las instrucciones para la tarea."
    )
    # Feature 3: Límite de tiempo
    due_date = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Fecha y hora límite de entrega."
    )
    
    # Feature 4: Permitir edición
    allow_edits = models.BooleanField(
        default=True,
        help_text="Permitir al alumno editar la entrega después de enviarla."
    )
    def __str__(self):
        return f'Tarea para la lección: {self.lesson.title}'

# ====================================================================
# 8. Modelo de Entrega (Submission) - (Versión Limpia)
# ====================================================================
class Submission(models.Model):
    """
    La respuesta de un Estudiante a una Tarea (Assignment).
    AHORA SOPORTA SUBIDA DE ARCHIVOS.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('SUBMITTED', 'Entregado'),
        ('GRADED', 'Calificado'),
    ]

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    
    # --- ¡CAMBIOS AQUÍ! ---
    content = models.TextField(
        blank=True, 
        null=True, 
        help_text="Respuesta de texto (opcional si se envía un archivo)"
    )
    
    # --- ¡NUEVOS CAMPOS! ---
    file_submission = models.FileField(
        upload_to='submissions/', # Se guardará en /media/submissions/
        blank=True,
        null=True
    )
    file_name = models.CharField(max_length=255, blank=True, null=True)
    file_size = models.BigIntegerField(blank=True, null=True)
    # --- FIN DE CAMBIOS ---
    
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('assignment', 'user')

    def __str__(self):
        return f'Entrega de {self.user.username} para {self.assignment.title}'

# ====================================================================
# 9. Modelo de Nota (Grade) - (Versión Limpia y Corregida)
# ====================================================================
class Grade(models.Model):
    """
    La calificación y feedback para una Entrega (Submission).
    Definido DESPUÉS de Submission para evitar errores.
    """
    submission = models.OneToOneField(
        Submission, # <-- Ahora se enlaza al modelo 'Submission' correcto
        on_delete=models.CASCADE, 
        related_name='grade'
    )
    score = models.DecimalField(max_digits=5, decimal_places=2) 
    comments = models.TextField(blank=True, null=True, help_text="Comentarios del profesor")
    graded_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Nota: {self.score} para {self.submission}'
    
# ====================================================================
# 10. NUEVO MODELO: Examen (Quiz)
# ====================================================================
class Quiz(models.Model):
    """
    Un examen o "Quiz" asociado a un Módulo.
    """
    module = models.OneToOneField(
        Module,
        on_delete=models.CASCADE,
        related_name='quiz' # Permite a Module encontrar su Examen
    )
    title = models.CharField(max_length=200)
    due_date = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Fecha y hora límite de entrega."
    )
    # Feature 7: Límite de intentos (configurable por el profesor)
    max_attempts = models.PositiveIntegerField(
        default=3,
        help_text="Máximo de intentos permitidos (3 por defecto)."
    )

    def __str__(self):
        return f'Examen del {self.module.title}'

# ====================================================================
# 11. NUEVO MODELO: Pregunta (Question)
# ====================================================================
class Question(models.Model):
    """
    Una pregunta individual dentro de un Quiz.
    """
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions' # Permite a Quiz encontrar sus Preguntas
    )
    text = models.TextField(help_text="El enunciado de la pregunta")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'Pregunta {self.order}: {self.text[:50]}...'

# ====================================================================
# 12. NUEVO MODELO: Opción (Choice)
# ====================================================================
class Choice(models.Model):
    """
    Una opción de respuesta para una Pregunta (si es de opción múltiple).
    """
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='choices' # Permite a Question encontrar sus Opciones
    )
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(
        default=False,
        help_text="Marcar si esta es la respuesta correcta."
    )

    def __str__(self):
        return f'Opción para Pregunta {self.question.id}: {self.text}'

# ====================================================================
# 13. NUEVO MODELO: Intento de Examen (QuizAttempt)
# ====================================================================
class QuizAttempt(models.Model):
    """
    Un registro del intento de un usuario en un examen.
    """
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quiz_attempts'
    )
    score = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Puntaje obtenido (ej: 85.50)"
    )
    attempt_number = models.PositiveIntegerField()
    date_taken = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Un usuario tiene un número de intento único por examen
        unique_together = ('quiz', 'user', 'attempt_number')
        ordering = ['-date_taken'] # El más reciente primero

    def __str__(self):
        return f'Intento {self.attempt_number} de {self.user.username} en {self.quiz.title}'
    
# ====================================================================
# 14. NUEVO MODELO: Recurso (Resource)
# ====================================================================
class Resource(models.Model):
    """
    Un archivo descargable para una lección (PDF, ZIP, etc.).
    """
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='resources' # Permite a Lesson encontrar sus Recursos
    )
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='lesson_resources/')

    def __str__(self):
        return f'Recurso "{self.title}" para {self.lesson.title}'
    

# ====================================================================
# 14. NUEVO: Objetivos de Aprendizaje ("Qué aprenderás")
# ====================================================================
class LearningObjective(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='learning_objectives')
    description = models.CharField(max_length=255)

    def __str__(self):
        return self.description

# ====================================================================
# 15. NUEVO: Requisitos del Curso
# ====================================================================
class Requirement(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='requirements')
    description = models.CharField(max_length=255)

    def __str__(self):
        return self.description

# ====================================================================
# 16. NUEVO: Beneficios del Curso ("Este curso incluye")
# ====================================================================
class CourseBenefit(models.Model):
    ICON_CHOICES = (
        ('video', 'Video'),
        ('article', 'Artículo'),
        ('access', 'Acceso'),
        ('task', 'Tarea'),
        ('certificate', 'Certificado'),
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='benefits')
    description = models.CharField(max_length=255)
    # (Opcional, pero genial para el diseño)
    icon = models.CharField(max_length=20, choices=ICON_CHOICES, default='article') 

    def __str__(self):
        return self.description
    
# ====================================================================
# 17. NUEVO: Conversación (Inbox)
# ====================================================================
class Conversation(models.Model):
    """
    Representa un hilo de chat.
    Si es un grupo, AHORA se vincula a un Curso.
    """
    # --- ¡CAMPO NUEVO! ---
    course = models.ForeignKey(
        Course, 
        on_delete=models.SET_NULL, 
        related_name='chat_group', 
        null=True, 
        blank=True, 
        help_text="El curso al que este grupo pertenece, si es un grupo."
    )
    
    name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Nombre del grupo (ej: 'Curso: Python Básico')"
    )
    is_group = models.BooleanField(default=False)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations'
    )
    

    def __str__(self):
        if self.is_group and self.name:
            return f"Grupo: {self.name}"
        return f"Conversación {self.id}"
    
    created_at = models.DateTimeField(auto_now_add=True)

    last_message = models.ForeignKey(
        'Message',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='last_message_for'
    )
    def get_last_message(self):
        return self.messages.order_by('-timestamp').first()
    def get_last_message_snippet(self, obj):
        last_message = getattr(obj, 'last_msg_content', None)
        if not last_message:
            msg = obj.get_last_message()
            return msg.content if msg else "Sin mensajes"
        return last_message


# ====================================================================
# 18. NUEVO: Mensaje (Inbox)
# ====================================================================
class Message(models.Model):
    """
    Un único mensaje dentro de una Conversación.
    Soporta 'TEXT', 'CODE', 'IMAGE' y 'FILE'.
    """
    MESSAGE_TYPE_CHOICES = (
        ('TEXT', 'Texto'),
        ('CODE', 'Código'),
        ('IMAGE', 'Imagen'), # <-- ¡NUEVO!
        ('FILE', 'Archivo'),   # <-- ¡NUEVO! (Para PDFs, ZIPs, etc.)
    )
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    
    message_type = models.CharField(
        max_length=10, 
        choices=MESSAGE_TYPE_CHOICES, 
        default='TEXT'
    )
    
    # --- ¡CAMBIO! ---
    # El contenido ahora es opcional, ya que el mensaje puede ser solo un archivo.
    content = models.TextField(blank=True, null=True)
    
    language = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        help_text="Ej: python (usado si el tipo es 'CODE')"
    )
    
    # --- ¡NUEVO CAMPO! ---
    # Aquí es donde guardaremos la URL al archivo (imagen, video, pdf, etc.)
    file_upload = models.FileField(
        upload_to='chat_files/', # Los archivos se guardarán en /media/chat_files/
        blank=True, 
        null=True
    )
    file_name = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        help_text="Nombre original del archivo"
    )
    file_size = models.BigIntegerField(
        blank=True, 
        null=True, 
        help_text="Tamaño del archivo en bytes"
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp'] 

    def __str__(self):
        return f"Mensaje de {self.sender.username} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"
    

# ====================================================================
# 19. NUEVO: Apuntes de Lección (Para el "Bloc de Notas")
# ====================================================================
class LessonNote(models.Model):
    """
    Un único apunte o "nota" que un usuario toma para una lección específica.
    """
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_notes')
    content = models.TextField()
    is_completed = models.BooleanField(default=False, help_text="Para usarlo como 'lista de tareas'")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at'] # Las notas más nuevas al final

    def __str__(self):
        return f"Nota de {self.user.username} en {self.lesson.title}"
    
class ReadReceipt(models.Model):
    """
    Rastrea la última vez que un usuario leyó una conversación.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='read_receipts')
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='read_receipts')
    last_read_timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        # Una entrada por usuario y conversación
        unique_together = ('user', 'conversation')

    def __str__(self):
        return f"{self.user.username} leyó {self.conversation.name}"