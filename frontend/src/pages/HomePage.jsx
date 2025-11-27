import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles'; 
import { motion } from "framer-motion";

import {
  Box, Typography, Paper, Button, Avatar, CircularProgress, List, ListItem, 
  ListItemAvatar, ListItemText, IconButton, Card, CardContent, 
  LinearProgress, Chip, Divider, Alert
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

// --- Componentes UI ---
const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Paper
    sx={{
      p: 3, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 4, height: '100%',
      bgcolor: 'rgba(255, 255, 255, 0.05)', 
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: '0.3s',
      '&:hover': { transform: 'translateY(-4px)', bgcolor: 'rgba(255, 255, 255, 0.08)' }
    }}
  >
    <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>{icon}</Avatar>
    <Box>
      <Typography variant="h4" fontWeight="bold">{value}</Typography>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
    </Box>
  </Paper>
);

const CourseCard = ({ course, isProfessor, navigate }) => (
  <Card 
    sx={{ 
        borderRadius: 4, bgcolor: 'rgba(255,255,255,0.05)', 
        border: '1px solid rgba(255,255,255,0.1)', mb: 2,
        cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'scale(1.02)' }
    }}
    onClick={() => navigate(`/courses/${course.id}`)}
  >
    <Box sx={{ position: 'relative', height: 120, bgcolor: isProfessor ? 'secondary.dark' : 'primary.dark', p: 2 }}>
        <Typography variant="h6" fontWeight="bold" noWrap sx={{color:'white'}}>{course.title}</Typography>
        <Box sx={{ position: 'absolute', bottom: 10, left: 10 }}>
            <Chip 
                label={isProfessor ? 'Instructor' : 'Estudiante'} 
                color={isProfessor ? "secondary" : "primary"} 
                size="small" 
            />
        </Box>
    </Box>
    <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {course.description?.substring(0, 60)}...
        </Typography>
        <Button 
            fullWidth 
            variant="outlined" 
            size="small"
            startIcon={isProfessor ? <EditIcon /> : <PlayCircleOutlineIcon />}
        >
            {isProfessor ? "Gestionar" : "Continuar"}
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
        
        // 1. Cargar Estadísticas Reales
        const statsRes = await axiosInstance.get('/api/dashboard/stats/');
        setStats(statsRes.data);

        if (isProfessor) {
            // --- PROFESOR: Cargar Cursos Creados y Actividad Real ---
            // Nota: Asumo que tienes un endpoint /courses/ que lista tus cursos. 
            // Si no, usa el endpoint de ListaDeCursosView filtrando en el frontend o crea uno específico.
            const [coursesRes, activityRes] = await Promise.all([
                axiosInstance.get('/api/courses/'), 
                axiosInstance.get('/api/dashboard/professor_activity/')
            ]);
            
            // Filtrar solo mis cursos (si la API devuelve todos)
            const myCourses = coursesRes.data.filter(c => c.professor.id === user.id);
            setCourses(myCourses);
            setActivityFeed(activityRes.data);

        } else {
            // --- ALUMNO: Cargar Inscripciones ---
            const enrollRes = await axiosInstance.get('/api/enrollments/my_enrollments/');
            setCourses(enrollRes.data.map(e => e.course));
        }

      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
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
      sx={{ p: 4, width: '100%', height: '100%', overflowY: 'auto' }}
    >
      {/* ENCABEZADO */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h4" fontWeight="800">Hola, {user.username} 👋</Typography>
            <Typography color="text.secondary">
                {isProfessor ? "Panel de Administración Docente" : "Panel de Aprendizaje"}
            </Typography>
        </Box>
        {isProfessor && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => alert("Implementar crear curso")}>
                Nuevo Curso
            </Button>
        )}
      </Box>

      {/* ESTADÍSTICAS (DATOS REALES DEL BACKEND) */}
      {stats && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 3, mb: 5 }}>
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
                    title={isProfessor ? "Cursos Creados" : "Lecciones Completadas"} 
                    value={isProfessor ? stats.courses_created : stats.lessons_completed} 
                    icon={isProfessor ? <SchoolIcon /> : <CheckCircleOutlineIcon />} 
                    color="success" 
                />
            </motion.div>
            <motion.div variants={itemVariants}>
                <StatCard 
                    title={isProfessor ? "Pendientes de Calificar" : "Tareas Entregadas"} 
                    value={isProfessor ? stats.pending_tasks : stats.assignments_submitted} 
                    icon={<AssignmentTurnedInIcon />} 
                    color={isProfessor ? "warning" : "secondary"} 
                />
            </motion.div>
          </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { md: '2fr 1fr' }, gap: 4 }}>
        
        {/* COLUMNA IZQUIERDA: LISTA DE CURSOS REALES */}
        <Box>
            <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>
                {isProfessor ? "Tus Cursos" : "Tus Inscripciones"}
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 3 }}>
                {courses.length > 0 ? (
                    courses.map(course => (
                        <motion.div key={course.id} variants={itemVariants}>
                            <CourseCard course={course} isProfessor={isProfessor} navigate={navigate} />
                        </motion.div>
                    ))
                ) : (
                    <Alert severity="info">
                        {isProfessor ? "Aún no has creado cursos." : "No estás inscrito en ningún curso."}
                    </Alert>
                )}
            </Box>
        </Box>

        {/* COLUMNA DERECHA: FEED REAL O MASCOTA */}
        <Box>
            {isProfessor ? (
                // FEED DE ACTIVIDAD REAL (Últimas entregas)
                <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" fontWeight="700" mb={2} sx={{display:'flex', alignItems:'center', gap:1}}>
                        <NotificationsActiveIcon color="action"/> Últimas Entregas
                    </Typography>
                    
                    {activityFeed.length > 0 ? (
                        <List>
                            {activityFeed.map((sub) => (
                                <React.Fragment key={sub.id}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                {sub.user_username ? sub.user_username[0].toUpperCase() : '?'}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {sub.user_username || "Estudiante"}
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="caption" display="block" color="text.primary">
                                                        {sub.assignment_title || "Tarea"}
                                                    </Typography>
                                                    <Typography variant="caption">
                                                        {new Date(sub.submitted_at).toLocaleDateString()}
                                                    </Typography>
                                                </>
                                            } 
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary" align="center">
                            No hay actividad reciente.
                        </Typography>
                    )}
                    
                    {activityFeed.length > 0 && (
                        <Button fullWidth variant="text" sx={{ mt: 2 }}>Ver todas las entregas</Button>
                    )}
                </Paper>
            ) : (
                // PANEL MASCOTA (Datos reales de XP)
                <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="700">Tu Mascota</Typography>
                    {/* Lógica simple de nivel basada en XP real */}
                    <Typography variant="h1" sx={{ my: 2 }}>
                        {stats?.total_xp > 500 ? '🐉' : stats?.total_xp > 200 ? '🐣' : '🥚'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {stats?.total_xp > 500 ? 'Dragón Maestro' : stats?.total_xp > 200 ? 'Dragón Bebé' : 'Huevo de Dragón'}
                    </Typography>
                    <LinearProgress 
                        variant="determinate" 
                        value={Math.min((stats?.total_xp % 100), 100)} 
                        sx={{ mt: 2, height: 8, borderRadius: 4 }} 
                    />
                    <Typography variant="caption">{stats?.total_xp || 0} XP Total</Typography>
                </Paper>
            )}
        </Box>

      </Box>
    </Box>
  );
}

export default HomePage;