import jwt # <-- Importar la librería JWT
from django.conf import settings # <-- Importar settings para la SECRET_KEY
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.db import close_old_connections
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

User = get_user_model() # Obtener tu modelo de usuario (api.User)

@database_sync_to_async
def get_user_from_token(token_key):
    """
    Decodifica un token de acceso JWT y busca al usuario.
    """
    try:
        # Decodifica el token usando la SECRET_KEY del proyecto
        payload = jwt.decode(
            token_key, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )
        
        # SimpleJWT guarda el ID de usuario en el 'payload' bajo 'user_id'
        user_id = payload.get('user_id')
        
        if user_id is None:
            return AnonymousUser()
            
        # Busca al usuario en la base de datos
        return User.objects.get(id=user_id)
        
    except (ExpiredSignatureError, InvalidTokenError, User.DoesNotExist, jwt.DecodeError):
        # Si el token expiró, es inválido o el usuario no existe
        return AnonymousUser()
    except Exception as e:
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    """
    Middleware de autenticación por Token (JWT) para Django Channels.
    Leerá el token de la URL, ej: /ws/chat/?token=abc123...
    """
    async def __call__(self, scope, receive, send):
        close_old_connections()
        
        try:
            # Obtiene el token de los query params
            query_string = scope['query_string'].decode()
            params = dict(qp.split('=') for qp in query_string.split('&'))
            token_key = params.get('token')
            
            if token_key:
                # Si hay token, busca al usuario (¡usando la nueva función!)
                scope['user'] = await get_user_from_token(token_key)
            else:
                # Si no hay token, es anónimo
                scope['user'] = AnonymousUser()
        except Exception as e:
            scope['user'] = AnonymousUser()
            
        # Continúa con la conexión
        return await super().__call__(scope, receive, send)

def TokenAuthMiddlewareStack(inner):
    """
    Helper para construir el stack de middleware (lo usaremos en asgi.py)
    """
    return TokenAuthMiddleware(inner)