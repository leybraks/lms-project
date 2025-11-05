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
)

# 1. Serializer de Usuario (Básico)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

# 2. Serializer de Lección (El más interno)
class LessonSerializer(serializers.ModelSerializer):
    module_id = serializers.ReadOnlyField(source='module.id')
    course_id = serializers.ReadOnlyField(source='module.course.id')
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'order', 'content', 'video_url', 
            'module_id', 'course_id'
        ]
# 3. Serializer de Módulo (Anida Lecciones)
class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    quiz = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'lessons','quiz']

# 4. Serializer de Curso (Para la lista)
class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'created_at']

# 5. Serializer de Detalle de Curso (Anida Módulos)
class CourseDetailSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'created_at', 'modules']

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
    assignment_id = serializers.IntegerField(write_only=True)
    user = UserSerializer(read_only=True) 

    class Meta:
        model = Submission
        fields = [
            'id', 'assignment', 'user', 'content', 
            'status', 'submitted_at', 'assignment_id'
        ]
        read_only_fields = ['assignment', 'status', 'submitted_at']

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