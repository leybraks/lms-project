// frontend/src/pages/CourseDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Grid, // <-- ¡Importante para el layout!
  Breadcrumbs, // <-- Para la navegación
  Link
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ArticleIcon from '@mui/icons-material/Article';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AssessmentIcon from '@mui/icons-material/Assessment';

function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de UI
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // --- useEffect (Sin cambios, solo la lógica de 'find') ---
  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const courseUrl = `/api/courses/${courseId}/`;
        const courseResponse = await axiosInstance.get(courseUrl);
        setCourse(courseResponse.data);

        try {
            const enrollmentResponse = await axiosInstance.get(`/api/enrollments/my_enrollments/`);
            // Comparamos el 'course.id' anidado
            const enrolled = enrollmentResponse.data.find(e => e.course.id === parseInt(courseId));
            
            if (enrolled) {
                setIsEnrolled(true);
            } else {
                setIsEnrolled(false);
            }
        } catch (enrollmentErr) {
            setIsEnrolled(false);
        }

      } catch (err) {
        // ... (manejo de errores)
      } finally {
        setLoading(false);
      }
    };
    fetchCourseAndEnrollment();
  }, [courseId, navigate]);


  // --- Función handleEnroll (Sin cambios) ---
  const handleEnroll = async () => {
    try {
        const response = await axiosInstance.post('/api/enroll/', {
            course_id: courseId
        });
        setIsEnrolled(true);
        setSnackbarMessage(`¡Inscripción exitosa en ${course.title}!`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
    } catch (err) {
      let message = "Error desconocido.";
      if (err.response && err.response.status === 409) {
           message = "Ya estás inscrito en este curso.";
           setIsEnrolled(true);
      }
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // --- Función handleSnackbarClose (Sin cambios) ---
  const handleSnackbarClose = (event, reason) => { /* ... */ };
  
  // --- RENDERING DE ESTADOS (Sin cambios) ---
  if (loading) { /* ... */ }
  if (error) { /* ... */ }
  if (!course) return null;

  // --- RENDERIZADO PRINCIPAL (¡DISEÑO MEJORADO!) ---
  return (
    <Box>
      {/* 1. Breadcrumbs (Migas de Pan) */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/">
          Dashboard
        </Link>
        <Typography color="text.primary">{course.title}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        
        {/* === COLUMNA PRINCIPAL (IZQUIERDA) === */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 4 }}>
            
            {/* Mensaje de Inscripción (si aplica) */}
            {isEnrolled && (
                <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ mb: 2 }}>
                    ¡Estás inscrito en este curso!
                </Alert>
            )}

            {/* Título y Descripción */}
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                {course.title}
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
                {course.description}
            </Typography>
            
            {/* Botón de Inscripción (Solo si NO está inscrito) */}
            {!isEnrolled && (
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
            )}

            {/* AQUÍ IRÍA EL CONTENIDO PRINCIPAL
              (Ej. un video de bienvenida al curso)
            */}
            
          </Paper>
        </Grid>

        {/* === COLUMNA LATERAL (DERECHA) === */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, position: 'sticky', top: 100 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Contenido del Curso
            </Typography>

            {/* Si no está inscrito, muestra la advertencia */}
            {!isEnrolled && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Debes inscribirte para acceder a los módulos y lecciones.
              </Alert>
            )}

            {/* Si está inscrito pero no hay módulos */}
            {isEnrolled && (!course.modules || course.modules.length === 0) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                El contenido de este curso estará disponible pronto.
              </Alert>
            )}
            
            {/* Si está inscrito Y hay módulos */}
            {isEnrolled && course.modules && course.modules.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {course.modules.map((module, index) => (
                  <Accordion 
                    key={module.id} 
                    defaultExpanded={index === 0} 
                    disableGutters // Quita los márgenes por defecto
                    elevation={0} // Sin sombra, ya está en una tarjeta
                    sx={{ 
                        backgroundColor: 'transparent',
                        '&:before': { display: 'none' } // Quita la línea superior
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ fontWeight: 500 }}>
                        Módulo {module.order + 1}: {module.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <List dense disablePadding>
                        {module.lessons && module.lessons.length > 0 ? (
                          module.lessons.map((lesson) => (
                            <ListItemButton 
                              key={lesson.id} 
                              onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)} 
                              sx={{ borderRadius: 1.5, pl: 2 }}
                            >
                              <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
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

                      {/* Botón de Examen (si existe) */}
                      {module.quiz && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            startIcon={<AssessmentIcon />}
                            onClick={() => navigate(`/courses/${courseId}/modules/${module.id}/quiz`)}
                          >
                            Comenzar Examen
                          </Button>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar para notificaciones */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
              {snackbarMessage}
          </Alert>
      </Snackbar>
    </Box>
  );
}

export default CourseDetailPage;