"""
Django settings for core project.
Optimizado para despliegue en Railway/Render + Desarrollo Local.
"""

from pathlib import Path
import os
import dj_database_url # <--- ¡NECESARIO! (pip install dj-database-url)
from datetime import timedelta
from dotenv import load_dotenv

# Cargar variables de entorno desde .env (si existe, para local)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ==============================================================================
# 1. SEGURIDAD Y ENTORNO
# ==============================================================================

# Si estamos en producción (Railway), usamos la variable secreta. Si no, la de desarrollo.
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-local-key-dev-only')

# DEBUG debe ser False en producción. 
# Railway no suele setear 'DEBUG', así que asumimos False si no está explícito.
# En tu .env local pon DEBUG=True
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Permitir todos los hosts en producción (Railway asigna dominios dinámicos)
ALLOWED_HOSTS = ['*']


# ==============================================================================
# 2. APLICACIONES
# ==============================================================================

INSTALLED_APPS = [
    'daphne', # <--- Debe ser el primero para ASGI
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Apps de terceros
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    
    # Tus apps
    'api.apps.ApiConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # <--- ¡CRÍTICO PARA STATIC FILES EN PROD!
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # <--- CORS antes de Common
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Importante para WebSockets en Producción
ASGI_APPLICATION = 'core.asgi.application'
WSGI_APPLICATION = 'core.wsgi.application'


# ==============================================================================
# 3. BASE DE DATOS (Automática)
# ==============================================================================

# En local usa SQLite. En producción, Railway inyecta DATABASE_URL automáticamente.
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600
    )
}


# ==============================================================================
# 4. AUTENTICACIÓN Y PASSWORD
# ==============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTH_USER_MODEL = 'api.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_HTTPONLY': False,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Configuración AllAuth
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]
SITE_ID = 1
ACCOUNT_AUTHENTICATION_METHOD = 'username_email' # Permite ambos
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'optional' # Para evitar problemas en la demo
LOGIN_REDIRECT_URL = '/'
ACCOUNT_LOGOUT_ON_GET = True
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# ==============================================================================
# 5. CORS (Permitir Frontend)
# ==============================================================================

# En producción, pon aquí la URL de tu Vercel (ej: https://mi-lms.vercel.app)
# Para facilitar la demo, permitimos todo por ahora.
CORS_ALLOW_ALL_ORIGINS = True 
CORS_ALLOW_CREDENTIALS = True

# Si quieres ser estricto en producción, descomenta esto y comenta la línea de arriba:
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:5173",
#     "https://tu-frontend-en-vercel.app", 
# ]


# ==============================================================================
# 6. REDIS Y CHANNELS (WebSockets)
# ==============================================================================

# Detecta automáticamente la URL de Redis de Railway
REDIS_URL = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379')

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    },
}

# Configuración de Caché (usando la misma Redis URL)
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            # Si usas la misma instancia de Redis para caché y channels, 
            # es buena práctica usar prefijos, pero para demo está bien así.
        }
    }
}


# ==============================================================================
# 7. ARCHIVOS ESTÁTICOS Y MEDIA
# ==============================================================================

LANGUAGE_CODE = 'es-es' # Español
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise permite servir estáticos en producción sin Nginx/Apache
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Archivos subidos por el usuario
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# API Keys
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')