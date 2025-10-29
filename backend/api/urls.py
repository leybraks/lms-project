# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, get_me_view

# --- 1. IMPORTA LAS VISTAS DE JWT ---
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')

# Modifica tus urlpatterns
urlpatterns = [
    # Rutas que ya teníamos (para los cursos)
    path('', include(router.urls)),
    
    # --- 2. AÑADE ESTAS DOS NUEVAS RUTAS ---
    # Esta es la ruta de "login":
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Esta ruta sirve para "refrescar" un token expirado:
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', get_me_view, name='get_me'),
]