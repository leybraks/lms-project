import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios'; // Asumiendo que está en /src
import { useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";

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
  Grid,
  Breadcrumbs,
  Link,
  Card,
  CardMedia,
  Tabs,
  Tab,
  Avatar,
  Container // <-- ¡Importante!
} from '@mui/material';

// --- Iconos ---
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ArticleIcon from '@mui/icons-material/Article';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ChecklistIcon from '@mui/icons-material/Checklist';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VideoLabelIcon from '@mui/icons-material/VideoLabel';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

// === VARIANTES DE ANIMACIÓN (Sin cambios) ===
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2, 
      staggerChildren: 0.15 
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ease: "easeOut" }
  }
};

// --- Estilo "Limpio" (Sin cambios) ---
const cleanPaperStyle = (theme) => ({
  p: { xs: 2, sm: 3, md: 4 },
  borderRadius: 4,
  backgroundColor: 'background.paper',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
});

// --- Función de Scrollbar (Sin cambios) ---
const getScrollbarStyles = (theme) => ({
  scrollbarWidth: 'thin',
  scrollbarColor: `${theme.palette.primary.main} ${theme.palette.background.paper}`,
  '&::-webkit-scrollbar': { width: '8px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent', borderRadius: '10px' },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: '10px',
    border: `2px solid ${theme.palette.background.default}`,
    backgroundClip: 'content-box',
  },
  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: theme.palette.primary.dark }
});


