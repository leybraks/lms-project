// frontend/src/pages/LessonPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Paper, 
  Button,
  Divider,
  Snackbar,
  TextField,
  Grid, // <-- ¡NUEVO! Para el layout
  List, // <-- ¡NUEVO!
  ListItem, // <-- ¡NUEVO!
  ListItemAvatar, // <-- ¡NUEVO!
  ListItemText, // <-- ¡NUEVO!
  Avatar, // <-- ¡NUEVO!
  Tabs, // <-- ¡NUEVO!
  Tab // <-- ¡NUEVO!
} from '@mui/material';

// --- Iconos ---
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import LiveTvIcon from '@mui/icons-material/LiveTv'; // Para la clase en vivo

// === VARIANTES DE ANIMACIÓN (Como en HomePage) ===
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

// --- Estilo "Glass" (Reutilizable) ---
const glassPaperStyle = (theme) => ({
  p: { xs: 2, sm: 3 },
  borderRadius: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.125)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
  height: '100%', // Para que las columnas coincidan
});


function LessonPage() {
  const { courseId, lessonId } = useParams(); 
  const navigate = useNavigate();
  const theme = useTheme(); 

  // --- Estados (Tu lógica funcional, sin cambios) ---
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [assignment, setAssignment] = useState(null); 
  const [submissionContent, setSubmissionContent] = useState(""); 
  const [submissionStatus, setSubmissionStatus] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false); 
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  
  // ¡NUEVO! Estado para los Tabs
  const [tabValue, setTabValue] = useState(0);

  // --- useEffect (Tu lógica funcional, sin cambios) ---
  useEffect(() => {
    // Para el diseño, simularemos datos si la carga falla
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        // ... (Tu lógica de 'fetchLessonData' sigue aquí)
        
        // --- SIMULACIÓN PARA EL DISEÑO ---
        // (Quita esto cuando conectes los datos reales del video)
        setLesson({
          title: '¿Qué es Python y por qué usarlo?',
          content: 'Introducción sobre Python, sus usos en ciencia de datos, desarrollo web y más. Esta lección cubre las bases del lenguaje.',
          video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
          live_session_room: null, // O pon un nombre de sala para ver el diseño de Jitsi
          resources: [
            { id: 1, title: 'Guía de Instalación (PDF)', file: '#' },
            { id: 2, title: 'Código Fuente (ZIP)', file: '#' },
          ]
        });
        setIsCompleted(true); // Muestra la alerta de completado para el diseño
        // --- FIN DE SIMULACIÓN ---

      } catch (err) {
        // ... (Tu manejo de errores)
      } finally {
        setLoading(false);
      }
    };
    fetchLessonData();
  }, [lessonId, courseId, navigate]);

  // --- Funciones (Tu lógica funcional, sin cambios) ---
  const handleMarkAsComplete = async () => { /* ... */ };
  const handleSubmissionSubmit = async (e) => { /* ... */ };
  const handleSnackbarClose = (e, r) => { /* ... */ };
  const renderAssignmentSection = () => { /* ... */ };
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // --- Vistas de Carga y Error (Sin cambios) ---
  if (loading) { /* ... */ }
  if (error) { /* ... */ }
  if (!lesson) return null; // Espera a que la simulación/carga termine

  // --- RENDERIZADO PRINCIPAL (¡DISEÑO ACTUALIZADO!) ---
  return (
    <Box 
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ 
        height: '100%', 
        width: '100%',
        p: 3, 
        boxSizing: 'border-box',
        overflowY: 'auto', 
        ...getScrollbarStyles(theme)
      }}
    >
      {/* Título (Item 1) */}
      <motion.div variants={itemVariants}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ fontWeight: 700, mb: 3 }}
        >
          {lesson.title}
        </Typography>
      </motion.div>

      {/* Layout de 2 Columnas */}
      <Grid container spacing={3}>
        
        {/* === COLUMNA IZQUIERDA (Contenido Principal) === */}
        <Grid item xs={12} md={8}>
          <motion.div variants={itemVariants}>
            <Paper sx={glassPaperStyle(theme)}>
              {/* --- Diseño para Clase en Vivo (Jitsi) --- */}
              {lesson.live_session_room ? (
                  <Box sx={{ height: '70vh', minHeight: 500, borderRadius: 3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                    <Box textAlign="center">
                      <LiveTvIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                      <Typography variant="h5">Clase en Vivo</Typography>
                      <Typography color="text.secondary">"{lesson.live_session_room}"</Typography>
                      <Button variant="contained" sx={{mt: 2}}>Unirse a la Sesión</Button>
                    </Box>
                  </Box>
              ) : (
                /* --- Diseño para Video Pregrabado --- */
                <Box sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', position: 'relative', paddingBottom: '56.25%', height: 0, bgcolor: 'background.default' }}>
                  <iframe
                    src={lesson.video_url} // URL simulada
                    title={lesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  />
                </Box>
              )}
            </Paper>
          </motion.div>
          
          {/* --- Tabs de Tareas y Recursos (Debajo del video) --- */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mt: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Descripción" icon={<DescriptionIcon />} iconPosition="start" />
                <Tab label="Tarea" icon={<AssignmentIcon />} iconPosition="start" />
              </Tabs>
              
              {/* Contenido de Tab 1: Descripción */}
              {tabValue === 0 && (
                <Paper sx={{...glassPaperStyle(theme), mt: 2, p: 3}}>
                  <Typography variant="body1" paragraph>
                    {lesson.content}
                  </Typography>
                </Paper>
              )}
              
              {/* Contenido de Tab 2: Tarea */}
              {tabValue === 1 && (
                <Box sx={{ mt: 2 }}>
                  {/* (Tu lógica 'renderAssignmentSection' iría aquí) */}
                  <Paper sx={glassPaperStyle(theme)}>
                    <Typography variant="h6">Tarea: Ensayo sobre Python</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Escribe un ensayo de 500 palabras sobre los usos de Python.
                    </Typography>
                    <TextField label="Tu Respuesta" multiline rows={4} fullWidth />
                    <Button variant="contained" sx={{mt: 2}}>Enviar Tarea</Button>
                  </Paper>
                </Box>
              )}
            </Box>
          </motion.div>
        </Grid>

        {/* === COLUMNA DERECHA (Navegación y Acciones) === */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Widget de Completar */}
            <motion.div variants={itemVariants}>
              <Paper sx={glassPaperStyle(theme)}>
                {isCompleted ? (
                  <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
                    ¡Lección Completada!
                  </Alert>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth // Ocupa todo el ancho
                    startIcon={<CheckCircleIcon />}
                    onClick={handleMarkAsComplete}
                  >
                    Marcar como Completada
                  </Button>
                )}
              </Paper>
            </motion.div>

            {/* Widget de Navegación */}
            <motion.div variants={itemVariants}>
              <Paper sx={glassPaperStyle(theme)}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Navegación
                </Typography>
                <Button 
                  fullWidth
                  variant="outlined"
                  startIcon={<NavigateBeforeIcon />}
                  disabled={true} // Deshabilitado para el diseño
                  sx={{ mb: 1.5 }}
                >
                  Lección Anterior
                </Button>
                <Button 
                  fullWidth
                  variant="contained"
                  endIcon={<NavigateNextIcon />}
                >
                  Siguiente Lección
                </Button>
                <Divider sx={{ my: 2 }} />
                <Button fullWidth component={RouterLink} to={`/courses/${courseId}`}>
                  Volver al Índice del Curso
                </Button>
              </Paper>
            </motion.div>

            {/* Widget de Recursos */}
            <motion.div variants={itemVariants}>
              <Paper sx={glassPaperStyle(theme)}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Recursos
                </Typography>
                <List>
                  {lesson.resources.map(resource => (
                    <ListItem button key={resource.id} component="a" href={resource.file}>
                      <ListItemAvatar>
                        <Avatar><CloudDownloadIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={resource.title} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </motion.div>
            
          </Box>
        </Grid>

      </Grid>
      
      {/* ... (Tu Snackbar va aquí) ... */}
    </Box>
  );
}

// ¡NUEVO! Función de Scrollbar (copiada de HomePage)
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


export default LessonPage;