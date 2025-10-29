# backend/api/serializers.py
from rest_framework import serializers
from .models import Course, Task, User, Enrollment,Module, Lesson


# ====================================================================
# 1. NUEVO: Serializer para Lecciones (El más interno)
# ====================================================================
class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'content', 'video_url']


# ====================================================================
# 2. NUEVO: Serializer para Módulos (Que anida Lecciones)
# ====================================================================
class ModuleSerializer(serializers.ModelSerializer):
    # 'lessons' es el 'related_name' que definimos en el modelo Lesson
    # Esto anidará la lista de lecciones dentro de cada módulo
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'lessons']


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        # Define los campos del modelo que quieres exponer en la API
        fields = ['id', 'title', 'description', 'professor', 'aforo_max']

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        # Define los campos que quieres mostrar para cada tarea
        fields = ['id', 'title', 'description', 'due_date', 'task_type']

class CourseDetailSerializer(serializers.ModelSerializer):
    # 'modules' es el 'related_name' que definimos en el modelo Module
    # Esto anidará la lista de módulos (que a su vez anidan lecciones)
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        # Incluimos 'modules' en los campos que devuelve la API
        fields = ['id', 'title', 'description', 'created_at', 'modules']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer para la creación y visualización de inscripciones."""
    
    # Solo necesitamos enviar el ID del curso al inscribirse
    course_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Enrollment
        # Los campos que se mostrarán al usuario
        fields = ['id', 'user', 'course', 'date_enrolled', 'completed', 'course_id']
        # Hacemos que 'user' y 'course' sean de solo lectura (read_only)
        # ya que los estableceremos en la vista
        read_only_fields = ['user', 'course']