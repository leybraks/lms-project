# backend/api/views.py
from rest_framework import viewsets
from .models import Course
from .serializers import CourseSerializer

class CourseViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver o editar cursos.
    """
    queryset = Course.objects.all().order_by('-created_at')
    serializer_class = CourseSerializer