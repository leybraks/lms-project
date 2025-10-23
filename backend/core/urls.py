# backend/core/urls.py
from django.contrib import admin
from django.urls import path, include  # <-- Asegúrate de importar 'include'

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Añade esta línea:
    # Conecta las URLs de nuestra 'api' bajo la ruta 'api/'
    path('api/', include('api.urls')), 
]