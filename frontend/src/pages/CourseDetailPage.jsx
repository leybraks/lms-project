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
  // --- NUEVAS IMPORTACIONES PARA EL CONTENIDO ---
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Para el Accordion
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo'; // Icono para Lección de Video
import ArticleIcon from '@mui/icons-material/Article'; // Icono para Lección de Texto
// --- FIN NUEVAS IMPORTACIONES ---
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

  // --- useEffect para cargar datos (SIN CAMBIOS) ---
  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carga detalle del curso (¡Ahora incluye módulos/lecciones!)
        const courseUrl = `/api/courses/${courseId}/`;
        const courseResponse = await axiosInstance.get(courseUrl);
        setCourse(courseResponse.data);

        // Verifica inscripción
        try {
            const enrollmentResponse = await axiosInstance.get(`/api/enrollments/my_enrollments/`);
            const enrolled = enrollmentResponse.data.find(e => e.course === parseInt(courseId)); // Compara IDs
            if (enrolled) {
                setIsEnrolled(true);
                setEnrollmentId(enrolled.id);
            } else {
                setIsEnrolled(false); // Asegúrate de resetear si no se encuentra
            }
        } catch (enrollmentErr) {
            console.warn("No se pudo verificar la inscripción.", enrollmentErr);
            setIsEnrolled(false); // Asume no inscrito si hay error
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


  // --- Función handleEnroll (SIN CAMBIOS) ---
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
             setIsEnrolled(true); // Actualiza el estado si el backend dice que ya está inscrito
        } else if (err.response && err.response.data && err.response.data.detail) {
             message = err.response.data.detail;
        }
        setSnackbarMessage(message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
    }
  };

  // --- Función handleSnackbarClose (SIN CAMBIOS) ---
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };
  
  // --- RENDERING DE ESTADOS (SIN CAMBIOS) ---
  if (loading) { /* ... spinner ... */ }
  if (error) { /* ... alerta de error ... */ }
  if (!course) return null;

  // --- FUNCIÓN PARA EL BOTÓN (SIN CAMBIOS) ---
  const renderEnrollmentButton = () => { /* ... código del botón ... */ };

  // ==========================================================
  // ¡NUEVO! FUNCIÓN PARA RENDERIZAR EL CONTENIDO DEL CURSO
  // ==========================================================
  const renderCourseContent = () => {
    // Si no está inscrito, muestra el mensaje de advertencia
    if (!isEnrolled) {
      return (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Debes inscribirte para acceder a los módulos y lecciones.
        </Alert>
      );
    }

    // Si está inscrito pero no hay módulos (o la API no los envió)
    if (!course.modules || course.modules.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          El contenido de este curso estará disponible pronto.
        </Alert>
      );
    }

    // Si está inscrito y hay módulos, los mostramos con Accordion
    return (
      <Box sx={{ mt: 3 }}>
        {course.modules.map((module, index) => (
          <Accordion 
            key={module.id} 
            // El primer módulo empieza expandido
            defaultExpanded={index === 0} 
            sx={{ 
                // Estilo sutil para el Accordion en Dark Mode
                backgroundColor: 'background.paper', 
                border: '1px solid #333',
                mb: 1, 
                '&:before': { display: 'none' } // Quita la línea superior por defecto
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${module.id}-content`}
              id={`panel${module.id}-header`}
              sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
            >
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
              
              {/* Lista de Lecciones dentro del Módulo */}
              <List dense>
                {module.lessons && module.lessons.length > 0 ? (
                  module.lessons.map((lesson) => (
                    <ListItem 
                      key={lesson.id} 
                      button // Haz que sea clickeable (navegaremos en el futuro)
                      onClick={() => alert(`Navegar a Lección: ${lesson.title}`)} // <-- Placeholder
                      sx={{ borderRadius: 1, '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {/* Icono diferente si es video o texto */}
                        {lesson.video_url ? <OndemandVideoIcon fontSize="small" /> : <ArticleIcon fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText primary={`Lección ${lesson.order + 1}: ${lesson.title}`} />
                    </ListItem>
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

  // --- RENDERIZADO PRINCIPAL DEL COMPONENTE ---
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 900, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Mensaje de Inscripción (si aplica) */}
            {isEnrolled && (
                <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 2 }}>
                    ¡Estás inscrito en este curso!
                </Alert>
            )}

            {/* Título y Descripción del Curso */}
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                {course.title}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" paragraph color="text.secondary">
                {course.description}
            </Typography>

            {/* Botón de Inscripción / Ver Contenido */}
            {renderEnrollmentButton()}
            
            {/* Sección de Contenido (Módulos y Lecciones) */}
            <Box sx={{ mt: 5 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                    Contenido del Curso
                </Typography>
                {renderCourseContent()} {/* <-- LLAMAMOS A LA NUEVA FUNCIÓN */}
            </Box>
        </Paper>
        
        {/* Notificación Snackbar */}
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                {snackbarMessage}
            </Alert>
        </Snackbar>
    </Box>
  );
}

export default CourseDetailPage;