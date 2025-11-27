
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles'; 
import { motion, AnimatePresence } from "framer-motion";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import {
  Box, Typography, Paper, Button, Avatar, CircularProgress, List, ListItem, 
  ListItemAvatar, ListItemText, IconButton, Card, CardContent, 
  LinearProgress, Chip, Divider, Alert, Rating, Modal, TextField, Snackbar
} from '@mui/material';

// Iconos
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import BoltIcon from '@mui/icons-material/Bolt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// --- Componentes UI (Tus componentes originales) ---
const StatCard = ({ title, value, icon, color = 'primary', extra }) => (
  <Paper
    sx={{
      p: 3, display: 'flex', flexDirection: 'column', justifyContent:'space-between', height: 160,
      borderRadius: 4, position: 'relative', overflow: 'hidden',
      bgcolor: 'background.paper', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.05)',
      transition: '0.3s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.2)' }
    }}
  >
    <Box sx={{ position: 'absolute', top: -10, right: -10, width: 100, height: 100, bgcolor: `${color}.main`, opacity: 0.1, borderRadius: '50%' }} />
    
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48, boxShadow: 2 }}>{icon}</Avatar>
        <Chip label="+2% este mes" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }} />
    </Box>
    
    <Box>
      <Typography variant="h3" fontWeight="800" sx={{ mb: 0.5 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" fontWeight="600">{title}</Typography>
      {extra}
    </Box>
  </Paper>
);

const QuickActionCard = ({ icon, title, color, description, onClick }) => (
    <Paper
        onClick={onClick}
        sx={{
            p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3,
            bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer', transition: '0.2s',
            '&:hover': { bgcolor: 'action.hover', borderColor: `${color}.main`, transform: 'translateX(5px)' }
        }}
    >
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 50, height: 50 }}>{icon}</Avatar>
        <Box>
            <Typography fontWeight="700">{title}</Typography>
            <Typography variant="caption" color="text.secondary">{description}</Typography>
        </Box>
    </Paper>
);

const CourseCard = ({ course, isProfessor, navigate }) => (
  <Card 
    sx={{ 
        borderRadius: 4, bgcolor: 'background.paper', 
        border: '1px solid rgba(255,255,255,0.05)', mb: 2,
        cursor: 'pointer', transition: '0.2s', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        '&:hover': { transform: 'scale(1.01)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }
    }}
    onClick={() => navigate(`/courses/${course.id}`)}
  >
    <Box sx={{ position: 'relative', height: 120, background: 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%)', p: 3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between'}}>
            <Chip 
                label={`${course.modules_count || 0} Módulos`} 
                size="small" 
                sx={{ bgcolor:'rgba(0,0,0,0.4)', color:'white', backdropFilter:'blur(4px)' }} 
            />
            <Chip label={isProfessor ? "Activo" : "En curso"} color={isProfessor ? "success" : "primary"} size="small" />
        </Box>
        <Typography variant="h5" fontWeight="bold" noWrap sx={{color:'white', mt: 2}}>
            {course.title}
        </Typography>
    </Box>
    <CardContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Estudiantes</Typography>
                <Typography variant="body1" fontWeight="bold">{course.enrollments_count || 0}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Duración</Typography>
                <Typography variant="body1" fontWeight="bold">{course.estimated_duration || "?"}</Typography>
            </Box>
        </Box>
        <Button 
            fullWidth 
            variant={isProfessor ? "outlined" : "contained"} 
            startIcon={isProfessor ? <EditIcon /> : <PlayCircleOutlineIcon />}
            sx={{ borderRadius: 2 }}
        >
            {isProfessor ? "Gestionar Curso" : "Continuar"}
        </Button>
    </CardContent>
  </Card>
);

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

