# backend/api/views.py
from rest_framework import viewsets
from .models import Course
from .serializers import CourseSerializer, CourseDetailSerializer, UserSerializer
from rest_framework.permissions import IsAuthenticated

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
class CourseViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver o editar cursos.
    """
    queryset = Course.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    def get_serializer_class(self):
        # Si la acción es 'retrieve' (pedir un detalle)...
        if self.action == 'retrieve':
            # ... usa el serializer de detalle
            return CourseDetailSerializer
        return CourseSerializer

@api_view(['GET']) # Esta vista solo responde a peticiones GET
@permission_classes([IsAuthenticated]) # Solo usuarios logueados pueden verla
def get_me_view(request):
    """
    Devuelve los datos del usuario que está actualmente autenticado.
    """
    # 'request.user' es el objeto del usuario que Django obtiene
    # automáticamente a partir del Token JWT
    user = request.user
    
    # Usamos el serializer que acabamos de crear
    serializer = UserSerializer(user)
    
    # Devolvemos el JSON
    return Response(serializer.data)