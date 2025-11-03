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

function LessonPage() {
  const { courseId, lessonId } = useParams(); 
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [courseTitle, setCourseTitle] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [assignment, setAssignment] = useState(null); 
  const [submissionContent, setSubmissionContent] = useState(""); 
  const [submissionStatus, setSubmissionStatus] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
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

        // 1. Obtener el detalle de la lección
        const lessonUrl = `/api/lessons/${lessonId}/`;
        const lessonResponse = await axiosInstance.get(lessonUrl);
        setLesson(lessonResponse.data);
        
        // 2. Verificar si esta lección ya está completada
        const completionsResponse = await axiosInstance.get('/api/completions/my_completions/');
        // Comparamos el ID de la lección en la respuesta con el ID de la URL
        const completed = completionsResponse.data.some(comp => comp.lesson.id === parseInt(lessonId));
        if (completed) {
          setIsCompleted(true);
        }

        // 3. Verificar si esta lección tiene una tarea
        try {
          const assignmentUrl = `/api/assignments/lesson/${lessonId}/`;
          const assignmentResponse = await axiosInstance.get(assignmentUrl);
          setAssignment(assignmentResponse.data);
          
        } catch (assignmentErr) {
          if (assignmentErr.response && assignmentErr.response.status === 404) {
             console.log("Esta lección no tiene tarea.");
             setAssignment(null);
          } else {
             throw assignmentErr; 
          }
        }

      } catch (err) {
        console.error("Error al cargar la lección:", err);
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


  // --- FUNCIÓN: Marcar como Completada ---
  const handleMarkAsComplete = async () => {
    setIsCompleting(true); 
    try {
      await axiosInstance.post('/api/lessons/complete/', {
        lesson_id: lessonId
      });
      
      setIsCompleted(true); 
      setSnackbarMessage("¡Lección completada!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

    } catch (err) {
      console.error("Error al marcar como completada:", err);
      if (err.response && err.response.status === 409) {
         setIsCompleted(true); 
      } else {
         setSnackbarMessage("Error al guardar tu progreso.");
         setSnackbarSeverity("error");
         setSnackbarOpen(true);
      }
    } finally {
      setIsCompleting(false); 
    }
  };

  // --- FUNCIÓN: Enviar Tarea ---
  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await axiosInstance.post('/api/submissions/', {
        assignment_id: assignment.id,
        content: submissionContent
      });

      setSubmissionStatus(response.data.status); 
      setSnackbarMessage("¡Tarea entregada con éxito!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

    } catch (err) {
      console.error("Error al enviar la tarea:", err);
      setSnackbarMessage("Error al enviar la tarea.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FUNCIÓN: Cerrar Snackbar ---
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // --- RENDERING DE ESTADOS (¡COMPLETO!) ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
         <Button component={RouterLink} to={`/courses/${courseId}`} sx={{ mt: 2 }}>
            Volver al curso
        </Button>
      </Box>
    );
  }
  if (!lesson) return null;

  // --- FUNCIÓN: Renderizar Tarea (¡COMPLETA!) ---
  const renderAssignmentSection = () => {
    if (!assignment) {
      return null; 
    }
    if (submissionStatus === 'SUBMITTED' || submissionStatus === 'GRADED') {
        return (
            <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
                Ya has entregado esta tarea.
            </Alert>
        );
    }
    return (
      <Box 
        component="form" 
        onSubmit={handleSubmissionSubmit} 
        sx={{ mt: 4, p: 3, border: '1px solid #444', borderRadius: 2, backgroundColor: 'background.default' }}
      >
        <Typography variant="h5" component="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          Tarea: {assignment.title}
        </Typography>
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
          disabled={isSubmitting || submissionContent.trim() === ""}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? "Enviando..." : "Enviar Tarea"}
        </Button>
      </Box>
    );
  };

  // --- RENDERIZADO PRINCIPAL (¡COMPLETO!) ---
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
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
      
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
              {snackbarMessage}
          </Alert>
      </Snackbar>
    </Box>
  );
}

export default LessonPage;