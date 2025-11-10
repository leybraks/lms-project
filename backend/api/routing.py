# backend/api/routing.py
from django.urls import re_path
from . import consumers

# Esta lista define todas las URLs de WebSocket para tu 'api'
websocket_urlpatterns = [
    # Esta es la ruta para el chat de la lección
    # Coincide con /ws/chat/lesson/<un_numero>/
    re_path(
        r'^ws/chat/lesson/(?P<lesson_id>\d+)/$', 
        consumers.ChatConsumer.as_asgi()
    ),
    re_path(
        r'^ws/chat/conversation/(?P<conversation_id>\d+)/$', 
        consumers.InboxConsumer.as_asgi() # <-- Usará un nuevo Consumidor
    ),
    # (En el futuro, aquí pondríamos más rutas, como la de gamificación)
]