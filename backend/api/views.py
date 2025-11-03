# backend/api/views.py

from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .permissions import IsEnrolledPermission

from django.shortcuts import get_object_or_404

# Imports de Modelos y Serializers de tu app
from .models import Course, Enrollment, Lesson, LessonCompletion, Assignment, Submission
from .serializers import CourseSerializer, CourseDetailSerializer, UserSerializer, EnrollmentSerializer, LessonSerializer, LessonCompletionSerializer, AssignmentSerializer, SubmissionSerializer

# ====================================================================
# 1. Vistas de Cursos
# ====================================================================

class CourseViewSet(viewsets.ModelViewSet):
    """
    API endpoint para administración de cursos (CRUD).
    Usado típicamente en rutas de admin o si usas routers.
    """
    queryset = Course.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
class ListaDeCursosView(generics.ListAPIView):
    """
    Devuelve una lista de todos los cursos (Usado en el Home Page del frontend).
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

class DetalleDeCursoView(generics.RetrieveAPIView):
    """
    Devuelve el detalle de un curso específico.
    """
    queryset = Course.objects.all()
    serializer_class = CourseDetailSerializer
    permission_classes = [IsAuthenticated]

# ====================================================================
# 2. Vistas de Autenticación/Usuario
# ====================================================================

@api_view(['GET']) 
@permission_classes([IsAuthenticated]) 
def get_me_view(request):
    """
    Devuelve los datos del usuario autenticado (Usado en AuthContext para validar token).
    """
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)

# ====================================================================
# 3. Vistas de Inscripción (Enrollment)
# ====================================================================

class EnrollmentCreateView(generics.CreateAPIView):
    """
    Permite a un usuario autenticado inscribirse en un curso.
    """
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    # Sobrescribimos 'create' para añadir nuestra lógica personalizada
    def create(self, request, *args, **kwargs):
        
        # 1. Validar que 'course_id' fue enviado
        course_id = request.data.get('course_id')
        if not course_id:
            return Response(
                {"detail": "Se requiere el 'course_id'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Obtener los objetos (el usuario viene del token)
        course = get_object_or_404(Course, id=course_id)
        user = request.user

        # 3. Verificar si el usuario ya está inscrito (409 Conflict)
        if Enrollment.objects.filter(user=user, course=course).exists():
            return Response(
                {"detail": "Ya estás inscrito en este curso."},
                status=status.HTTP_409_CONFLICT
            )

        # 4. Validar los datos del request (aunque solo usamos course_id)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 5. ¡LA SOLUCIÓN!
        # Inyectamos el 'user' y el 'course' (que son read_only)
        # directamente en el método .save().
        serializer.save(user=user, course=course)

        # 6. Respuesta de éxito
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )

class MyEnrollmentListView(generics.ListAPIView):
    """
    Muestra todos los cursos en los que el usuario logueado está inscrito (Usado para verificación).
    """
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtra las inscripciones por el usuario que hace la solicitud
        return Enrollment.objects.filter(user=self.request.user).select_related('course')
    
class LessonDetailView(generics.RetrieveAPIView):
    """
    Devuelve el detalle de una lección específica.
    Ahora SÓLO si el usuario está inscrito en el curso.
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    # ¡APLICAMOS EL NUEVO PERMISO!
    # El usuario debe estar autenticado Y TAMBIÉN inscrito
    permission_classes = [IsAuthenticated]


    # ====================================================================
# NUEVA VISTA: Marcar Lección como Completada
# ====================================================================
class LessonCompleteView(generics.CreateAPIView):
    """
    Permite a un usuario autenticado marcar una lección como completada.
    """
    queryset = LessonCompletion.objects.all()
    serializer_class = LessonCompletionSerializer
    permission_classes = [IsAuthenticated] # Solo usuarios logueados

    def create(self, request, *args, **kwargs):
        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            return Response(
                {"detail": "Se requiere el 'lesson_id'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lesson = get_object_or_404(Lesson, id=lesson_id)
        user = request.user

        # TODO: Verificar si el usuario está inscrito en el curso
        # (Usando el IsEnrolledPermission que ya creamos)

        # Verificar si ya la completó
        if LessonCompletion.objects.filter(user=user, lesson=lesson).exists():
            return Response(
                {"detail": "Ya has completado esta lección."},
                status=status.HTTP_409_CONFLICT
            )
        
        # Guardar la finalización
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Inyectamos el usuario y la lección (que son read_only)
        serializer.save(user=user, lesson=lesson) 

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
# ====================================================================
# NUEVA VISTA: Mis Lecciones Completadas
# ====================================================================
class MyLessonCompletionsListView(generics.ListAPIView):
    """
    Muestra todas las lecciones que el usuario logueado ha completado.
    """
    serializer_class = LessonCompletionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtra las lecciones completadas por el usuario que realiza la solicitud
        return LessonCompletion.objects.filter(user=self.request.user)
    
# ====================================================================
# NUEVA VISTA: Detalle de Tarea (por Lección)
# ====================================================================
class AssignmentDetailView(generics.RetrieveAPIView):
    """
    Devuelve la Tarea asociada a un ID de Lección.
    Usamos 'lesson__id' para buscar la tarea a través de la lección.
    """
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated] # TODO: Deberíamos usar IsEnrolledPermission
    lookup_field = 'lesson_id' # Le decimos que busque por 'lesson_id'
    lookup_url_kwarg = 'lesson_id' # El nombre del parámetro en la URL

# ====================================================================
# NUEVA VISTA: Crear/Actualizar una Entrega (Submission)
# ====================================================================
class SubmissionCreateUpdateView(generics.CreateAPIView):
    """
    Permite a un usuario crear (POST) una entrega para una Tarea.
    """
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        assignment_id = request.data.get('assignment_id')
        content = request.data.get('content')
        
        if not assignment_id or not content:
            return Response(
                {"detail": "Se requiere 'assignment_id' y 'content'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        assignment = get_object_or_404(Assignment, id=assignment_id)
        user = request.user

        # TODO: Verificar si el usuario está inscrito en el curso de esta tarea

        # Buscar si ya existe una entrega (para actualizarla en lugar de crear una nueva)
        submission, created = Submission.objects.update_or_create(
            user=user, 
            assignment=assignment,
            defaults={'content': content, 'status': 'SUBMITTED'}
        )
        
        serializer = self.get_serializer(submission)
        
        if created:
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.data, status=status.HTTP_200_OK)