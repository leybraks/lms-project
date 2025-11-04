# backend/api/admin.py

from django.contrib import admin
from .models import (
    User, 
    Course, 
    Enrollment, 
    Module, 
    Lesson, 
    LessonCompletion, 
    Assignment, 
    Submission, 
    Grade,
    Quiz,
    Question,
    Choice,
    QuizAttempt
)

# Registramos todos los modelos limpios que definimos en models.py
admin.site.register(User)
admin.site.register(Course)
admin.site.register(Enrollment)
admin.site.register(Module)
admin.site.register(Lesson)
admin.site.register(LessonCompletion)
admin.site.register(Assignment)
admin.site.register(Submission)
admin.site.register(Grade)
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Choice)
admin.site.register(QuizAttempt)