function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme(); 
  
  // --- Estados (Sin cambios) ---
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [completedLessons, setCompletedLessons] = useState([]); 

  // --- Lógica de Carga de Datos (Sin cambios) ---
  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [courseResponse, enrollmentResponse, completionsResponse] = await Promise.all([
          axiosInstance.get(`/api/courses/${courseId}/`),
          axiosInstance.get(`/api/enrollments/my_enrollments/`),
          axiosInstance.get('/api/completions/my_completions/')
        ]);

        setCourse(courseResponse.data);
        const enrolled = enrollmentResponse.data.find(e => e.course.id === parseInt(courseId));
        setIsEnrolled(!!enrolled);
        const completedIds = completionsResponse.data.map(comp => comp.lesson.id);
        setCompletedLessons(completedIds);

      } catch (err) {
        console.error("Error al cargar el curso:", err);
        setError("No se pudo cargar el curso. Intenta recargar.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourseAndEnrollment();
  }, [courseId, navigate]);


  // --- Handlers de UI (Sin cambios) ---
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
      console.error("Error al inscribirse:", err);
      let message = "Error al procesar la inscripción.";
      if (err.response && err.response.status === 409) {
          message = "Ya estás inscrito en este curso.";
          setIsEnrolled(true); // Sincroniza el estado
      }
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  
  // --- Helper para "Continuar Aprendiendo" (Sin cambios) ---
  const findNextLesson = () => {
    if (!course || !course.modules) return null;
    
    for (const module of course.modules) {
      if (module.lessons) {
        for (const lesson of module.lessons) {
          if (!completedLessons.includes(lesson.id)) {
            return lesson;
          }
        }
      }
    }
    return course.modules[0]?.lessons[0] || null;
  };
  
  // --- RENDERING DE ESTADOS (Sin cambios) ---
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Alert severity="error">{error}</Alert></Box>;
  }
  if (!course) return null; 


  // --- RENDERIZADO PRINCIPAL (¡¡¡CON MODIFICACIONES!!!) ---
  return (
    <Box 
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ 
        height: '100%', 
        width: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto', 
        ...getScrollbarStyles(theme)
      }}
    >
      
      {/* 1. SECCIÓN HERO (Banner "Fusionado") */}
{/* 1. SECCIÓN HERO (Banner "Fusionado") */}
      <Box 
        sx={{ 
          // El Box exterior ahora solo da el 'padding' vertical 
          // para separar el banner del resto de la página.
          py: { xs: 3, md: 4 }, 
        }}
      >
        {/* === CAMBIO 1: ESTILOS MOVIDOS AL CONTAINER === */}
        {/* Ahora el Container tiene el fondo morado y los bordes redondeados */}
        <Container 
          maxWidth="xl" 
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            color: 'primary.contrastText',
            // Padding interno del banner
            py: { xs: 3, md: 4 }, 
            px: { xs: 2, md: 3 }, 
            // Bordes redondeados en TODAS las esquinas
            borderRadius: 4, // 16px (consistente con tu cleanPaperStyle)
          }}
        >
          <motion.div variants={itemVariants}>
            
            {/* === CAMBIO 2: SEPARACIÓN DE CONTENIDO === */}
            <Grid 
              container 
              spacing={4} 
              sx={{ 
                alignItems: 'flex-start',
                justifyContent: 'space-between' // <-- ¡Esta es la magia!
              }}
            > 
              
              {/* --- LADO IZQUIERDO DEL HERO: "LA VENTA" --- */}
              <Grid item xs={12} md={7}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                  <Link component={RouterLink} underline="hover" color="inherit" to="/courses">
                    Cursos
                  </Link>
                  <Typography color="rgba(255,255,255,1)">{course.title}</Typography>
                </Breadcrumbs>
                
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, fontSize: {xs: '2.2rem', md: '3rem'} }}>
                  {course.title}
                </Typography>
                
                <Typography variant="h6" component="p" sx={{ opacity: 0.9, mb: 3, fontSize: {xs: '1rem', md: '1.25rem'} }}>
                  {course.description}
                </Typography>
                
                {/* Stats del Hero */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, opacity: 0.9 }}>
                  {course.professor && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        src={`https://placehold.co/50/FF5733/FFFFFF?text=${course.professor.username[0]}`}
                        sx={{ width: 28, height: 28 }} 
                      />
                      <Typography variant="body2">Prof. {course.professor.username}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoStoriesIcon fontSize="small" />
                    <Typography variant="body2">{course.modules.length} Módulos</Typography>
                  </Box>
                  {course.estimated_duration && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="body2">{course.estimated_duration}</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* --- LADO DERECHO DEL HERO: "LA ACCIÓN" --- */}
              <Grid item xs={12} md={5}>
                <Box component={motion.div} variants={itemVariants}>
                  
                  {/* --- LÓGICA DE BOTÓN (Estilo blanco) --- */}
                  {isEnrolled ? (
                    <Button 
                      variant="contained" 
                      size="large" 
                      startIcon={<PlayCircleOutlineIcon />} 
                      sx={{ 
                        mb: 3, 
                        width: '100%', 
                        py: 1.5, 
                        fontSize: '1rem',
                        bgcolor: 'white', 
                        color: 'primary.dark',
                        '&:hover': { bgcolor: '#f0f0f0' }
                      }} 
                      onClick={() => {
                        const nextLesson = findNextLesson();
                        if (nextLesson) {
                          navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
                        }
                      }}
                    >
                      Continuar Aprendiendo
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      size="large" 
                      startIcon={<SchoolIcon />} 
                      sx={{ 
                        mb: 3, 
                        width: '100%', 
                        py: 1.5, 
                        fontSize: '1rem',
                        bgcolor: 'white', 
                        color: 'primary.dark',
                        '&:hover': { bgcolor: '#f0f0f0' }
                      }} 
                      onClick={handleEnroll}
                    >
                      Inscribirse Ahora
                    </Button>
                  )}
                  
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                    Este curso incluye:
                  </Typography>
                  
                  <List dense sx={{ color: 'white' }}>
                    {course.benefits.map(benefit => (
                      <ListItem key={benefit.id} sx={{p:0, mb: 1}}>
                        <ListItemIcon sx={{minWidth: 32, color: 'white'}}>
                          {benefit.icon === 'video' && <VideoLabelIcon fontSize="small" />}
                          {benefit.icon === 'article' && <ArticleIcon fontSize="small" />}
                          {benefit.icon === 'access' && <AllInclusiveIcon fontSize="small" />}
                          {benefit.icon === 'task' && <AssessmentIcon fontSize="small" />}
                          {benefit.icon === 'certificate' && <EmojiEventsIcon fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText primary={benefit.description} />
                      </ListItem>
                    ))}
                  </List>

                </Box>
              </Grid>

            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* 2. CONTENIDO PRINCIPAL (Columna ancha, como pediste) */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: {xs: 2, md: 3} }}>
        
        {/* === CAMBIO 2: ANCHO DEL CONTENIDO === */}
        {/* Se quitó 'justifyContent="center"' para que el Grid ocupe todo el espacio */}
        <Grid container spacing={4}>
          
          {/* --- COLUMNA ANCHA DE CONTENIDO --- */}
          {/* Se quitó 'md={8}' para que siempre ocupe las 12 columnas */}
          <Grid item xs={12}> 
          {/* === FIN DEL CAMBIO 2 === */}

            
            {/* --- ¿Qué aprenderás? --- */}
            <motion.div variants={itemVariants}>
              <Paper sx={{...cleanPaperStyle(theme), mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Qué aprenderás</Typography>
                <List sx={{ color: 'text.secondary', columns: { xs: 1, sm: 2 } }}>
                  {course.learning_objectives.map(obj => (
                    <ListItem key={obj.id} sx={{p:0, mb: 1, breakInside: 'avoid-column'}}>
                      <ListItemIcon sx={{minWidth: 32, color: 'success.main'}}><CheckCircleIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={obj.description} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </motion.div>

            {/* --- Contenido del Curso (Syllabus) --- */}
            <motion.div variants={itemVariants}>
              <Paper sx={{...cleanPaperStyle(theme), mb: 4}}>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Contenido del Curso</Typography>
                {isEnrolled && course.modules && course.modules.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {course.modules.map((module, index) => (
                      <Accordion key={module.id} defaultExpanded={index === 0} sx={{ backgroundColor: 'background.default', border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 1.5, '&:before': { display: 'none' }, boxShadow: 'none' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Módulo {module.order + 1}: {module.title}</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, borderTop: `1px solid ${theme.palette.divider}` }}>
                          <List dense disablePadding>
                            {module.lessons && module.lessons.length > 0 ? (
                              module.lessons.map((lesson) => {
                                const isLessonCompleted = completedLessons.includes(lesson.id);
                                return (
                                  <ListItemButton key={lesson.id} onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)} sx={{ pl: 3, py: 1.5 }}>
                                    <ListItemIcon sx={{ minWidth: 32, color: isLessonCompleted ? 'success.main' : 'text.secondary' }}>
                                      {isLessonCompleted ? <CheckCircleIcon fontSize="small" /> : <OndemandVideoIcon fontSize="small" />}
                                    </ListItemIcon>
                                    <ListItemText primary={`Lección ${lesson.order + 1}: ${lesson.title}`} primaryTypographyProps={{ opacity: isLessonCompleted ? 0.7 : 1 }} />
                                  </ListItemButton>
                                );
                              })
                            ) : ( <ListItem><ListItemText primary="No hay lecciones." /></ListItem> )}
                          </List>
                          {module.quiz && (
                            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'left' }}>
                              <Button variant="outlined" color="secondary" size="small" startIcon={<AssessmentIcon />} onClick={() => navigate(`/courses/${courseId}/modules/${module.id}/quiz`)}>Comenzar Examen</Button>
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
                {!isEnrolled && <Alert severity="warning">Inscríbete para ver el contenido del curso.</Alert>}
                {isEnrolled && (!course.modules || course.modules.length === 0) && <Alert severity="info">El contenido estará disponible pronto.</Alert>}
              </Paper>
            </motion.div>

            {/* --- Requisitos --- */}
            <motion.div variants={itemVariants}>
              <Paper sx={{...cleanPaperStyle(theme), mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Requisitos</Typography>
                <List sx={{ color: 'text.secondary' }}>
                  {course.requirements.map(req => (
                    <ListItem key={req.id} sx={{p:0, mb: 1}}>
                      <ListItemIcon sx={{minWidth: 32, color: 'primary.main'}}><ChecklistIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={req.description} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </motion.div>
            
          </Grid>
        </Grid>
      </Container>


      {/* Snackbar (Conectado, sin cambios) */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
              {snackbarMessage}
          </Alert>
      </Snackbar>
    </Box>
  );
}


export default CourseDetailPage;