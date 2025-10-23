# backend/api/serializers.py
from rest_framework import serializers
from .models import Course

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        # Define los campos del modelo que quieres exponer en la API
        fields = ['id', 'title', 'description', 'professor', 'aforo_max']