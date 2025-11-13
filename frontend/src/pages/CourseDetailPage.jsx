import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios'; 
import { useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";
import { useAuth } from '../context/AuthContext'; // <-- ¡NUEVA IMPORTACIÓN!
import CreateLiveQuiz from '../components/CreateLiveQuiz';
import BarChartIcon from '@mui/icons-material/BarChart';
import GradeIcon from '@mui/icons-material/Grade';
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
  Container
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
import EditIcon from '@mui/icons-material/Edit'; // <-- ¡NUEVO ICONO!


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
  const { user } = useAuth(); // <-- ¡NUEVO! Obtenemos el usuario
  
  // --- Estados ---
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isOwner, setIsOwner] = useState(false); // <-- ¡NUEVO ESTADO!
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [completedLessons, setCompletedLessons] = useState([]); 
  const [adminTab, setAdminTab] = useState(0);
  // --- ¡¡¡LÓGICA DE CARGA ACTUALIZADA CON ROLES!!! ---
  useEffect(() => {
    // No hacer nada si el usuario o el curso aún no han cargado
    if (!user) {
      setLoading(true);
      return;
    }

    const fetchCourseAndEnrollment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [courseResponse, enrollmentResponse, completionsResponse] = await Promise.all([
          axiosInstance.get(`/api/courses/${courseId}/`),
          axiosInstance.get(`/api/enrollments/my_enrollments/`),
          axiosInstance.get('/api/completions/my_completions/')
        ]);

        const courseData = courseResponse.data;
        setCourse(courseData);
        
        const completedIds = completionsResponse.data.map(comp => comp.lesson.id);
        setCompletedLessons(completedIds);

        // --- ¡NUEVA LÓGICA DE ROL! ---
        if (user && courseData.professor && user.username === courseData.professor.username) {
          // Es el dueño (Profesor)
          setIsOwner(true);
          setIsEnrolled(false); // Un profesor no se "inscribe" a su propio curso
        } else {
          // Es un estudiante o visitante
          setIsOwner(false);
          const enrolled = enrollmentResponse.data.find(e => e.course.id === parseInt(courseId));
          setIsEnrolled(!!enrolled);
        }

      } catch (err) {
        console.error("Error al cargar el curso:", err);
        setError("No se pudo cargar el curso. Intenta recargar.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourseAndEnrollment();
  }, [courseId, navigate, user]); // <-- ¡DEPENDE DE USER AHORA!


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
          setIsEnrolled(true); 
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
  
  // --- RENDERING DE ESTADOS ---
  if (loading || !user) { // Muestra spinner si carga o si 'user' no está listo
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Alert severity="error">{error}</Alert></Box>;
  }
  if (!course) return null; 


  // --- Estilos para botones del Hero ---
  const whiteButtonStyle = { 
    width: '100%', 
    py: 1.5, 
    fontSize: '1rem',
    bgcolor: 'white', 
    color: 'primary.dark',
    '&:hover': { bgcolor: '#f0f0f0' }
  };
  
  const whiteOutlinedButtonStyle = {
    width: '100%', 
    py: 1.5, 
    fontSize: '1rem',
    bgcolor: 'transparent', 
    color: 'white', 
    borderColor: 'white',
    '&:hover': { 
      bgcolor: 'rgba(255,255,255,0.1)', 
      borderColor: 'white' 
    }
  };

  // --- RENDERIZADO PRINCIPAL (¡CON MODIFICACIONES!) ---
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
      <Box 
        sx={{ 
          py: { xs: 3, md: 4 }, 
        }}
      >
        <Container 
          maxWidth="xl" 
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            color: 'primary.contrastText',
            py: { xs: 3, md: 4 }, 
            px: { xs: 2, md: 3 }, 
            borderRadius: 4, 
          }}
        >
          <motion.div variants={itemVariants}>
            
            <Grid 
              container 
              spacing={4} 
              sx={{ 
                alignItems: 'flex-start',
                justifyContent: 'space-between' 
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
                  {/* El profesor ve su propio nombre, está bien */}
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
                  
                  {/* --- ¡¡¡NUEVA LÓGICA DE BOTONES (3 VISTAS)!!! --- */}
                  {isOwner ? (
                    // --- VISTA DE PROFESOR ---
                    <Box>
                      <Button 
                        variant="contained" 
                        size="large" 
                        startIcon={<EditIcon />} 
                        sx={{ ...whiteButtonStyle, mb: 2 }} 
                        onClick={() => navigate(`/courses/${courseId}/edit`)}
                      >
                        Editar Curso
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="large" 
                        startIcon={<BarChartIcon />} 
                        sx={whiteOutlinedButtonStyle} 
                        onClick={() => navigate(`/courses/${courseId}/dashboard`)}
                      >
                        Ver Dashboard
                      </Button>
                    </Box>

                  ) : isEnrolled ? (
                    // --- VISTA DE ALUMNO INSCRITO ---
                    <Button 
                      variant="contained" 
                      size="large" 
                      startIcon={<PlayCircleOutlineIcon />} 
                      sx={{ ...whiteButtonStyle, mb: 3 }} 
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
                    // --- VISTA DE VISITANTE ---
                    <Button 
                      variant="contained" 
                      size="large" 
                      startIcon={<SchoolIcon />} 
                      sx={{ ...whiteButtonStyle, mb: 3 }} 
                      onClick={handleEnroll}
                    >
                      Inscribirse Ahora
                    </Button>
                  )}
                  
                  {/* --- ¡¡¡NUEVA LÓGICA DE LISTA (STATS vs BENEFICIOS)!!! --- */}
                  {isOwner ? (
                    // --- VISTA PROFESOR: STATS ---
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3, color: 'white' }}>
                        Estadísticas del Curso
                      </Typography>
                      <List dense sx={{ color: 'white' }}>
                        <ListItem sx={{p:0, mb: 1}}>
                          <ListItemIcon sx={{minWidth: 32, color: 'white'}}><PeopleAltIcon fontSize="small" /></ListItemIcon>
                          {/* Asumimos que la API envía 'enrollments_count' */}
                          <ListItemText primary={`${course.enrollments_count || 0} Estudiantes Inscritos`} />
                        </ListItem>
                        <ListItem sx={{p:0, mb: 1}}>
                          <ListItemIcon sx={{minWidth: 32, color: 'white'}}><ChecklistIcon fontSize="small" /></ListItemIcon>
                           {/* (Dato mockeado, idealmente vendría de la API) */}
                          <ListItemText primary="35% Progreso Promedio" />
                        </ListItem>
                        <ListItem sx={{p:0, mb: 1}}>
                          <ListItemIcon sx={{minWidth: 32, color: 'white'}}><EmojiEventsIcon fontSize="small" /></ListItemIcon>
                          {/* (Dato mockeado) */}
                          <ListItemText primary="12 Certificados Emitidos" /> 
                        </ListItem>
                      </List>
                    </>
                  ) : (
                    // --- VISTA ALUMNO/VISITANTE: BENEFICIOS ---
                    <>
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
                    </>
                  )}

                </Box>
              </Grid>

            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* 2. CONTENIDO PRINCIPAL (Columna ancha) */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: {xs: 2, md: 3} }}>
        
        {/* --- VISTA DEL PROFESOR (isOwner) --- */}
        {isOwner ? (
          <Paper sx={{...cleanPaperStyle(theme), p: 0, overflow: 'hidden'}}>
            {/* Pestañas de Administración */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, md: 3 } }}>
              <Tabs 
                value={adminTab} 
                onChange={(e, newValue) => setAdminTab(newValue)} 
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Contenido (Syllabus)" icon={<AutoStoriesIcon />} iconPosition="start" />
                <Tab label="Crear Quiz en Vivo" icon={<EmojiEventsIcon />} iconPosition="start" />
                <Tab label="Crear Quiz de Lección" icon={<AssessmentIcon />} iconPosition="start" />
                <Tab label="Calificaciones" icon={<GradeIcon />} iconPosition="start" />
                <Tab label="Asistencia" icon={<ChecklistIcon />} iconPosition="start" />
                <Tab label="Archivos y Tareas" icon={<ArticleIcon />} iconPosition="start" />
              </Tabs>
            </Box>

            {/* Panel 0: Contenido (Syllabus) - (Lo que ya tenías) */}
            <Box sx={{ p: { xs: 2, md: 3 }, display: adminTab === 0 ? 'block' : 'none' }}>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Contenido del Curso</Typography>
              {course.modules && course.modules.length > 0 ? (
                <Box sx={{ mt: 1 }}>
                  {course.modules.map((module, index) => (
                    <Accordion key={module.id} defaultExpanded={index === 0} sx={{ backgroundColor: 'background.default', border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 1.5, '&:before': { display: 'none' }, boxShadow: 'none' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Módulo {module.order + 1}: {module.title}</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <List dense disablePadding>
                          {module.lessons && module.lessons.length > 0 ? (
                            module.lessons.map((lesson) => (
                              <ListItemButton key={lesson.id} onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)} sx={{ pl: 3, py: 1.5 }}>
                                <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}><OndemandVideoIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary={`Lección ${lesson.order + 1}: ${lesson.title}`} />
                              </ListItemButton>
                            ))
                          ) : ( <ListItem><ListItemText primary="No hay lecciones." /></ListItem> )}
                        </List>
                        {module.quiz && (
                          <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'left' }}>
                            <Button variant="outlined" color="secondary" size="small" startIcon={<AssessmentIcon />} onClick={() => navigate(`/courses/${courseId}/modules/${module.id}/quiz`)}>Editar Examen</Button>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">Aún no has añadido contenido. Haz clic en 'Editar Curso' para empezar.</Alert>
              )}
            </Box>

            {/* Panel 1: Crear Quiz en Vivo (¡NUEVO!) */}
            <Box sx={{ display: adminTab === 1 ? 'block' : 'none' }}>
              <CreateLiveQuiz 
                courseId={courseId} 
                onQuizCreated={(newQuiz) => {
                  console.log("Quiz en vivo creado:", newQuiz);
                  setSnackbarMessage("¡Quiz en vivo creado con éxito!");
                  setSnackbarSeverity("success");
                  setSnackbarOpen(true);
                  // (Aquí podrías recargar la lista de quizzes en LessonPage si fuera necesario)
                }} 
              />
            </Box>
            
            {/* Panel 2: Crear Quiz de Lección (Maqueta) */}
            <Box sx={{ p: { xs: 2, md: 3 }, display: adminTab === 2 ? 'block' : 'none' }}>
               <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Crear Quiz de Lección</Typography>
               <Alert severity="info">Aquí irá el formulario para crear quizzes con nota (Pilar 3).</Alert>
            </Box>

            {/* Panel 3: Calificaciones (Maqueta) */}
            <Box sx={{ p: { xs: 2, md: 3 }, display: adminTab === 3 ? 'block' : 'none' }}>
               <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Libro de Calificaciones</Typography>
               <Alert severity="info">Aquí irá la tabla con las notas de todos los alumnos.</Alert>
            </Box>
            
            {/* Panel 4: Asistencia (Maqueta) */}
            <Box sx={{ p: { xs: 2, md: 3 }, display: adminTab === 4 ? 'block' : 'none' }}>
               <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Registro de Asistencia</Typography>
               <Alert severity="info">Aquí podrás ver los reportes de asistencia de las clases en vivo.</Alert>
            </Box>

            {/* Panel 5: Archivos y Tareas (Maqueta) */}
            <Box sx={{ p: { xs: 2, md: 3 }, display: adminTab === 5 ? 'block' : 'none' }}>
               <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Gestión de Tareas y Archivos</Typography>
               <Alert severity="info">Aquí podrás subir archivos descargables y crear/editar tareas.</Alert>
            </Box>

          </Paper>

        ) : (

          // --- VISTA DEL ALUMNO (isEnrolled o Visitante) ---
          <Grid container spacing={4}>
            {/* Esta es la vista original que tenías */}
            <Grid item xs={12}> 
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
                  {isEnrolled && (!course.modules || course.modules.length === 0) && (
                    <Alert severity="info">El contenido estará disponible pronto.</Alert>
                  )}
                </Paper>
              </motion.div>
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
        )}
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