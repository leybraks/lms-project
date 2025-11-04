// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles'; // Importamos useTheme para acceder a los colores de la paleta

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
  Backdrop
} from '@mui/material';

// Iconos
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

// === COMPONENTES AUXILIARES (Modificados para Glassmorphism y Animaciones) ===
const StatCard = ({ title, value, icon, color = 'primary' }) => {
  const theme = useTheme(); // Para acceder a los colores del tema
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: 4,
        height: '100%',
        
        // Glassmorphism Styles
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fondo ligeramente transparente
        backdropFilter: 'blur(10px) saturate(180%)', // Efecto de desenfoque
        border: `1px solid rgba(255, 255, 255, 0.125)`, // Borde sutil
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)', // Sombra para profundidad
        
        // Animaciones
        transition: 'all 0.3s ease-in-out', // Transición para todas las propiedades relevantes
        '&:hover': { 
          transform: 'translateY(-6px) scale(1.02)', // Un poco más de elevación y escala
          boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.2)', // Sombra más pronunciada en hover
          backgroundColor: 'rgba(255, 255, 255, 0.15)', // Un poco más opaco en hover
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
};

const FakeBarChart = () => {
  const heights = ['30%', '50%', '80%', '60%'];
  const labels = ['1-10', '11-20', '21-30', '1-10 Aug'];
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 120, mt: 3 }}>
      {heights.map((h, i) => (
        <Box key={labels[i]} sx={{ width: '20%', textAlign: 'center' }}>
          <Box
            sx={{
              height: h,
              bgcolor: 'primary.light',
              borderRadius: '4px 4px 0 0',
              transition: 'background-color 0.2s ease', // Animación para el color de la barra
              '&:hover': { bgcolor: 'primary.main' }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {labels[i]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const CourseProgressCard = ({ title, watched, total, color }) => {
  const theme = useTheme(); // Para acceder a los colores del tema
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 4,
        height: '100%',
        
        // Glassmorphism Styles
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fondo ligeramente transparente
        backdropFilter: 'blur(10px) saturate(180%)', // Efecto de desenfoque
        border: `1px solid rgba(255, 255, 255, 0.125)`, // Borde sutil
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)', // Sombra para profundidad

        // Animaciones
        transition: 'all 0.3s ease-in-out',
        '&:hover': { 
          transform: 'translateY(-6px) scale(1.02)', 
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
        {watched}/{total} watched
      </Typography>
      <LinearProgress
        variant="determinate"
        value={(watched / total) * 100}
        color={color}
        sx={{ height: 6, borderRadius: 3, mt: 1 }}
      />
    </Paper>
  );
};

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

// --- COMPONENTE PRINCIPAL ---
function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme(); 

  const [stats, setStats] = useState({ enrolled_courses: 0, lessons_completed: 0, assignments_submitted: 0 });
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lessonsModalOpen, setLessonsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, enrollmentsResponse] = await Promise.all([
          axiosInstance.get('/api/dashboard/stats/'),
          axiosInstance.get('/api/enrollments/my_enrollments/')
        ]);
        setStats(statsResponse.data);
        const courses = enrollmentsResponse.data.map(enrollment => enrollment.course);
        setEnrolledCourses(
          courses.length > 0
            ? courses
            : [
                { id: 1, title: 'Curso Simulado de React' },
                { id: 2, title: 'Curso Simulado de Node.js' }
              ]
        );
      } catch (err) {
        setStats({ enrolled_courses: 2, lessons_completed: 5, assignments_submitted: 3 });
        setEnrolledCourses([
          { id: 1, title: 'Curso Simulado de React' },
          { id: 2, title: 'Curso Simulado de Node.js' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      
      {/* Encabezado (Sin cambios) */}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, flexShrink: 0 }}>
        ¡Bienvenido de nuevo, {user.username}!
      </Typography>

      {/* Fila superior de WIDGETS (Modificada para Glassmorphism) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 3,
          mb: 4,
          width: '100%',
          flexShrink: 0,
        }}
      >
        <StatCard title="Cursos Inscritos" value={stats.enrolled_courses} icon={<LibraryBooksIcon />} color="primary" />
        <StatCard title="Lecciones Completadas" value={stats.lessons_completed} icon={<CheckCircleOutlineIcon />} color="success" />
        <StatCard title="Tareas Entregadas" value={stats.assignments_submitted} icon={<AssignmentTurnedInIcon />} color="secondary" />
        
        {/* Paper Insignias - Glassmorphism */}
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 4, 
            textAlign: 'center', 
            // Glassmorphism Styles
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            backdropFilter: 'blur(10px) saturate(180%)', 
            border: `1px solid rgba(255, 255, 255, 0.125)`, 
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': { 
              transform: 'translateY(-6px) scale(1.02)', 
              boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, textAlign: 'left' }}>Insignias</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center', mt: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.light', width: 48, height: 48 }}>🏆</Avatar>
            <Avatar sx={{ bgcolor: 'info.light', width: 48, height: 48 }}>🚀</Avatar>
            <Avatar sx={{ bgcolor: 'grey.700', width: 48, height: 48 }}>❓</Avatar>
          </Box>
        </Paper>
        
        {/* Paper Tu Mascota - Glassmorphism */}
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 4, 
            textAlign: 'center', 
            // Glassmorphism Styles
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            backdropFilter: 'blur(10px) saturate(180%)', 
            border: `1px solid rgba(255, 255, 255, 0.125)`, 
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': { 
              transform: 'translateY(-6px) scale(1.02)', 
              boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'left' }}>Tu Mascota</Typography>
          <Typography variant="h2" sx={{ fontSize: '3rem', mt: 1 }}>🥚</Typography>
          <LinearProgress variant="determinate" value={15} sx={{ height: 6, borderRadius: 4, mt: 1 }} />
          <Typography variant="caption" color="text.secondary">15 / 100 XP</Typography>
        </Paper>
      </Box>

      {/* Contenedor principal de 3 columnas con scrollbar personalizado */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        minHeight: 0,
        // pr: 0.5, 

        // --- ESTILOS DE SCROLLBAR ---
        scrollbarWidth: 'thin',
        scrollbarColor: `${theme.palette.primary.main} ${theme.palette.background.paper}`,

        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: theme.palette.background.paper,
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.primary.main,
          borderRadius: '10px',
          border: `2px solid ${theme.palette.background.paper}`, 
          backgroundClip: 'content-box',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: theme.palette.primary.dark,
        }
      }}>
        
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 4,
            width: '100%',
            alignItems: 'start',
          }}
        >
          {/* Columna 1 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Calendario - Glassmorphism */}
            <Paper
              sx={{
                p: 4,
                borderRadius: 5,
                background: 'linear-gradient(90deg, #6750A4 0%, #A06EFE 100%)', // Mantengo tu gradiente
                color: 'white',
                // Glassmorphism (sobre el gradiente)
                backdropFilter: 'blur(10px) saturate(180%)', 
                border: `1px solid rgba(255, 255, 255, 0.2)`, 
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': { transform: 'translateY(-6px) scale(1.01)', boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.2)' }
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Calendario de Actividad
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                (Widget de calendario...)
              </Typography>
            </Paper>

            {/* Mentores - Glassmorphism */}
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 5,
                // Glassmorphism Styles
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                backdropFilter: 'blur(10px) saturate(180%)', 
                border: `1px solid rgba(255, 255, 255, 0.125)`, 
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-6px) scale(1.02)', 
                  boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Tus Mentores
                </Typography>
                <IconButton size="small">
                  <AddIcon />
                </IconButton>
              </Box>
              <List>
                <ListItem disablePadding>
                  <ListItemAvatar>
                    <Avatar src="https://placehold.co/50/FF5733/FFFFFF?text=PS" />
                  </ListItemAvatar>
                  <ListItemText primary="Prof. Pádraig" secondary="UI/UX Design" />
                </ListItem>
              </List>
            </Paper>
          </Box>

          {/* Columna 2 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box> {/* Este Box contiene el título y los CourseProgressCards, no es una tarjeta en sí misma */}
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Progreso General
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <CourseProgressCard title="UI/UX Design" watched={2} total={8} color="primary" />
                <CourseProgressCard title="Branding" watched={3} total={6} color="secondary" />
                <CourseProgressCard title="Front End" watched={6} total={8} color="success" />
              </Box>
            </Box>

            {/* Lecciones próximas - Glassmorphism */}
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                textAlign: 'center', 
                // Glassmorphism Styles
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                backdropFilter: 'blur(10px) saturate(180%)', 
                border: `1px solid rgba(255, 255, 255, 0.125)`, 
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-6px) scale(1.02)', 
                  boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Lecciones Próximas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                Revisa las lecciones y tareas que tienes pendientes para esta semana.
              </Typography>
              <Button variant="contained" onClick={() => setLessonsModalOpen(true)}>
                Ver Lecciones
              </Button>
            </Paper>
          </Box>

          {/* Columna 3 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Estadísticas de Horas - Glassmorphism */}
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 5, 
                textAlign: 'center', 
                // Glassmorphism Styles
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                backdropFilter: 'blur(10px) saturate(180%)', 
                border: `1px solid rgba(255, 255, 255, 0.125)`, 
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-6px) scale(1.02)', 
                  boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, textAlign: 'left' }}>
                Estadísticas de Horas
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', my: 2 }}>
                <Avatar src="https://placehold.co/150" sx={{ width: 100, height: 100 }} />
                <CircularProgress
                  variant="determinate"
                  value={32}
                  size={116}
                  thickness={3}
                  sx={{ color: 'primary.main', position: 'absolute', top: -8, left: -8 }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
                ¡Buenos días, {user.username}!
              </Typography>
              <FakeBarChart />
            </Paper>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Continue Watching
              </Typography>
              {enrolledCourses.length > 0 ? (
                <Card
                  sx={{
                    borderRadius: 4,
                    // Glassmorphism Styles
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    backdropFilter: 'blur(10px) saturate(180%)', 
                    border: `1px solid rgba(255, 255, 255, 0.125)`, 
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',

                    transition: 'all 0.3s ease-in-out', // Transición para todas las propiedades
                    '&:hover': { 
                      transform: 'translateY(-6px) scale(1.02)', // Un poco más de elevación y escala
                      boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.2)', // Sombra más pronunciada en hover
                      backgroundColor: 'rgba(255, 255, 255, 0.15)', // Un poco más opaco en hover
                    }
                  }}
                  onClick={() => navigate(`/courses/${enrolledCourses[0].id}`)}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={`https://source.unsplash.com/random/300x200?code,${enrolledCourses[0].id}`}
                    alt={enrolledCourses[0].title}
                  />
                  <CardContent>
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                      {enrolledCourses[0].title}
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center' }}>
                  <Typography>No estás inscrito en ningún curso.</Typography>
                </Paper>
              )}
            </Box>
          </Box>
        </Box>
      </Box> {/* Fin del Box de 3 columnas */}

      {/* Modal (Sin cambios) */}
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
            <Typography variant="body2">Aquí podrías mostrar la lista de lecciones pendientes.</Typography>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}

export default HomePage;