// === COMPONENTE CARRUSEL PARA SIDEBAR (FLECHAS DENTRO) ===
const SidebarCarousel = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 8000); // Un poco más lento para leer
    return () => clearInterval(timer);
  }, [currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % children.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? children.length - 1 : prev - 1));
  };

  const navButtonStyle = {
      position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
      bgcolor: 'rgba(0,0,0,0.4)', color: 'white', backdropFilter: 'blur(4px)', 
      width: 36, height: 36, '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, boxShadow: 3
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', pb: 3 }}>
      <Box sx={{ overflow: 'hidden', borderRadius: 4, position: 'relative' }}> 
        <AnimatePresence mode='wait'>
            <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            >
            {children[currentIndex]}
            </motion.div>
        </AnimatePresence>
      </Box>

      <IconButton onClick={prevSlide} size="small" sx={{ ...navButtonStyle, left: 8 }}><ArrowBackIosNewIcon fontSize="small" sx={{ fontSize: '1rem' }} /></IconButton>
      <IconButton onClick={nextSlide} size="small" sx={{ ...navButtonStyle, right: 8 }}><ArrowForwardIosIcon fontSize="small" sx={{ fontSize: '1rem' }}/></IconButton>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, position: 'absolute', bottom: 0, width: '100%', left: 0 }}>
            {children.map((_, index) => (
                <FiberManualRecordIcon 
                    key={index} 
                    sx={{ fontSize: 10, cursor: 'pointer', color: index === currentIndex ? 'primary.main' : 'rgba(255,255,255,0.2)', transition: '0.3s' }}
                    onClick={() => setCurrentIndex(index)}
                />
            ))}
      </Box>
    </Box>
  );
};

