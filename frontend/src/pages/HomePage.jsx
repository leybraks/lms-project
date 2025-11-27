import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles'; 
import { motion } from "framer-motion";

import {
  Box, Typography, Paper, Button, Avatar, CircularProgress, List, ListItem, 
  ListItemAvatar, ListItemText, IconButton, Card, CardContent, 
  LinearProgress, Chip, Divider, Alert, Grid
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

// --- Componentes UI ---
const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
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
        {/* Chip decorativo */}
        <Chip label="+2% este mes" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }} />
    </Box>
    
    <Box>
      <Typography variant="h3" fontWeight="800" sx={{ mb: 0.5 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" fontWeight="600">{title}</Typography>
    </Box>
  </Paper>
);

const QuickActionCard = ({ icon, title, color, onClick }) => (
    <Paper
        onClick={onClick}
        sx={{
            p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3,
            bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer', transition: '0.2s',
            '&:hover': { bgcolor: 'action.hover', borderColor: `${color}.main` }
        }}
    >
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>{icon}</Avatar>
        <Typography fontWeight="600">{title}</Typography>
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
    <Box sx={{ position: 'relative', height: 140, background: 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%)', p: 3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between'}}>
            <Chip label={course.modules?.length + " Módulos"} size="small" sx={{ bgcolor:'rgba(0,0,0,0.4)', color:'white', backdropFilter:'blur(4px)' }} />
            <Chip label={isProfessor ? "Activo" : "En curso"} color={isProfessor ? "success" : "primary"} size="small" />
        </Box>
        <Typography variant="h5" fontWeight="bold" noWrap sx={{color:'white', mt: 4, textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
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
            sx={{ borderRadius: 2, py: 1 }}
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
      sx={{ width: '100%', height: '100%', overflowY: 'auto', bgcolor: 'background.default' }}
    >
      {/* 1. HERO BANNER CON GRADIENTE */}
      <Box sx={{ 
          background: `linear-gradient(120deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`, 
          color: 'white', pt: 6, pb: 10, px: 4, mb: -6
      }}>
          <Box sx={{ maxWidth: 1600, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
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
                    onClick={() => alert("Función: Crear Nuevo Curso")}
                >
                    Crear Nuevo Curso
                </Button>
            )}
          </Box>
      </Box>

      {/* CONTENEDOR PRINCIPAL */}
      <Box sx={{ maxWidth: 1600, mx: 'auto', px: 4, pb: 8 }}>
        
        {/* 2. ESTADÍSTICAS FLOTANTES */}
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
                        color={isProfessor ? "warning" : "secondary"} 
                    />
                </motion.div>
            </Box>
        )}

        <Grid container spacing={4}>
            {/* COLUMNA IZQUIERDA (PRINCIPAL) */}
            <Grid item xs={12} lg={8}>
                
                {/* Sección de Cursos */}
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
                        <Paper sx={{ p: 4, textAlign: 'center', gridColumn: '1 / -1', bgcolor: 'rgba(255,255,255,0.02)', borderStyle: 'dashed' }}>
                            <Typography variant="h6" color="text.secondary">
                                {isProfessor ? "Aún no has creado ningún curso." : "No estás inscrito en ningún curso."}
                            </Typography>
                            <Button variant="text" sx={{ mt: 1 }}>Explorar Catálogo</Button>
                        </Paper>
                    )}
                </Box>

                {/* Sección Extra para rellenar: Acciones Rápidas */}
                {isProfessor && (
                    <Box sx={{ mt: 6 }}>
                        <Typography variant="h6" fontWeight="700" sx={{ mb: 2, opacity: 0.7 }}>ACCIONES RÁPIDAS</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                            <QuickActionCard icon={<BoltIcon />} title="Crear Quiz Rápido" color="warning" onClick={() => {}} />
                            <QuickActionCard icon={<NotificationsActiveIcon />} title="Enviar Anuncio" color="info" onClick={() => {}} />
                            <QuickActionCard icon={<SettingsIcon />} title="Configuración" color="grey" onClick={() => {}} />
                        </Box>
                    </Box>
                )}

            </Grid>

            {/* COLUMNA DERECHA (SIDEBAR) */}
            <Grid item xs={12} lg={4}>
                
                {/* PANEL DE ACTIVIDAD / NOTIFICACIONES */}
                <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
                    <Typography variant="h6" fontWeight="700" mb={2} sx={{display:'flex', alignItems:'center', gap:1}}>
                        <NotificationsActiveIcon color="action"/> {isProfessor ? "Últimas Entregas" : "Novedades"}
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
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">
                                                    Envió <b>{sub.assignment_title}</b> <br/> {new Date(sub.submitted_at).toLocaleDateString()}
                                                </Typography>
                                            } 
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" sx={{ ml: 7 }} />
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        // EMPTY STATE MEJORADO
                        <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
                            <NotificationsActiveIcon sx={{ fontSize: 48, mb: 1 }} />
                            <Typography variant="body2">No hay actividad reciente.</Typography>
                            <Typography variant="caption">Tus alumnos aparecerán aquí.</Typography>
                        </Box>
                    )}
                </Paper>

                {/* PANEL DE CONSEJOS (RELLENO ÚTIL) */}
                <Paper sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
                        <HelpOutlineIcon />
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {isProfessor ? "¿Sabías qué?" : "Tip de estudio"}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                {isProfessor 
                                    ? "Puedes usar la IA para generar desafíos de código automáticamente en tus lecciones." 
                                    : "Completar tareas a tiempo aumenta tu racha y XP. ¡Sigue así!"}
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