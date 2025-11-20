# 1. Usar una imagen ligera de Python 3.10 (compatible con tus dependencias)
FROM python:3.10-slim

# 2. Configurar variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Instalar dependencias del sistema (necesarias para PostgreSQL y otros)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 4. Crear carpeta de trabajo dentro del contenedor
WORKDIR /app

# 5. COPIAR SOLO LA CARPETA BACKEND
# Esto es la clave: movemos el contenido de 'backend/' a la raíz del contenedor ('/app')
COPY backend/ /app/

# 6. Instalar dependencias de Python
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# 7. Recolectar archivos estáticos (CSS del Admin)
# Esto genera la carpeta staticfiles para que el admin se vea bonito
RUN python manage.py collectstatic --noinput

# 8. Comando de arranque
# Usamos la variable $PORT que Railway asigna automáticamente
CMD daphne -b 0.0.0.0 -p $PORT core.asgi:application
