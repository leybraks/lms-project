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
    Grade
)

# 1. Serializer de Usuario (Básico)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

# 2. Serializer de Lección (El más interno)
class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'content', 'video_url']

# 3. Serializer de Módulo (Anida Lecciones)
class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'lessons']

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
    # Anidar el objeto curso para dar más contexto
    course = CourseSerializer(read_only=True) 

    class Meta:
        model = Enrollment
        fields = ['id', 'user', 'course', 'date_enrolled', 'completed', 'course_id']
        read_only_fields = ['user']

# 7. Serializer de Completar Lección
class LessonCompletionSerializer(serializers.ModelSerializer):
    lesson_id = serializers.IntegerField(write_only=True)
    # Anidar la lección para más contexto
    lesson = LessonSerializer(read_only=True)

    class Meta:
        model = LessonCompletion
        fields = ['id', 'user', 'lesson', 'date_completed', 'lesson_id']
        read_only_fields = ['user']

# 8. Serializer de Tarea (Assignment)
class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'lesson', 'title', 'description']

# 9. Serializer de Entrega (Submission)
class SubmissionSerializer(serializers.ModelSerializer):
    assignment_id = serializers.IntegerField(write_only=True)
    # Anidar el usuario para ver quién lo entregó
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