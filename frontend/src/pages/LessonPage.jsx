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
  Divider, // <-- Asegúrate de que Divider esté importado
  Snackbar // <-- Y Snackbar
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // <-- Icono de completado

function LessonPage() {
  const { courseId, lessonId } = useParams(); 
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [courseTitle, setCourseTitle] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- NUEVOS ESTADOS PARA PROGRESO ---
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false); // Para deshabilitar el botón

  // Estados para la notificación
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsCompleted(false); // Resetea el estado al cargar

        // 1. Obtener el detalle de la lección
        const lessonUrl = `/api/lessons/${lessonId}/`;
        const lessonResponse = await axiosInstance.get(lessonUrl);
        setLesson(lessonResponse.data);
        
        // (Opcional) Obtener título del curso para Breadcrumbs
        // Esto asume que tu LessonSerializer anida la info
        if (lessonResponse.data.module && lessonResponse.data.module.course) {
             setCourseTitle(lessonResponse.data.module.course.title);
        } else {
             // Fallback si no está anidado
             // const courseResponse = await axiosInstance.get(`/api/courses/${courseId}/`);
             // setCourseTitle(courseResponse.data.title);
        }

        // 2. Verificar si esta lección ya está completada
        const completionsResponse = await axiosInstance.get('/api/completions/my_completions/');
        // lessonId es un string de la URL, lesson.id es un número
        const completed = completionsResponse.data.some(comp => comp.lesson === parseInt(lessonId));
        
        if (completed) {
          setIsCompleted(true);
        }

      } catch (err) {
        console.error("Error al cargar la lección:", err);
        if (err.response && err.response.status === 404) {
          setError("Lección o datos de completado no encontrados.");
        } else if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          // Si el usuario no está inscrito, el permiso 'IsEnrolledPermission' de Django (que añadimos)
          // devolverá 403 Forbidden.
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


  // --- NUEVA FUNCIÓN: Marcar como Completada ---
  const handleMarkAsComplete = async () => {
    setIsCompleting(true); // Bloquea el botón
    try {
      await axiosInstance.post('/api/lessons/complete/', {
        lesson_id: lessonId
      });
      
      setIsCompleted(true); // Actualiza la UI
      setSnackbarMessage("¡Lección completada!");
      setSnackbarOpen(true);

    } catch (err) {
      console.error("Error al marcar como completada:", err);
      if (err.response && err.response.status === 409) {
         // Si ya estaba completada (conflicto)
         setIsCompleted(true); 
      } else {
         alert("Error al guardar tu progreso.");
      }
    } finally {
      setIsCompleting(false); // Desbloquea el botón
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // --- RENDERIZADO DE ESTADOS ---

  if (loading) { /* ... spinner ... */ }
  if (error) { /* ... alerta de error ... */ }
  if (!lesson) return null;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Migas de Pan (Breadcrumbs) */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/">
          Inicio
        </Link>
        <Link component={RouterLink} underline="hover" color="inherit" to={`/courses/${courseId}`}>
          {courseTitle || `Curso`}
        </Link>
        <Typography color="text.primary">{lesson.title}</Typography>
      </Breadcrumbs>

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

        
        
        <Divider sx={{ my: 3 }} />

        {/* --- NUEVO BOTÓN CONDICIONAL DE PROGRESO --- */}
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
            disabled={isCompleting} // Deshabilita mientras guarda
          >
            {isCompleting ? "Guardando..." : "Marcar como Completada"}
          </Button>
        )}

        <Button component={RouterLink} to={`/courses/${courseId}`} sx={{ mt: 4, ml: isCompleted ? 0 : 2 }}>
            Volver al índice del curso
        </Button>
      </Paper>
      
      {/* Notificación de Éxito */}
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
              {snackbarMessage}
          </Alert>
      </Snackbar>
    </Box>
  );
}

export default LessonPage;