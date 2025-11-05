import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles'; 
import { motion } from "framer-motion"; // <-- ¡Importado para animaciones!

import {
  Box,
  Typography,
  Grid, 
  Paper,
  Button,
  Avatar,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  LinearProgress,
  Modal,
  Fade,
  Backdrop,
  Alert 
} from '@mui/material';

// Iconos
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

// === COMPONENTES AUXILIARES (Sin cambios) ===
const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Paper
    sx={{
      p: { xs: 2, sm: 3 },
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      borderRadius: 4,
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)', 
      border: `1px solid rgba(255, 255, 255, 0.125)`,
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-6px)',
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.15)', 
      }
    }}
  >
    <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56, flexShrink: 0 }}>{icon}</Avatar>
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Box>
  </Paper>
);

const FakeBarChart = () => { /* ... (Tu código, sin cambios) ... */ };

const CourseProgressCard = ({ title, watched, total, color }) => (
  <Paper
    sx={{
      p: 2,
      borderRadius: 4,
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)', 
      border: `1px solid rgba(255, 255, 255, 0.125)`,
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-6px)',
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
      }
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 40, height: 40 }}>
        <LibraryBooksIcon fontSize="small" />
      </Avatar>
      <IconButton size="small">
        <MoreHorizIcon />
      </IconButton>
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {/* Evita división por cero si total es 0 */}
      {watched}/{total} watched
    </Typography>
    <LinearProgress
      variant="determinate"
      value={(total > 0) ? (watched / total) * 100 : 0}
      color={color}
      sx={{ height: 6, borderRadius: 3, mt: 1 }}
    />
  </Paper>
);

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', md: 700 },
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: 24,
  p: 4
};

// === VARIANTES DE ANIMACIÓN ===
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2, 
      staggerChildren: 0.15 // <-- Magia de "uno por uno"
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


