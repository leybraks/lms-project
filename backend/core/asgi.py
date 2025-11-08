# backend/core/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# 1. Pon esta línea PRIMERO.
# Le dice a Django dónde encontrar tu settings.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# 2. Llama a get_asgi_application() INMEDIATAMENTE DESPUÉS.
# Esta es la función que ejecuta django.setup() y carga tus settings.
django_asgi_app = get_asgi_application()

# 3. ¡AHORA es seguro importar tus módulos!
# Mueve esta importación de la parte de arriba para acá.
import api.routing 

# 4. El resto de tu configuración (sin cambios)
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})