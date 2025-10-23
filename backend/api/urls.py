# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet

# Crea un router
router = DefaultRouter()
# Registra nuestro ViewSet con el router
router.register(r'courses', CourseViewSet, basename='course')

# Las URLs de la API son determinadas automáticamente por el router
urlpatterns = [
    path('', include(router.urls)),
]