// === COMPONENTE PRINCIPAL ===
function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme(); 

  // --- ESTADOS ---
  const [stats, setStats] = useState({ enrolled_courses: 0, lessons_completed: 0, assignments_submitted: 0 });
  const [enrollments, setEnrollments] = useState([]); // <-- ¡Estado principal de datos!
  const [mentors, setMentors] = useState([]); // <-- ¡Estado para Mentores!
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  
  // Estados para el Modal
  const [lessonsModalOpen, setLessonsModalOpen] = useState(false);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // --- useEffect (Carga todos los datos del dashboard) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ¡Carga todo en paralelo!
        const [statsResponse, enrollmentsResponse, mentorsResponse] = await Promise.all([
          axiosInstance.get('/api/dashboard/stats/'),
          axiosInstance.get('/api/enrollments/my_enrollments/'),
          axiosInstance.get('/api/dashboard/my_mentors/')
        ]);
        
        setStats(statsResponse.data);
        setEnrollments(enrollmentsResponse.data);
        setMentors(mentorsResponse.data); // <-- Guarda los mentores

      } catch (err) {
        console.error("Error al cargar el dashboard:", err);
        setError('No se pudieron cargar los datos de tu dashboard. Intenta recargar la página.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []); // El array vacío [] asegura que se ejecute solo una vez al cargar
  
  // --- Función para el Modal de Lecciones ---
  const handleOpenLessonsModal = async () => {
    setLessonsModalOpen(true);
    setLoadingLessons(true);
    setUpcomingLessons([]); // Limpia datos antiguos
    try {
      const response = await axiosInstance.get('/api/dashboard/upcoming_lessons/');
      setUpcomingLessons(response.data);
    } catch (err) {
      console.error("Error al cargar lecciones:", err);
    } finally {
      setLoadingLessons(false);
    }
  };

  // --- Vistas de Carga y Error ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Alert severity="error">{error}</Alert>
       </Box>
    );
  }

  // --- RENDER PRINCIPAL ---
  return (
    <Box 
      component={motion.div} // <-- ¡Contenedor de Animación!
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
    >
      
      {/* Encabezado (Item de Animación) */}
      <Typography 
        component={motion.div}
        variants={itemVariants}
        variant="h4" 
        sx={{ fontWeight: 700, mb: 3, flexShrink: 0 }}
      >
        ¡Bienvenido de nuevo, {user.username}!
      </Typography>

      {/* Fila superior (Contenedor de Animación) */}
      <Box
        component={motion.div}
        variants={containerVariants} // <-- Este es un CONTENEDOR para los widgets
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 3,
          mb: 4,
          width: '100%',
          flexShrink: 0 
        }}
      >
        {/* --- Widgets "Staggered" (Items de Animación) --- */}
        
        {/* Widget 1 */}
        <motion.div variants={itemVariants}>
          <StatCard title="Cursos Inscritos" value={stats.enrolled_courses} icon={<LibraryBooksIcon />} color="primary" />
        </motion.div>

        {/* Widget 2 */}
        <motion.div variants={itemVariants}>
          <StatCard title="Lecciones Completadas" value={stats.lessons_completed} icon={<CheckCircleOutlineIcon />} color="success" />
        </motion.div>
        
        {/* Widget 3 */}
        <motion.div variants={itemVariants}>
          <StatCard title="Tareas Entregadas" value={stats.assignments_submitted} icon={<AssignmentTurnedInIcon />} color="secondary" />
        </motion.div>
        
        {/* Widget 4 (Insignias) */}
        <motion.div variants={itemVariants}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 4, 
              textAlign: 'center',
              height: '100%', // Para alinear
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              border: `1px solid rgba(255, 255, 255, 0.125)`,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, textAlign: 'left' }}>Insignias</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center', mt: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.light', width: 48, height: 48 }}>🏆</Avatar>
              <Avatar sx={{ bgcolor: 'info.light', width: 48, height: 48 }}>🚀</Avatar>
              <Avatar sx={{ bgcolor: 'grey.700', width: 48, height: 48 }}>❓</Avatar>
            </Box>
          </Paper>
        </motion.div>
        
        {/* Widget 5 (Mascota) */}
        <motion.div variants={itemVariants}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 4, 
              textAlign: 'center',
              height: '100%', // Para alinear
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              border: `1px solid rgba(255, 255, 255, 0.125)`,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'left' }}>Tu Mascota</Typography>
            <Typography variant="h2" sx={{ fontSize: '3rem', mt: 1 }}>🥚</Typography>
            <LinearProgress variant="determinate" value={15} sx={{ height: 6, borderRadius: 4, mt: 1 }} />
            <Typography variant="caption" color="text.secondary">15 / 100 XP</Typography>
          </Paper>
        </motion.div>
      </Box>

      {/* Área de Scroll (Item de Animación) */}
      <Box 
        component={motion.div}
        variants={itemVariants}
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          minHeight: 0, 
          ...getScrollbarStyles(theme)
        }}
      >
        
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 4,
            width: '100%',
            alignItems: 'start',
          }}
        >
          {/* --- Columna 1 --- */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Calendario (Simulado) */}
            <Paper sx={{ p: 4, borderRadius: 5, /* ... */ }}>
              {/* ... */}
            </Paper>

            {/* "Continuar Curso" (¡CONECTADO!) */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Continuar Curso
              </Typography>
              {enrollments.length > 0 ? (
                enrollments.map(enrollment => (
                  <Card
                    key={enrollment.id}
                    sx={{
                      borderRadius: 4,
                      mb: 2, 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                      border: `1px solid rgba(255, 255, 255, 0.125)`,
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                    }}
                    onClick={() => navigate(`/courses/${enrollment.course.id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="160"
                      image={`https://source.unsplash.com/random/300x200?code,${enrollment.course.id}`}
                      alt={enrollment.course.title}
                    />
                    <CardContent>
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                        {enrollment.course.title}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center' }}>
                  <Typography>No estás inscrito en ningún curso.</Typography>
                </Paper>
              )}
            </Box>
          </Box>

          {/* Columna 2 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* "Progreso General" (¡CONECTADO!) */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Progreso General
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {enrollments.length > 0 ? (
                  enrollments.map((enrollment, index) => (
                    <CourseProgressCard 
                      key={enrollment.id}
                      title={enrollment.course.title} 
                      watched={enrollment.lessons_completed_count} // <-- ¡Dato Real!
                      total={enrollment.total_lessons_count}     // <-- ¡Dato Real!
                      color="primary" 
                    />
                  ))
                ) : (
                  <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center' }}>
                    <Typography>Inscríbete en un curso para ver tu progreso.</Typography>
                  </Paper>
                )}
              </Box>
            </Box>

            {/* "Lecciones Próximas" (¡CONECTADO!) */}
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                border: `1px solid rgba(255, 255, 255, 0.125)`,
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Lecciones Próximas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                Revisa las lecciones y tareas que tienes pendientes.
              </Typography>
              <Button variant="contained" onClick={handleOpenLessonsModal}>
                Ver Lecciones
              </Button>
            </Paper>
          </Box>

          {/* Columna 3 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Estadísticas de Horas (Simulado) */}
            <Paper sx={{ p: 3, borderRadius: 5, /* ... */ }}>
              {/* ... */}
            </Paper>
            
            {/* "Tus Mentores" (¡CONECTADO!) */}
            <Paper sx={{ p: 3, borderRadius: 5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Tus Mentores
                </Typography>
                <IconButton size="small">
                  <AddIcon />
                </IconButton>
              </Box>
              
              {mentors.length > 0 ? (
                <List>
                  {mentors.map(mentor => (
                    <ListItem key={mentor.id} disablePadding>
                      <ListItemAvatar>
                        <Avatar src={`https://placehold.co/50/FF5733/FFFFFF?text=${mentor.username[0].toUpperCase()}`} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={mentor.username} 
                        secondary="Profesor" 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Aún no tienes mentores asignados.
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>
      </Box> {/* Fin del Box de 3 columnas */}

      {/* Modal (¡CONECTADO!) */}
      <Modal
        open={lessonsModalOpen}
        onClose={() => setLessonsModalOpen(false)}
        aria-labelledby="modal-title"
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={lessonsModalOpen}>
          <Box sx={modalStyle}>
            <Typography id="modal-title" variant="h6" sx={{ mb: 2 }}>
              Lecciones Pendientes
            </Typography>
            
            {loadingLessons ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : upcomingLessons.length > 0 ? (
              <List>
                {upcomingLessons.map(lesson => (
                  <ListItem 
                    key={lesson.id} 
                    button 
                    onClick={() => navigate(`/courses/${lesson.course_id}/lessons/${lesson.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <LibraryBooksIcon fontSize="small" color="primary" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={lesson.title}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2">
                ¡Estás al día! No hay lecciones pendientes.
              </Typography>
            )}

          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}

// Función para el estilo de la barra de scroll (Sin cambios)
const getScrollbarStyles = (theme) => ({
  scrollbarWidth: 'thin',
  scrollbarColor: `${theme.palette.primary.main} ${theme.palette.background.paper}`,
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent', 
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: '10px',
    border: `2px solid ${theme.palette.background.default}`,
    backgroundClip: 'content-box',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: theme.palette.primary.dark,
  }
});

export default HomePage;