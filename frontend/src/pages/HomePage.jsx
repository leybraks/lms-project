import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles'; 
import { motion } from "framer-motion";

import {
  Box, Typography, Paper, Button, Avatar, CircularProgress, List, ListItem, 
  ListItemAvatar, ListItemText, IconButton, Card, CardContent, 
  LinearProgress, Chip, Divider, Alert, Grid, Rating
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

// --- Componentes UI ---
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
            <Chip label={course.modules?.length + " Módulos"} size="small" sx={{ bgcolor:'rgba(0,0,0,0.4)', color:'white', backdropFilter:'blur(4px)' }} />
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

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const statsRes = await axiosInstance.get('/api/dashboard/stats/');
        setStats(statsRes.data);

        if (isProfessor) {
            const [coursesRes, activityRes] = await Promise.all([
                axiosInstance.get('/api/courses/'), 
                axiosInstance.get('/api/dashboard/professor_activity/')
            ]);
            const myCourses = coursesRes.data.filter(c => c.professor.id === user.id);
            setCourses(myCourses);
            setActivityFeed(activityRes.data);
        } else {
            const enrollRes = await axiosInstance.get('/api/enrollments/my_enrollments/');
            setCourses(enrollRes.data.map(e => e.course));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [user, isProfessor]);

  if (loading) return <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;

  return (
    <Box 
      component={motion.div} 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible"
      sx={{ width: '100%', height: '100%', overflowY: 'auto', bgcolor: 'background.default', overflowX: 'hidden' }}
    >
      {/* 1. HERO BANNER (FULL WIDTH) */}
      <Box sx={{ 
          background: `linear-gradient(120deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`, 
          color: 'white', pt: 6, pb: 12, 
          px: { xs: 3, md: 5 }, // Padding lateral consistente
          mb: -8
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
                    onClick={() => alert("Función de Crear Curso Pendiente")}
                >
                    Crear Nuevo Curso
                </Button>
            )}
          </Box>
      </Box>

      {/* 2. CONTENEDOR PRINCIPAL (FULL WIDTH) */}
      <Box sx={{ width: '100%', px: { xs: 3, md: 5 }, pb: 8 }}>
        
        {/* ESTADÍSTICAS */}
        {stats && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 3, mb: 5 }}>
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

        <Grid container spacing={4}>
            {/* COLUMNA IZQUIERDA (PRINCIPAL) - 8/12 */}
            <Grid item xs={12} lg={8}>
                
                {/* Sección de Cursos */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h5" fontWeight="800" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon color="primary"/> {isProfessor ? "Tus Cursos" : "Continuar Aprendiendo"}
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
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
                            <QuickActionCard icon={<BoltIcon />} title="Crear Quiz Rápido" description="Lanzar evaluación" color="warning" onClick={() => {}} />
                            <QuickActionCard icon={<NotificationsActiveIcon />} title="Anuncio" description="Notificar a todos" color="info" onClick={() => {}} />
                            <QuickActionCard icon={<SettingsIcon />} title="Configuración" description="Ajustes de la cuenta" color="grey" onClick={() => {}} />
                        </Box>
                    </Box>
                )}

            </Grid>

            {/* COLUMNA DERECHA (SIDEBAR) - 4/12 */}
            <Grid item xs={12} lg={4}>
                
                {/* 1. WIDGET DE CALENDARIO */}
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

                {/* 2. TOP ESTUDIANTES */}
                <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', mb: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
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

                {/* 3. ACTIVIDAD RECIENTE */}
                <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', mb: 3 }}>
                    <Typography variant="h6" fontWeight="700" mb={2} sx={{display:'flex', alignItems:'center', gap:1}}>
                        <NotificationsActiveIcon color="action"/> Últimas Entregas
                    </Typography>
                    
                    {activityFeed.length > 0 ? (
                        <List>
                            {activityFeed.map((sub) => (
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
                                    <Divider variant="inset" component="li" />
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

                {/* 4. TIP */}
                <Paper sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
                        <HelpOutlineIcon />
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>¿Sabías qué?</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Puedes usar la IA para generar desafíos de código automáticamente en tus lecciones.
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

            </Grid>
        </Grid>

      </Box>
    </Box>
  );
}

export default HomePage;