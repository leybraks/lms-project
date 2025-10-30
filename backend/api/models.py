from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

# 1. Modelo de Usuario
class User(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Alumno'),
        ('PROFESSOR', 'Profesor'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    # Nota: 'default' es importante. Puedes cambiarlo si prefieres.

# 2. Modelo de Curso
class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    professor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses_taught')
    aforo_max = models.PositiveIntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=False)

    def __str__(self):
        return self.title

# 3. Modelo de Inscripción
class Enrollment(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pendiente de Pago'),
        ('COMPLETED', 'Completado'),
    )
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')

    class Meta:
        unique_together = ('student', 'course') # Evita inscripciones duplicadas

    def __str__(self):
        return f"{self.student.username} en {self.course.title}"

# 4. Modelo de Tarea
class Task(models.Model):
    TASK_TYPES = (
        ('FILE_UPLOAD', 'Subir Archivo'),
        ('CODE_CHALLENGE', 'Reto de Código'),
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(help_text="Instrucciones para la tarea")
    due_date = models.DateTimeField()
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
    template_code = models.TextField(blank=True, null=True, help_text="Código de inicio para el alumno")
    test_cases = models.JSONField(blank=True, null=True, help_text="Tests para el autograder")

    def __str__(self):
        return self.title

# 5. Modelo de Entrega
class Submission(models.Model):
    STATUS_AUTOGRADER = (
        ('PENDING', 'Pendiente'),
        ('GRADING', 'Calificando'),
        ('PASSED', 'Aprobado'),
        ('FAILED', 'Fallido'),
    )
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    submitted_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='submissions/files/', blank=True, null=True) 
    code = models.TextField(blank=True, null=True) 
    autograder_status = models.CharField(max_length=10, choices=STATUS_AUTOGRADER, default='PENDING')
    autograder_output = models.TextField(blank=True, null=True, help_text="Salida de la consola del autograder")

# 6. Modelo de Nota
class Grade(models.Model):
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name='grade')
    score = models.DecimalField(max_digits=5, decimal_places=2) 
    comments = models.TextField(blank=True, null=True)
    graded_at = models.DateTimeField(auto_now=True)

class Enrollment(models.Model):
    """Modelo para registrar la inscripción de un usuario a un curso."""
    
    # Usuario inscrito (relación con el modelo de usuario)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    
    # Curso al que se inscribe
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    
    # Fecha de inscripción
    date_enrolled = models.DateTimeField(auto_now_add=True)
    
    # Campo opcional: progreso o estado
    completed = models.BooleanField(default=False)

    class Meta:
        # Esto asegura que un usuario solo pueda inscribirse UNA vez al mismo curso
        unique_together = ('user', 'course')
        verbose_name = 'Inscripción'
        verbose_name_plural = 'Inscripciones'

    def __str__(self):
        return f'{self.user.username} inscrito en {self.course.title}'

# ====================================================================
# 1. NUEVO MODELO: MÓDULO (El contenedor de lecciones)
# ====================================================================
class Module(models.Model):
    """
    Un Módulo o "sección" de un curso. 
    Ej: "Semana 1", "Introducción", "Proyecto Final".
    """
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE, 
        related_name='modules' # Permite a un Curso encontrar sus Módulos
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    # 'order' nos permite definir el orden (Módulo 1, Módulo 2, etc.)
    order = models.PositiveIntegerField(default=0) 

    class Meta:
        ordering = ['order'] # Ordena los módulos por el campo 'order'

    def __str__(self):
        return f'{self.course.title} - Módulo {self.order}: {self.title}'


# ====================================================================
# 2. NUEVO MODELO: LECCIÓN (El contenido en sí)
# ====================================================================
class Lesson(models.Model):
    """
    Una Lección individual dentro de un Módulo.
    Ej: "Video: Variables", "Lectura: Loops".
    """
    module = models.ForeignKey(
        Module, 
        on_delete=models.CASCADE, 
        related_name='lessons' # Permite a un Módulo encontrar sus Lecciones
    )
    title = models.CharField(max_length=200)
    # 'order' para el orden de las lecciones dentro del módulo
    order = models.PositiveIntegerField(default=0) 
    
    # El contenido real (puedes expandir esto)
    # Por ahora, un simple campo de texto.
    content = models.TextField(blank=True)
    
    # Podrías añadir un campo para URL de video (Vimeo, YouTube)
    video_url = models.URLField(blank=True, null=True)

    class Meta:
        ordering = ['order'] # Ordena las lecciones

    def __str__(self):
        return f'{self.module.title} - Lección {self.order}: {self.title}'
    
# ====================================================================
# NUEVO MODELO: PROGRESO (Lección Completada)
# ====================================================================
class LessonCompletion(models.Model):
    """
    Registra cuándo un usuario completa una lección específica.
    """
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
        # Asegura que un usuario solo pueda completar una lección UNA vez
        unique_together = ('user', 'lesson')
        verbose_name = 'Lección Completada'
        verbose_name_plural = 'Lecciones Completadas'

    def __str__(self):
        return f'{self.user.username} completó {self.lesson.title}'