// === COMPONENTE PRINCIPAL ===
function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme(); 
  const isProfessor = user?.role === 'PROFESSOR';

  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]); 
  const [activityFeed, setActivityFeed] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Estado para Modal de Crear Curso
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Cargar datos iniciales
  const fetchData = async () => {
      if (!user) return;
      try {
        // No mostramos spinner global al recargar para que sea fluido
        // setLoading(true); 
        const statsRes = await axiosInstance.get('/api/dashboard/stats/');
        setStats(statsRes.data);

        if (isProfessor) {
            const [coursesRes, activityRes] = await Promise.all([
                axiosInstance.get('/api/courses/'), 
                axiosInstance.get('/api/dashboard/professor_activity/')
            ]);
            // Filtramos solo los cursos del profesor actual
            const myCourses = coursesRes.data.filter(c => c.professor.id === user.id);
            setCourses(myCourses);
            setActivityFeed(activityRes.data);
        } else {
            const enrollRes = await axiosInstance.get('/api/enrollments/my_enrollments/');
            setCourses(enrollRes.data.map(e => e.course));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [user, isProfessor]);

  // Función para crear curso real
  const handleCreateCourse = async () => {
      if (!newCourseTitle.trim()) return;
      setCreatingCourse(true);
      try {
          await axiosInstance.post('/api/courses/', {
              title: newCourseTitle,
              description: newCourseDesc,
              is_published: true // Publicado por defecto para simplificar
          });
          setSnackbarMessage("¡Curso creado exitosamente!");
          setSnackbarOpen(true);
          setOpenCreateModal(false);
          setNewCourseTitle("");
          setNewCourseDesc("");
          fetchData(); // Recargar la lista
      } catch (err) {
          console.error(err);
          setSnackbarMessage("Error al crear el curso.");
          setSnackbarOpen(true);
      } finally {
          setCreatingCourse(false);
      }
  };

  if (loading) return <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;

  return (
    <Box 
      component={motion.div} 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible"
      sx={{ width: '100%', height: '100%', overflowY: 'auto', bgcolor: 'background.default', overflowX: 'hidden' }}
    >
      {/* 1. HERO BANNER */}
      <Box sx={{ 
          background: `linear-gradient(120deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`, 
          color: 'white', pt: 6, pb: 12, 
          px: { xs: 3, md: 5 }, 
          mb: -8,
          width: '100%'
      }}>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box>
                <Typography variant="h3" fontWeight="800" sx={{ mb: 1 }}>
                    Hola, {user.username} 👋
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>
                    {isProfessor ? "Bienvenido a tu centro de comando docente." : "¡Es un gran día para aprender algo nuevo!"}
                </Typography>
            </Box>
            {isProfessor && (
                <Button 
                    variant="contained" 
                    size="large"
                    startIcon={<AddIcon />} 
                    sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold', boxShadow: 3, '&:hover':{bgcolor:'#f0f0f0'} }}
                    onClick={() => setOpenCreateModal(true)} // Abrir modal
                >
                    Crear Nuevo Curso
                </Button>
            )}
          </Box>
      </Box>

      {/* 2. CONTENEDOR PRINCIPAL */}
      <Box sx={{ width: '100%', px: { xs: 3, md: 5 }, pb: 8 }}>
        
        {/* --- ESTADÍSTICAS --- */}
        {stats && (
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                gap: 3, mb: 5, width: '100%' 
            }}>
                <motion.div variants={itemVariants}>
                    <StatCard 
                        title={isProfessor ? "Total Estudiantes" : "Cursos Inscritos"} 
                        value={isProfessor ? stats.total_students : stats.enrolled_courses} 
                        icon={isProfessor ? <PeopleIcon /> : <LibraryBooksIcon />} 
                        color="primary" 
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard 
                        title={isProfessor ? "Cursos Activos" : "Lecciones Listas"} 
                        value={isProfessor ? stats.courses_created : stats.lessons_completed} 
                        icon={isProfessor ? <SchoolIcon /> : <CheckCircleOutlineIcon />} 
                        color="success" 
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard 
                        title={isProfessor ? "Tareas Pendientes" : "Tareas Enviadas"} 
                        value={isProfessor ? stats.pending_tasks : stats.assignments_submitted} 
                        icon={<AssignmentTurnedInIcon />} 
                        color="warning" 
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <StatCard 
                        title="Valoración Promedio" 
                        value="4.8" 
                        icon={<StarIcon />} 
                        color="secondary"
                        extra={<Rating value={4.5} precision={0.5} readOnly size="small" sx={{mt:1}} />} 
                    />
                </motion.div>
            </Box>
        )}

        <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 360px' }, 
            gap: 4,
            alignItems: 'start',
            width: '100%'
        }}>
            
            {/* === COLUMNA IZQUIERDA (Principal) === */}
            <Box sx={{ minWidth: 0 }}> 
                
                {/* Sección de Cursos */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h5" fontWeight="800" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon color="primary"/> {isProfessor ? "Tus Cursos" : "Continuar Aprendiendo"}
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                        {courses.length > 0 ? (
                            courses.map(course => (
                                <motion.div key={course.id} variants={itemVariants}>
                                    <CourseCard course={course} isProfessor={isProfessor} navigate={navigate} />
                                </motion.div>
                            ))
                        ) : (
                            <Alert severity="info" sx={{ width: '100%' }}>
                                {isProfessor ? "Aún no has creado ningún curso." : "No estás inscrito en ningún curso."}
                            </Alert>
                        )}
                    </Box>
                </Box>

                {/* ACCIONES RÁPIDAS */}
                {isProfessor && (
                    <Box>
                        <Typography variant="h6" fontWeight="700" sx={{ mb: 3, opacity: 0.7 }}>ACCIONES RÁPIDAS</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 2 }}>
                            <QuickActionCard 
                                icon={<BoltIcon />} title="Crear Quiz Rápido" description="Ir a un curso para crear" color="warning" 
                                onClick={() => setSnackbarMessage("Entra a un curso > Lección para crear un Quiz.") || setSnackbarOpen(true)} 
                            />
                            <QuickActionCard 
                                icon={<NotificationsActiveIcon />} title="Anuncio" description="Notificar a todos" color="info" 
                                onClick={() => setSnackbarMessage("Función de anuncios próximamente.") || setSnackbarOpen(true)} 
                            />
                            <QuickActionCard 
                                icon={<SettingsIcon />} title="Configuración" description="Ajustes de la cuenta" color="grey" 
                                onClick={() => navigate('/settings')} 
                            />
                        </Box>
                    </Box>
                )}
            </Box>

            {/* === COLUMNA DERECHA (SIDEBAR FIJO) === */}
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 }, height: 'fit-content' }}>
              
              {/* 1. AGENDA (ESTÁTICA PARA DISEÑO) */}
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', mb: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h6" fontWeight="700" mb={2} sx={{display:'flex', alignItems:'center', gap:1}}>
                      <CalendarMonthIcon color="primary"/> Agenda
                  </Typography>
                  <List dense>
                      <ListItem>
                          <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', fontSize: '0.8rem', fontWeight: 'bold' }}>27</Avatar>
                          </ListItemAvatar>
                          <ListItemText primary="Entrega Proyecto Final" secondary="Curso Python • 23:59" />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                          <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', fontSize: '0.8rem', fontWeight: 'bold' }}>30</Avatar>
                          </ListItemAvatar>
                          <ListItemText primary="Revisión de Notas" secondary="General • 10:00 AM" />
                      </ListItem>
                  </List>
              </Paper>

              {/* === CARRUSEL DE WIDGETS === */}
              <SidebarCarousel>
                  
                  {/* SLIDE 1: TOP ESTUDIANTES (ESTÁTICO PARA DISEÑO) */}
                  <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                      <Typography variant="h6" fontWeight="700" mb={2} sx={{display:'flex', alignItems:'center', gap:1}}>
                          <EmojiEventsIcon color="warning"/> Top Estudiantes
                      </Typography>
                      <List>
                          <ListItem>
                              <ListItemAvatar><Avatar src="https://i.pravatar.cc/150?img=1" /></ListItemAvatar>
                              <ListItemText primary="Maria Lopez" secondary="1500 XP • Nivel 12" />
                              <Chip size="small" label="#1" color="warning" />
                          </ListItem>
                          <ListItem>
                              <ListItemAvatar><Avatar src="https://i.pravatar.cc/150?img=2" /></ListItemAvatar>
                              <ListItemText primary="Carlos Diaz" secondary="1420 XP • Nivel 11" />
                              <Chip size="small" label="#2" color="default" />
                          </ListItem>
                      </List>
                  </Paper>

                  {/* SLIDE 2: ACTIVIDAD RECIENTE (REAL DEL BACKEND) */}
                  <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                      <Typography variant="h6" fontWeight="700" mb={2} sx={{display:'flex', alignItems:'center', gap:1}}>
                          <NotificationsActiveIcon color="action"/> Últimas Entregas
                      </Typography>
                      {activityFeed.length > 0 ? (
                          <List>
                              {activityFeed.slice(0, 3).map((sub) => (
                                  <React.Fragment key={sub.id}>
                                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                          <ListItemAvatar>
                                              <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, fontSize: '0.9rem' }}>
                                                  {sub.user_username ? sub.user_username[0].toUpperCase() : '?'}
                                              </Avatar>
                                          </ListItemAvatar>
                                          <ListItemText 
                                              primary={<Typography variant="subtitle2" fontWeight="bold">{sub.user_username}</Typography>}
                                              secondary={`${sub.assignment_title || "Tarea"} • ${new Date(sub.submitted_at).toLocaleDateString()}`}
                                          />
                                      </ListItem>
                                  </React.Fragment>
                              ))}
                          </List>
                      ) : (
                          <Box sx={{ textAlign: 'center', py: 3, opacity: 0.5 }}>
                              <NotificationsActiveIcon sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="caption" display="block">No hay actividad reciente.</Typography>
                          </Box>
                      )}
                  </Paper>

                  {/* SLIDE 3: TIP */}
                  <Paper sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', color: 'white', height: '100%', display:'flex', alignItems:'center' }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
                          <HelpOutlineIcon fontSize="large"/>
                          <Box>
                              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>¿Sabías qué?</Typography>
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                  Puedes usar la IA para generar desafíos de código automáticamente en tus lecciones. ¡Inténtalo en el editor!
                              </Typography>
                          </Box>
                      </Box>
                  </Paper>

              </SidebarCarousel>
          </Box>
        </Box> 
      </Box>

      {/* --- MODAL: CREAR CURSO --- */}
      <Modal open={openCreateModal} onClose={() => setOpenCreateModal(false)}>
        <Paper sx={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, p: 4, borderRadius: 2, textAlign: 'center' 
        }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Crear Nuevo Curso</Typography>
            <TextField 
                fullWidth label="Título del Curso" sx={{ mb: 2 }} 
                value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)}
            />
            <TextField 
                fullWidth label="Descripción Breve" multiline rows={3} sx={{ mb: 3 }} 
                value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)}
            />
            <Button 
                fullWidth variant="contained" size="large"
                disabled={creatingCourse || !newCourseTitle}
                onClick={handleCreateCourse}
            >
                {creatingCourse ? <CircularProgress size={24} /> : "Crear Curso"}
            </Button>
        </Paper>
      </Modal>

      {/* Feedback */}
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
    </Box>
  );
}

export default HomePage;