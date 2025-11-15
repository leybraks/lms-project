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
    Message,
    Grade,
    CodeChallenge,      # <-- ¡IMPORTA ESTE!
    LiveCodeChallenge
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

class GradeInline(admin.TabularInline):
    model = Grade
    extra = 0 # No mostrar campos extra
    # Hacemos que el profesor solo pueda poner nota y comentarios
    fields = ('score', 'comments')
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'user', 'status', 'submitted_at')
    list_filter = ('status', 'assignment__lesson__module__course')
    search_fields = ('user__username', 'assignment__title')
    
    # ¡AQUI ESTÁ LA MAGIA!
    # Añade el inline de 'Grade' a la página de Submission
    inlines = [GradeInline]
    
    # Hacemos que los campos de la entrega sean de solo lectura para el admin
    readonly_fields = ('assignment', 'user', 'content', 'file_submission', 'submitted_at')
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
admin.site.unregister(Submission) # <-- Des-registra la versión simple
admin.site.register(Submission, SubmissionAdmin)
admin.site.register(CodeChallenge)
admin.site.register(LiveCodeChallenge)