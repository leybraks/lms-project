import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from "framer-motion";

import {
  Box, Typography, Paper, Button, Avatar, CircularProgress, List, ListItem,
  ListItemAvatar, ListItemText, IconButton, Card, CardContent,
  Chip, Divider, Alert, Rating, Modal, TextField, Snackbar, Skeleton
} from '@mui/material';

// --- Iconos ---
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
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// ==========================================
// 1. COMPONENTES UI AUXILIARES
// ==========================================

const StatCard = ({ title, value, icon, color = 'primary', extra }) => (
  <Paper
    sx={{
      p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 160,
      borderRadius: 4, position: 'relative', overflow: 'hidden',
      bgcolor: 'background.paper',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      border: '1px solid rgba(255,255,255,0.05)',
      transition: '0.3s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }
    }}
  >
    <Box sx={{ position: 'absolute', top: -10, right: -10, width: 100, height: 100, bgcolor: `${color}.main`, opacity: 0.1, borderRadius: '50%' }} />

    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
      <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48, boxShadow: 2 }}>{icon}</Avatar>
      {/* Etiqueta decorativa opcional */}
      <Chip label="+2% este mes" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }} />
    </Box>

    <Box>
      <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5 }}>{value !== undefined ? value : '-'}</Typography>
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
      <Typography fontWeight="700" variant="body2">{title}</Typography>
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
      height: '100%', display: 'flex', flexDirection: 'column',
      '&:hover': { transform: 'scale(1.01)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }
    }}
    onClick={() => navigate(`/courses/${course.id}`)}
  >
    <Box sx={{
      position: 'relative', height: 120,
      background: course.main_image_url ? `url(${course.main_image_url}) center/cover` : 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%)',
      p: 2
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Chip
          label={`${course.modules_count || 0} Módulos`}
          size="small"
          sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)' }}
        />
        <Chip label={isProfessor ? (course.is_published ? "Público" : "Borrador") : "En curso"} color={course.is_published ? "success" : "warning"} size="small" />
      </Box>
      <Typography variant="h6" fontWeight="bold" noWrap sx={{ color: 'white', mt: 4, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
        {course.title}
      </Typography>
    </Box>
    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Estudiantes</Typography>
          <Typography variant="body2" fontWeight="bold">{course.enrollments_count || 0}</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Duración</Typography>
          <Typography variant="body2" fontWeight="bold">{course.estimated_duration || "?"}</Typography>
        </Box>
      </Box>
      <Button
        fullWidth
        variant={isProfessor ? "outlined" : "contained"}
        startIcon={isProfessor ? <EditIcon /> : <PlayCircleOutlineIcon />}
        sx={{ borderRadius: 2 }}
      >
        {isProfessor ? "Gestionar" : "Continuar"}
      </Button>
    </CardContent>
  </Card>
);

// --- CARRUSEL SIDEBAR (Con Flechas Flotantes) ---
const SidebarCarousel = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play (opcional, pausar al hover sería ideal pero simple por ahora)
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 10000); // 10 segundos para dar tiempo a leer
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
    width: 32, height: 32, '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, boxShadow: 3
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', pb: 3 }}>
      <Box sx={{ overflow: 'hidden', borderRadius: 4, position: 'relative', minHeight: 300 }}>
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%' }}
          >
            {children[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Flechas Flotantes */}
      <IconButton onClick={prevSlide} size="small" sx={{ ...navButtonStyle, left: 8 }}>
        <ArrowBackIosNewIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
      </IconButton>
      <IconButton onClick={nextSlide} size="small" sx={{ ...navButtonStyle, right: 8 }}>
        <ArrowForwardIosIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
      </IconButton>

      {/* Indicadores (Puntitos) */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, position: 'absolute', bottom: 0, width: '100%', left: 0 }}>
        {children.map((_, index) => (
          <FiberManualRecordIcon
            key={index}
            sx={{
              fontSize: 10,
              cursor: 'pointer',
              color: index === currentIndex ? 'primary.main' : 'text.disabled',
              transition: '0.3s'
            }}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </Box>
    </Box>
  );
};

// ==========================================
// 2. COMPONENTE PRINCIPAL: HOME PAGE
// ==========================================
function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isProfessor = user?.role === 'PROFESSOR';

  // --- Estados de Datos ---
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]); // Para Widget 1
  const [activityFeed, setActivityFeed] = useState([]); // Para Widget 2 (Profe)
  const [upcomingLessons, setUpcomingLessons] = useState([]); // Para Widget 2 (Alumno)
  const [loading, setLoading] = useState(true);

  // --- Estados de UI ---
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, msg: "", severity: "success" });

  // --- Fetch Data ---
  const fetchData = async () => {
    if (!user) return;
    try {
      // 1. Estadísticas Generales
      const statsRes = await axiosInstance.get('/api/dashboard/stats/');
      setStats(statsRes.data);

      // 2. Cursos y Actividad según Rol
      if (isProfessor) {
        // Cursos creados por mí (Filtrando en front si endpoint devuelve todos, o idealmente endpoint filtrado)
        const coursesRes = await axiosInstance.get('/api/courses/all/');
        const myCourses = coursesRes.data.filter(c => c.professor.username === user.username);
        setCourses(myCourses);

        // Actividad de alumnos (Submissions)
        try {
          const actRes = await axiosInstance.get('/api/dashboard/professor_activity/');
          setActivityFeed(actRes.data);
        } catch (e) { console.log("No activity feed yet"); }

      } else {
        // Cursos inscritos
        const enrollRes = await axiosInstance.get('/api/enrollments/my_enrollments/');
        setCourses(enrollRes.data.map(e => e.course));

        // Próximas Lecciones
        try {
          const upRes = await axiosInstance.get('/api/dashboard/upcoming_lessons/');
          setUpcomingLessons(upRes.data);
        } catch (e) { console.log("No upcoming lessons"); }
      }

      // 3. Leaderboard (Común para todos)
      try {
        const lbRes = await axiosInstance.get('/api/dashboard/leaderboard/');
        setLeaderboard(lbRes.data);
      } catch (e) {
        // Si falla (endpoint no existe aún), ponemos datos vacíos para no romper la UI
        console.log("Leaderboard endpoint missing");
      }

    } catch (err) {
      console.error("Error cargando dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // --- Handlers ---
  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim()) return;
    setCreatingCourse(true);
    try {
      // Asumiendo que tu API acepta title y description
      const res = await axiosInstance.post('/api/courses/', {
        title: newCourseTitle,
        description: newCourseDesc,
        is_published: false // Borrador por defecto
      });
      setSnackbar({ open: true, msg: "¡Curso creado con éxito!", severity: "success" });
      setOpenCreateModal(false);
      setNewCourseTitle("");
      setNewCourseDesc("");
      fetchData(); // Recargar la lista
      
      // Opcional: Redirigir al curso creado
      // navigate(`/courses/${res.data.id}`);

    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, msg: "Error al crear curso.", severity: "error" });
    } finally {
      setCreatingCourse(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

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
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
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
              sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold', boxShadow: 3, '&:hover': { bgcolor: '#f0f0f0' } }}
              onClick={() => setOpenCreateModal(true)}
            >
              Crear Nuevo Curso
            </Button>
          )}
        </Box>
      </Box>

      {/* 2. CONTENEDOR PRINCIPAL */}
      <Box sx={{ width: '100%', px: { xs: 3, md: 5 }, pb: 8 }}>

        {/* --- ESTADÍSTICAS (4 Columnas) --- */}
        {stats && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
                title={isProfessor ? "Valoración" : "XP Acumulado"}
                value={isProfessor ? "4.8" : stats.total_xp}
                icon={isProfessor ? <StarIcon /> : <BoltIcon />}
                color="secondary"
                extra={isProfessor && <Rating value={4.8} precision={0.5} readOnly size="small" sx={{ mt: 1 }} />}
              />
            </motion.div>
          </Box>
        )}

        {/* --- GRID PRINCIPAL (Contenido + Sidebar) --- */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 360px' },
          gap: 4,
          alignItems: 'start',
          width: '100%'
        }}>

          {/* === COLUMNA IZQUIERDA (Cursos y Acciones) === */}
          <Box sx={{ minWidth: 0 }}>

            {/* SECCIÓN DE CURSOS */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h5" fontWeight="800" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="primary" /> {isProfessor ? "Tus Cursos Creados" : "Continuar Aprendiendo"}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3 }}>
                {courses.length > 0 ? (
                  courses.map(course => (
                    <motion.div key={course.id} variants={itemVariants}>
                      <CourseCard course={course} isProfessor={isProfessor} navigate={navigate} />
                    </motion.div>
                  ))
                ) : (
                  <Box sx={{ gridColumn: '1/-1' }}>
                    <Alert severity="info" variant="outlined" sx={{ width: '100%' }}>
                      {isProfessor ? "Aún no has creado ningún curso. ¡Crea el primero arriba!" : "No estás inscrito en ningún curso. Visita el catálogo."}
                    </Alert>
                    {!isProfessor && (
                        <Button variant="contained" sx={{mt:2}} onClick={() => navigate('/courses')}>
                            Ir al Catálogo
                        </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            {/* ACCIONES RÁPIDAS (Solo Profesor) */}
            {isProfessor && (
              <Box>
                <Typography variant="h6" fontWeight="700" sx={{ mb: 3, opacity: 0.7 }}>ACCIONES RÁPIDAS</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 2 }}>
                  <QuickActionCard
                    icon={<BoltIcon />} title="Crear Quiz Rápido" description="Ir a un curso" color="warning"
                    onClick={() => setSnackbar({ open: true, msg: "Ve al detalle de un curso > Lección para crear un Quiz.", severity: "info" })}
                  />
                  <QuickActionCard
                    icon={<NotificationsActiveIcon />} title="Anuncio" description="Notificar a todos" color="info"
                    onClick={() => setSnackbar({ open: true, msg: "Función de anuncios próximamente.", severity: "info" })}
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

            {/* 1. AGENDA / PRÓXIMAS LECCIONES (Estática) */}
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', mb: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="h6" fontWeight="700" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonthIcon color="primary" /> {isProfessor ? "Agenda Docente" : "Próximas Lecciones"}
              </Typography>
              <List dense>
                 {isProfessor ? (
                     <>
                        <ListItem>
                            <ListItemAvatar><Avatar sx={{bgcolor: 'primary.light', color:'primary.main', fontSize:'0.8rem'}}>28</Avatar></ListItemAvatar>
                            <ListItemText primary="Entrega Final Python" secondary="Hoy, 23:59" />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                        <ListItem>
                            <ListItemAvatar><Avatar sx={{bgcolor: 'secondary.light', color:'secondary.main', fontSize:'0.8rem'}}>30</Avatar></ListItemAvatar>
                            <ListItemText primary="Revisión de Calificaciones" secondary="Viernes, 10:00 AM" />
                        </ListItem>
                     </>
                 ) : (
                    upcomingLessons.length > 0 ? (
                        upcomingLessons.map((lesson, i) => (
                             <ListItem key={lesson.id} disablePadding sx={{mb:1}}>
                                <ListItemAvatar><Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.light' }}>{i+1}</Avatar></ListItemAvatar>
                                <ListItemText primary={lesson.title} secondary={<Box display="flex" alignItems="center" gap={0.5}><AccessTimeIcon fontSize="inherit"/> {lesson.duration || "15m"}</Box>} />
                             </ListItem>
                        ))
                    ) : (
                        <ListItem><ListItemText primary="No hay lecciones pendientes." secondary="¡Estás al día!" /></ListItem>
                    )
                 )}
              </List>
            </Paper>

            {/* 2. CARRUSEL DE WIDGETS */}
            <SidebarCarousel>

              {/* SLIDE A: TOP ESTUDIANTES (LEADERBOARD) */}
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                <Typography variant="h6" fontWeight="700" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsIcon color="warning" /> Ranking Global
                </Typography>
                <List dense>
                  {leaderboard.length > 0 ? (
                    leaderboard.map((student, index) => (
                      <ListItem key={student.id} secondaryAction={<Chip size="small" label={`${student.experience_points} XP`} color="warning" variant="outlined"/>}>
                        <ListItemAvatar>
                            <Avatar src={student.profile_image} sx={{ width: 32, height: 32, bgcolor:'primary.main' }}>{student.username[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={student.username}
                          secondary={`Nivel ${Math.floor(student.experience_points / 1000) + 1}`}
                        />
                        {index < 3 && <Box sx={{position:'absolute', top: 8, left: 8, fontSize:'0.7rem'}}>#{index+1}</Box>}
                      </ListItem>
                    ))
                  ) : (
                    <Box textAlign="center" py={2} opacity={0.6}>
                        <EmojiEventsIcon fontSize="large"/>
                        <Typography variant="body2">Cargando ranking...</Typography>
                    </Box>
                  )}
                </List>
              </Paper>

              {/* SLIDE B: ACTIVIDAD RECIENTE (Dinámica para Profe) */}
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                <Typography variant="h6" fontWeight="700" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsActiveIcon color="action" /> {isProfessor ? "Entregas Recientes" : "Novedades"}
                </Typography>
                {isProfessor ? (
                  activityFeed.length > 0 ? (
                    <List>
                      {activityFeed.slice(0, 3).map((sub) => (
                        <React.Fragment key={sub.id}>
                          <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.8rem' }}>
                                {sub.user_username ? sub.user_username[0].toUpperCase() : '?'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={<Typography variant="subtitle2" fontWeight="bold">{sub.user_username}</Typography>}
                              secondary={`${sub.assignment_title || "Tarea"} • ${new Date(sub.submitted_at).toLocaleDateString()}`}
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3, opacity: 0.5 }}>
                      <NotificationsActiveIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="caption" display="block">No hay entregas recientes.</Typography>
                    </Box>
                  )
                ) : (
                    <Box sx={{ py: 2 }}>
                        <Typography variant="body2" paragraph>
                            ¡Nuevo curso de <strong>Data Science</strong> disponible!
                        </Typography>
                        <Button variant="text" size="small" onClick={() => navigate('/courses')}>Ver Catálogo</Button>
                    </Box>
                )}
              </Paper>

              {/* SLIDE C: TIP DEL DÍA */}
              <Paper sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', color: 'white', height: '100%', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
                  <HelpOutlineIcon fontSize="large" />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>¿Sabías qué?</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Programar 30 minutos al día es más efectivo que hacer maratones de 10 horas el fin de semana. ¡La constancia es clave!
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
            {creatingCourse ? <CircularProgress size={24} /> : "Guardar Curso"}
          </Button>
        </Paper>
      </Modal>

      {/* --- SNACKBAR --- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.msg}</Alert>
      </Snackbar>

    </Box>
  );
}

export default HomePage;