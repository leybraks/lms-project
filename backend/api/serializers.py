# backend/api/serializers.py
from rest_framework import serializers
from .models import Course, Task, User

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
    # 'tasks' es el 'related_name' que definimos en el modelo Task
    # Le decimos que use el TaskSerializer para cada tarea
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        # Incluimos los campos de antes Y el nuevo campo 'tasks'
        fields = ['id', 'title', 'description', 'professor', 'aforo_max', 'tasks']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']