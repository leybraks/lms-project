# backend/api/admin.py
from django.contrib import admin
from .models import User, Course, Enrollment, Task, Submission, Grade, Module, Lesson

# Registra todos tus modelos aquí para verlos en el panel
admin.site.register(User)
admin.site.register(Course)
admin.site.register(Enrollment)
admin.site.register(Task)
admin.site.register(Submission)
admin.site.register(Grade)
admin.site.register(Module)
admin.site.register(Lesson)