from django.contrib.auth.models import AbstractUser
from django.db import models

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