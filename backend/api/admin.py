# backend/api/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin 
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
    QuizAttempt,
    Resource,
    LearningObjective,
    Requirement,
    CourseBenefit,
    Conversation,
    Message
)

# ====================================================================
# 1. Clases "Inline" para el Admin de Curso
# ====================================================================

class LearningObjectiveInline(admin.TabularInline):
    model = LearningObjective
    extra = 1

class RequirementInline(admin.TabularInline):
    model = Requirement
    extra = 1

class CourseBenefitInline(admin.TabularInline):
    model = CourseBenefit
    extra = 1

# ====================================================================
# 2. Definiciones de Admin Personalizadas
# ====================================================================

class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'professor', 'is_published')
    inlines = [LearningObjectiveInline, RequirementInline, CourseBenefitInline]

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Info Profesional', {'fields': ('title', 'bio', 'role')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Info Profesional', {'fields': ('title', 'bio', 'role')}),
    )
class MessageInline(admin.TabularInline):
    model = Message
    extra = 0 # No mostrar campos de mensaje nuevos
    # Hacemos que no se puedan editar desde aquí, solo ver
    readonly_fields = ('sender', 'message_type', 'content', 'language', 'timestamp')

class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'is_group', 'created_at')
    # Esto da una UI mucho mejor para añadir participantes
    filter_horizontal = ('participants',) 
    inlines = [MessageInline]
# ====================================================================
# 3. Registro de Modelos
# ====================================================================

# --- ¡¡¡AQUÍ ESTÁ EL ARREGLO!!! ---
# Verificamos si ya están registrados ANTES de des-registrarlos.
# Esto evita el error 'NotRegistered'.

if admin.site.is_registered(User):
    admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

if admin.site.is_registered(Course):
    admin.site.unregister(Course)
admin.site.register(Course, CourseAdmin)

# --- Registra todos los demás modelos de forma simple ---
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
admin.site.register(Resource)

# (Opcional) Registra los nuevos modelos individualmente
admin.site.register(LearningObjective)
admin.site.register(Requirement)
admin.site.register(CourseBenefit)

admin.site.register(Conversation, ConversationAdmin)
admin.site.register(Message)