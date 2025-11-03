// frontend/src/pages/CourseDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Divider,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton, // <-- Asegúrate de importar ListItemButton
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ArticleIcon from '@mui/icons-material/Article';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // --- useEffect (Corregido) ---
  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const courseUrl = `/api/courses/${courseId}/`;
        const courseResponse = await axiosInstance.get(courseUrl);
        setCourse(courseResponse.data);

        // Verifica inscripción
        try {
            const enrollmentResponse = await axiosInstance.get(`/api/enrollments/my_enrollments/`);
            // Comparamos el ID del curso de la inscripción (e.course) con el ID de la URL
            const enrolled = enrollmentResponse.data.find(e => e.course.id === parseInt(courseId));
            
            if (enrolled) {
                setIsEnrolled(true);
                setEnrollmentId(enrolled.id);
            } else {
                setIsEnrolled(false);
            }
        } catch (enrollmentErr) {
            console.warn("No se pudo verificar la inscripción.", enrollmentErr);
            setIsEnrolled(false);
        }

      } catch (err) {
        console.error("Error al cargar el detalle del curso:", err);
        if (err.response && err.response.status === 404) {
             setError("Curso no encontrado.");
        } else if (err.response && err.response.status === 401) {
             navigate('/login'); 
        } else {
             setError("Error al conectar con el servidor.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCourseAndEnrollment();
  }, [courseId, navigate]);


  // --- Función handleEnroll (Completa) ---
  const handleEnroll = async () => {
    try {
        const response = await axiosInstance.post('/api/enroll/', {
            course_id: courseId
        });
        setIsEnrolled(true);
        setEnrollmentId(response.data.id);
        setSnackbarMessage(`¡Inscripción exitosa en ${course.title}!`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
    } catch (err) {
        console.error("Error durante la inscripción:", err);
        let message = "Error desconocido al intentar inscribirse.";
        if (err.response && err.response.status === 409) {
             message = "Ya estás inscrito en este curso.";
             setIsEnrolled(true);
        } else if (err.response && err.response.data && err.response.data.detail) {
             message = err.response.data.detail;
        }
        setSnackbarMessage(message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
    }
  };

  // --- Función handleSnackbarClose (Completa) ---
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };
  
  // --- RENDERING DE ESTADOS (COMPLETO) ---
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
      </Box>
    );
  }
  if (!course) return null;

  // --- FUNCIÓN PARA EL BOTÓN (COMPLETA) ---
  const renderEnrollmentButton = () => {
    if (isEnrolled) {
      return (
        <Button 
            variant="contained" 
            color="secondary" 
            size="large" 
            startIcon={<AutoStoriesIcon />}
            sx={{ mt: 3 }}
        >
            Ver Contenido
        </Button>
      );
    } else {
      return (
        <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            startIcon={<SchoolIcon />}
            sx={{ mt: 3 }}
            onClick={handleEnroll}
        >
            Inscribirse Ahora
        </Button>
      );
    }
  };

  // --- FUNCIÓN PARA EL CONTENIDO DEL CURSO (COMPLETA) ---
  const renderCourseContent = () => {
    if (!isEnrolled) {
      return (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Debes inscribirte para acceder a los módulos y lecciones.
        </Alert>
      );
    }
    // ESTA ES LA LÓGICA QUE FALTABA
    if (!course.modules || course.modules.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          El contenido de este curso estará disponible pronto.
        </Alert>
      );
    }
    // ESTA ES LA LÓGICA QUE FALTABA
    return (
      <Box sx={{ mt: 3 }}>
        {course.modules.map((module, index) => (
          <Accordion key={module.id} defaultExpanded={index === 0} sx={{ backgroundColor: 'background.paper', border: '1px solid #333', mb: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`panel${module.id}-content`} id={`panel${module.id}-header`} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
              <Typography sx={{ fontWeight: 500 }}>
                Módulo {module.order + 1}: {module.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ borderTop: '1px solid #333' }}>
              {module.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {module.description}
                  </Typography>
              )}
              <List dense>
                {module.lessons && module.lessons.length > 0 ? (
                  module.lessons.map((lesson) => (
                    <ListItemButton key={lesson.id} onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)} sx={{ borderRadius: 1, '&:hover': { backgroundColor: 'action.hover' } }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {lesson.video_url ? <OndemandVideoIcon fontSize="small" /> : <ArticleIcon fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText primary={`Lección ${lesson.order + 1}: ${lesson.title}`} />
                    </ListItemButton>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No hay lecciones en este módulo." />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  // --- RENDERIZADO PRINCIPAL (COMPLETO) ---
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 900, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {isEnrolled && (
                <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 2 }}>
                    ¡Estás inscrito en este curso!
                </Alert>
            )}

            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                {course.title}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" paragraph color="text.secondary">
                {course.description}
            </Typography>

            {renderEnrollmentButton()}
            
            <Box sx={{ mt: 5 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                    Contenido del Curso
                </Typography>
                {renderCourseContent()}
            </Box>
        </Paper>
        
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                {snackbarMessage}
            </Alert>
        </Snackbar>
    </Box>
  );
}

export default CourseDetailPage;