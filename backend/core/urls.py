# core/urls.py

from django.contrib import admin
from django.urls import path, include, re_path # <-- ¡ASEGÚRATE QUE 'include' ESTÉ AQUÍ!
from allauth.account.views import ConfirmEmailView 
from django.conf import settings # <-- ¡IMPORTA ESTO!
from django.conf.urls.static import static
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # --- Rutas de Auth (esto ya lo tienes bien) ---
    path('api/auth/', include('dj_rest_auth.urls')),
    re_path(
        r'^api/auth/registration/account-confirm-email/(?P<key>[-:\w]+)/$', 
        ConfirmEmailView.as_view(),
        name='account_confirm_email'
    ),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # --- ¡ESTA ES LA LÍNEA QUE DEBES AÑADIR/DESCOMENTAR! ---
    # Esto le dice a Django que busque MÁS rutas en tu app 'api'
    path('api/', include('api.urls')), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)