// frontend/src/pages/LessonPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Paper, 
  Breadcrumbs, 
  Link, 
  Button,
  Divider,
  Snackbar,
  TextField,
  Icon 
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit'; // <-- ¡Icono nuevo!

function LessonPage() {
  const { courseId, lessonId } = useParams(); 
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // --- Estados de Tareas (Actualizados) ---
  const [assignment, setAssignment] = useState(null); 
  const [submissionContent, setSubmissionContent] = useState(""); 
  const [submissionStatus, setSubmissionStatus] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false); // <-- ¡NUEVO!

  // Estados para la notificación
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsCompleted(false);
        setAssignment(null); 
        setIsEditingSubmission(false); // Resetea el modo edición

        // 1. Obtener el detalle de la lección
        const lessonUrl = `/api/lessons/${lessonId}/`;
        const lessonResponse = await axiosInstance.get(lessonUrl);
        setLesson(lessonResponse.data);
        
        // 2. Verificar si esta lección ya está completada
        const completionsResponse = await axiosInstance.get('/api/completions/my_completions/');
        const completed = completionsResponse.data.some(comp => comp.lesson.id === parseInt(lessonId));
        if (completed) setIsCompleted(true);

        // 3. Verificar Tarea y Entrega (Actualizado)
        try {
          const assignmentUrl = `/api/assignments/lesson/${lessonId}/`;
          const assignmentResponse = await axiosInstance.get(assignmentUrl);
          setAssignment(assignmentResponse.data); // Ahora incluye due_date y allow_edits
          
          // Busca si ya existe una entrega
          const submissionsResponse = await axiosInstance.get('/api/submissions/my_submissions/');
          const existingSubmission = submissionsResponse.data.find(
            sub => sub.assignment === assignmentResponse.data.id
          );

          if (existingSubmission) {
            setSubmissionContent(existingSubmission.content); // Carga la previsualización
            setSubmissionStatus(existingSubmission.status); // Carga el estado
          }

        } catch (assignmentErr) {
          if (assignmentErr.response && assignmentErr.response.status === 404) {
             console.log("Esta lección no tiene tarea.");
             setAssignment(null);
          } else { throw assignmentErr; }
        }

      } catch (err) {
        // ... (manejo de errores)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError("No tienes permiso para ver esta lección. Asegúrate de estar inscrito.");
        } else {
          setError("Error al cargar el contenido de la lección.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLessonData();
  }, [lessonId, courseId, navigate]);


  // --- FUNCIÓN: Marcar como Completada (Sin cambios) ---
  const handleMarkAsComplete = async () => { /* ... */ };

  // --- FUNCIÓN: Enviar Tarea (Actualizada) ---
  // (Ahora maneja tanto la creación como la actualización)
  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // (La vista 'SubmissionCreateUpdateView' maneja 'update_or_create' en el backend)
      const response = await axiosInstance.post('/api/submissions/', {
        assignment_id: assignment.id,
        content: submissionContent
      });

      setSubmissionStatus(response.data.status); // 'SUBMITTED'
      setSnackbarMessage("¡Tarea entregada con éxito!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setIsEditingSubmission(false); // <-- ¡NUEVO! Sale del modo edición

    } catch (err) {
      console.error("Error al enviar la tarea:", err);
      setSnackbarMessage("Error al enviar la tarea.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FUNCIÓN: Cerrar Snackbar (Sin cambios) ---
  const handleSnackbarClose = (event, reason) => { /* ... */ };

  // --- RENDERING DE ESTADOS (Sin cambios) ---
  if (loading) { /* ... */ }
  if (error) { /* ... */ }
  if (!lesson) return null;

  // ==========================================================
  // ¡NUEVO! FUNCIÓN PARA RENDERIZAR LA SECCIÓN DE TAREA (Actualizada)
  // ==========================================================
  const renderAssignmentSection = () => {
    if (!assignment) {
      return null; // No hay tarea
    }

    // --- Lógica de Fecha Límite (Feature 5) ---
    let isPastDueDate = false;
    let dueDateString = "";
    if (assignment.due_date) {
        const dueDate = new Date(assignment.due_date);
        isPastDueDate = new Date() > dueDate;
        // Formato de fecha y hora local
        dueDateString = dueDate.toLocaleString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    const formStyles = { 
        mt: 4, 
        p: 3, 
        border: '1px solid #444', 
        borderRadius: 2, 
        backgroundColor: 'background.default'
    };

    // --- VISTA 1: El usuario está editando ---
    if (isEditingSubmission) {
        return (
            <Box component="form" onSubmit={handleSubmissionSubmit} sx={formStyles}>
                <Typography variant="h5" component="h3" gutterBottom>
                    Editando Tarea: {assignment.title}
                </Typography>
                <TextField
                    label="Tu Respuesta"
                    multiline
                    rows={6}
                    fullWidth
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    required
                    sx={{ mt: 2 }}
                />
                <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ mt: 2 }}>
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button variant="text" onClick={() => setIsEditingSubmission(false)} sx={{ mt: 2, ml: 1 }}>
                    Cancelar
                </Button>
            </Box>
        );
    }

    // --- VISTA 2: El usuario ya entregó (o está calificado) ---
    if (submissionStatus === 'SUBMITTED' || submissionStatus === 'GRADED') {
        return (
            <Box sx={{ ...formStyles, backgroundColor: 'transparent', border: 'none', p: 0 }}>
                <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
                    Ya has entregado esta tarea. (Estado: {submissionStatus})
                </Alert>
                
                {/* Feature 1: Previsualización */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Tu entrega:</Typography>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'background.default', whiteSpace: 'pre-wrap' }}>
                    <Typography variant="body1">{submissionContent}</Typography>
                </Paper>

                {/* Feature 4: Botón de Editar */}
                {assignment.allow_edits && !isPastDueDate && (
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => setIsEditingSubmission(true)} // <-- ¡NUEVO!
                        sx={{ mt: 2 }}
                    >
                        Editar Entrega
                    </Button>
                )}
                
                {/* Mensaje si la edición no está permitida o la fecha pasó */}
                {(!assignment.allow_edits || isPastDueDate) && (
                    <Alert severity="info" sx={{mt: 2}}>
                        {isPastDueDate ? "La fecha límite ha pasado. Ya no se permiten ediciones." : "Esta tarea no permite ediciones después de ser entregada."}
                    </Alert>
                )}
            </Box>
        );
    }

    // --- VISTA 3: El usuario no ha entregado (Formulario inicial) ---
    return (
        <Box component="form" onSubmit={handleSubmissionSubmit} sx={formStyles}>
            <Typography variant="h5" component="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                Tarea: {assignment.title}
            </Typography>
            
            {/* Feature 5: Mostrar Fecha Límite */}
            {dueDateString && (
                <Alert severity={isPastDueDate ? "error" : "info"} sx={{ mb: 2 }}>
                    Fecha Límite: {dueDateString} {isPastDueDate && "(Vencida)"}
                </Alert>
            )}

            <Typography variant="body2" color="text.secondary" paragraph>
                {assignment.description}
            </Typography>
            <TextField
                label="Tu Respuesta"
                multiline
                rows={6}
                fullWidth
                variant="outlined"
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                required
                sx={{ mt: 2 }}
            />
            <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={isSubmitting || submissionContent.trim() === "" || isPastDueDate}
                sx={{ mt: 2 }}
            >
                {isSubmitting ? "Enviando..." : (isPastDueDate ? "Fecha Límite Pasada" : "Enviar Tarea")}
            </Button>
        </Box>
    );
  };

  // --- RENDERIZADO PRINCIPAL (Sin cambios) ---
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* ... (Breadcrumbs, Paper, Título, Contenido, Video...) ... */}
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {lesson.title}
        </Typography>
        <Divider sx={{ my: 2 }} />

        {lesson.content && (
          <Typography variant="body1" paragraph>
            {lesson.content}
          </Typography>
        )}
        {lesson.video_url && (
          <Box sx={{ mt: 3, position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
            <iframe
              src={lesson.video_url}
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </Box>
        )}

        {renderAssignmentSection()}
        
        <Divider sx={{ my: 3 }} />

        {isCompleted ? (
          <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
            ¡Lección Completada!
          </Alert>
        ) : (
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<CheckCircleIcon />}
            onClick={handleMarkAsComplete}
            disabled={isCompleting}
          >
            {isCompleting ? "Guardando..." : "Marcar como Completada"}
          </Button>
        )}

        <Button component={RouterLink} to={`/courses/${courseId}`} sx={{ mt: 4, ml: isCompleted ? 0 : 2 }}>
            Volver al índice del curso
        </Button>
      </Paper>
      
      {/* ... (Snackbar) ... */}
    </Box>
  );
}

export default LessonPage;