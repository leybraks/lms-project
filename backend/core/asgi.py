# backend/core/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

# 1. Poner esto PRIMERO
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# 2. Inicializar Django
django_asgi_app = get_asgi_application()

# 3. IMPORTAR DESPUÉS de inicializar Django
import api.routing 
from api.middleware import TokenAuthMiddlewareStack # <-- ¡IMPORTA EL NUEVO!

# 4. Configurar el router
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    
    # --- ¡CAMBIO AQUÍ! ---
    # Reemplaza AuthMiddlewareStack por tu TokenAuthMiddlewareStack
    "websocket": TokenAuthMiddlewareStack(
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})