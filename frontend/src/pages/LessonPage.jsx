import React, { useState, useEffect, useRef } from 'react';
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
  Tooltip,
  Checkbox,
  ListItemButton,
  ListItemIcon,
  Chip
} from '@mui/material';

// --- Iconos ---
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import ChatIcon from '@mui/icons-material/Chat';         
import NotesIcon from '@mui/icons-material/Notes';       
import GradeIcon from '@mui/icons-material/Grade';       
import SendIcon from '@mui/icons-material/Send';         
import PeopleIcon from '@mui/icons-material/People';     
import AddIcon from '@mui/icons-material/Add';           
import DeleteIcon from '@mui/icons-material/Delete';     
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; 
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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

// --- Estilo "Glass" (Sin cambios) ---
const glassPaperStyle = (theme) => ({
  p: 0,
  borderRadius: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.125)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden' 
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

// --- Componente de Pestaña (Sin cambios) ---
function TabPanel(props) {
  const { children, value, index, theme, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lesson-tabpanel-${index}`}
      aria-labelledby={`lesson-tab-${index}`}
      {...other}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%' 
      }}
    >
      {value === index && (
        <Box sx={{ 
            height: '100%', 
            overflowY: 'auto', 
            ...getScrollbarStyles(theme) 
          }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// --- Componente Maqueta (Chat) (Sin cambios) ---
const LessonChat = ({ theme }) => {
  return (
    <Box sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, ...getScrollbarStyles(theme) }}>
        <ListItem sx={{p:0, mb: 1}}>
          <ListItemAvatar><Avatar sx={{bgcolor: 'primary.light'}}>P</Avatar></ListItemAvatar>
          <ListItemText primary="Prof. Pádraig" secondary="¡Bienvenidos a la lección 1! No olviden descargar los recursos." />
        </ListItem>
        <ListItem sx={{p:0, mb: 1}}>
          <ListItemAvatar><Avatar sx={{bgcolor: 'secondary.light'}}>A</Avatar></ListItemAvatar>
          <ListItemText primary="Ana" secondary="Gracias profe, ¿el PDF es obligatorio?" />
        </ListItem>
        <ListItem sx={{p:0, mb: 1}}>
          <ListItemAvatar><Avatar sx={{bgcolor: 'primary.light'}}>P</Avatar></ListItemAvatar>
          <ListItemText primary="Prof. Pádraig" secondary="No es obligatorio, pero sí muy recomendado." />
        </ListItem>
      </Box>
      <Divider />
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Escribe tu pregunta aquí..."
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton color="primary"><SendIcon /></IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

// --- Componente "Mis Notas" (Sin cambios) ---
const LessonNotes = ({ theme, lessonId }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    if (!lessonId) return;
    const fetchNotes = async () => {
      try {
        setLoadingNotes(true);
        const response = await axiosInstance.get(`/api/lessons/${lessonId}/notes/`);
        setNotes(response.data);
      } catch (err) {
        console.error("Error al cargar notas:", err);
      } finally {
        setLoadingNotes(false);
      }
    };
    fetchNotes();
  }, [lessonId]);

  const handleAddNote = async (e) => {
    e.preventDefault(); 
    if (newNote.trim() === "") return;
    try {
      const response = await axiosInstance.post(`/api/lessons/${lessonId}/notes/`, {
        content: newNote,
        is_completed: false
      });
      setNotes([...notes, response.data]); 
      setNewNote(""); 
    } catch (err) {
      console.error("Error al añadir nota:", err);
    }
  };
  
  const handleDeleteNote = async (noteId) => {
    try {
      await axiosInstance.delete(`/api/lessons/${lessonId}/notes/${noteId}/`);
      setNotes(notes.filter(note => note.id !== noteId)); 
    } catch (err) {
      console.error("Error al borrar nota:", err);
    }
  };

  const handleToggleNote = async (note) => {
    try {
      const updatedNote = { ...note, is_completed: !note.is_completed };
      
      await axiosInstance.patch(`/api/lessons/${lessonId}/notes/${note.id}/`, {
        is_completed: updatedNote.is_completed
      });
      
      setNotes(notes.map(n => (n.id === note.id ? updatedNote : n)));
    } catch (err) {
      console.error("Error al actualizar nota:", err);
    }
  };

  return (
    <Box sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, ...getScrollbarStyles(theme) }}>
        {loadingNotes ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
        ) : (
          <List dense>
            {notes.map(note => (
              <ListItem 
                key={note.id}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleDeleteNote(note.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
                disablePadding
              >
                <ListItemButton dense onClick={() => handleToggleNote(note)}>
                  <ListItemIcon sx={{minWidth: 0, mr: 1.5}}>
                    <Checkbox edge="start" tabIndex={-1} disableRipple checked={note.is_completed} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={note.content} 
                    sx={{
                      textDecoration: note.is_completed ? 'line-through' : 'none', 
                      opacity: note.is_completed ? 0.7 : 1
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {notes.length === 0 && !loadingNotes && (
              <Typography sx={{p: 2, textAlign: 'center', color: 'text.secondary'}}>
                Aún no tienes apuntes para esta lección.
              </Typography>
            )}
          </List>
        )}
      </Box>
      <Divider />
      <Box component="form" onSubmit={handleAddNote} sx={{ p: 2, bgcolor: 'background.default' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Añadir un nuevo apunte o tarea..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton color="primary" type="submit"><AddIcon /></IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

// --- Componente Maqueta (PanelProfesor) (Sin cambios) ---
const ProfessorPanel = ({ theme }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <motion.div variants={itemVariants}>
        <Paper sx={{...glassPaperStyle(theme), p: 3}}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Panel del Profesor
          </Typography>
          <Button fullWidth variant="contained" color="secondary" size="large">
            Finalizar Clase para Todos
          </Button>
        </Paper>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Paper sx={{...glassPaperStyle(theme), p: 3, height: 600}}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Alumnos Conectados (3)
          </Typography>
          <Box sx={{flex: 1, overflowY: 'auto', ...getScrollbarStyles(theme)}}>
            <List>
              <ListItem>
                <ListItemAvatar><Avatar sx={{bgcolor: 'primary.light'}}>L</Avatar></ListItemAvatar>
                <ListItemText primary="leybrak (Tú)" />
              </ListItem>
              <ListItem>
                <ListItemAvatar><Avatar sx={{bgcolor: 'secondary.light'}}>A</Avatar></ListItemAvatar>
                <ListItemText primary="Ana" />
                <Tooltip title="Premiar mascota"><IconButton color="warning"><EmojiEventsIcon /></IconButton></Tooltip>
              </ListItem>
              <ListItem>
                <ListItemAvatar><Avatar>B</Avatar></ListItemAvatar>
                <ListItemText primary="Bagas Mahpie" />
                <Tooltip title="Premiar mascota"><IconButton color="warning"><EmojiEventsIcon /></IconButton></Tooltip>
              </ListItem>
            </List>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  )
};


// === COMPONENTE PRINCIPAL ===
function LessonPage() {
  const { courseId, lessonId } = useParams(); 
  const navigate = useNavigate();
  const theme = useTheme(); 
  const fileInputRef = useRef(null); 

  const isProfessor = false; 

  // --- Estados de la Lección ---
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // --- Estados de la Tarea ---
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [fileToUpload, setFileToUpload] = useState(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 

  // --- Estados del Quiz ---
  const [quiz, setQuiz] = useState(null);
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true); 

  // Estados de UI
  const [sideTabValue, setSideTabValue] = useState(0);
  const [mainTabValue, setMainTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");


  // --- ¡¡¡useEffect REFACTORIZADO!!! ---
  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Resetea todos los estados de contenido
        setAssignment(null); 
        setSubmission(null); 
        setQuiz(null);
        setQuizAttempt(null);
        setFileToUpload(null); 
        setSubmissionContent(""); 
        setIsEditing(false); 
        setLoadingAssignment(true); 
        setLoadingQuiz(true);       

        // --- 1. CARGA CRÍTICA: LA LECCIÓN ---
        // Si esto falla, SÍ queremos mostrar el error principal.
        const lessonResponse = await axiosInstance.get(`/api/lessons/${lessonId}/`);
        setLesson(lessonResponse.data);

        // --- 2. CARGAS SECUNDARIAS (en paralelo) ---
        // Las ejecutamos y manejamos los errores individualmente
        // para que una no detenga a la otra.

        // Cargar Completado
        (async () => {
          try {
            const completionsResponse = await axiosInstance.get('/api/completions/my_completions/');
            const numericLessonId = parseInt(lessonId, 10);
            const completed = completionsResponse.data.some(comp => comp.lesson.id === numericLessonId);
            setIsCompleted(completed);
          } catch (err) { 
            console.error("Error al cargar estado de completado:", err); 
            // Opcional: mostrar un snackbar de error
            // setSnackbarMessage("No se pudo cargar tu progreso.");
            // setSnackbarSeverity("error");
            // setSnackbarOpen(true);
          }
        })();

        // Cargar Tarea y Entrega
        (async () => {
          try {
            const assignmentResponse = await axiosInstance.get(`/api/assignments/lesson/${lessonId}/`);
            const loadedAssignment = assignmentResponse.data;
            setAssignment(loadedAssignment);

            // Solo buscamos entregas si encontramos una tarea
            const submissionsResponse = await axiosInstance.get('/api/submissions/my_submissions/');
            const existingSubmission = submissionsResponse.data.find(sub => sub.assignment === loadedAssignment.id);
            if (existingSubmission) {
              setSubmission(existingSubmission);
              setSubmissionContent(existingSubmission.content || "");
            }
          } catch (err) {
            if (err.response && err.response.status === 404) {
              console.log("Esta lección no tiene tarea.");
            } else {
              console.error("Error al cargar la tarea:", err);
            }
          } finally {
            setLoadingAssignment(false); // Termina el loading de la tarea
          }
        })();

        // Cargar Quiz e Intento (EL SOSPECHOSO)
        (async () => {
          try {
            const quizResponse = await axiosInstance.get(`/api/quizzes/lesson/${lessonId}/`); // Endpoint de quiz
            const loadedQuiz = quizResponse.data;
            setQuiz(loadedQuiz);

            // Solo buscamos intentos si encontramos un quiz
            const attemptsResponse = await axiosInstance.get('/api/quiz_attempts/my_attempts/'); // Endpoint de intentos
            const existingAttempt = attemptsResponse.data.find(att => att.quiz === loadedQuiz.id);
            if (existingAttempt) {
              setQuizAttempt(existingAttempt);
            }
          } catch (err) {
            if (err.response && err.response.status === 404) {
              console.log("Esta lección no tiene quiz (o la ruta de intentos 404).");
            } else {
              console.error("Error al cargar quiz o intentos:", err);
              // AHORA ESTE ERROR YA NO ROMPE LA PÁGINA
            }
          } finally {
            setLoadingQuiz(false); // Termina el loading del quiz
          }
        })();

      } catch (err) {
        // Este CATCH ahora SÓLO se activa si la LECCIÓN principal falla
        console.error("Error al cargar la lección:", err);
        setError("Error al cargar el contenido de la lección.");
        setLoadingAssignment(false);
        setLoadingQuiz(false);
      } finally {
        setLoading(false); // La carga principal (lección) terminó
      }
    };
    fetchLessonData();
  }, [lessonId, courseId, navigate]); // Dependencias sin cambios

  // --- 'Marcar como Completada' CONECTADA ---
  const handleMarkAsComplete = async () => {
    setIsCompleting(true);
    try {
      await axiosInstance.post('/api/completions/', {
        lesson_id: parseInt(lessonId) 
      });
      setIsCompleted(true);
      setSnackbarMessage("¡Lección completada!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error al marcar como completada:", err);
      let msg = "No se pudo guardar tu progreso.";
      if (err.response && err.response.status === 409) {
         msg = "Ya has completado esta lección.";
         setIsCompleted(true);
      }
      setSnackbarMessage(msg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsCompleting(false);
    }
  };
  
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };
  
  const handleSideTabChange = (event, newValue) => {
    setSideTabValue(newValue);
  };
  
  const handleMainTabChange = (event, newValue) => {
    setMainTabValue(newValue);
  };

  // --- Funciones de Tarea CONECTADAS ---
  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    if (!assignment) return;
    
    if (submissionContent.trim() === "" && !fileToUpload && !submission?.file_submission) {
      setSnackbarMessage("Debes escribir una respuesta o adjuntar un archivo.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('assignment_id', assignment.id);
    
    if (submissionContent.trim() !== "") {
      formData.append('content', submissionContent);
    }
    
    if (fileToUpload) { 
      formData.append('file_submission', fileToUpload);
    }

    try {
      const response = await axiosInstance.post('/api/submissions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSubmission(response.data); 
      setSnackbarMessage(isEditing ? "¡Tarea actualizada!" : "¡Tarea entregada con éxito!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setFileToUpload(null); 
      setIsEditing(false); 
      
    } catch (err) {
      console.error("Error al enviar la tarea:", err);
      const errorMsg = err.response?.data?.detail || "Error al enviar la tarea.";
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFileToUpload(null);
  };

  // --- Vistas de Carga y Error ---
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Alert severity="error">{error}</Alert></Box>;
  }
  if (!lesson) return null;

  // --- ¡NUEVO! Lógica para el Panel de Calificaciones ---
  
  // 1. Construir la lista de tareas pendientes
  const pendingTasks = [];
  if (assignment && !submission) {
    pendingTasks.push({ 
      id: `assignment-${assignment.id}`,
      title: assignment.title,
      due_date: assignment.due_date,
      type: 'assignment'
    });
  }
  if (quiz && !quizAttempt) {
    pendingTasks.push({
      id: `quiz-${quiz.id}`,
      title: quiz.title,
      due_date: quiz.due_date, // Asumiendo que el quiz tiene due_date
      module_id: quiz.module, // Asumiendo que el quiz tiene module_id
      type: 'quiz'
    });
  }

  // 2. Helper para el estado de la tarea
  const getTaskStatus = (dueDate) => {
    if (!dueDate) {
      return { label: 'Sin fecha límite', color: 'default', icon: <AccessTimeIcon fontSize="small" /> };
    }
    const now = new Date();
    const due = new Date(dueDate);
    if (due < now) {
      return { label: 'Vencido', color: 'error', icon: <ErrorOutlineIcon fontSize="small" /> };
    }
    // 3 días de antelación
    const threeDays = 1000 * 60 * 60 * 24 * 3;
    if (due.getTime() - now.getTime() < threeDays) {
      return { label: 'Vence pronto', color: 'warning', icon: <AccessTimeIcon fontSize="small" /> };
    }
    return { label: 'A tiempo', color: 'success', icon: <CheckCircleIcon fontSize="small" /> };
  };

  // 3. Helper para navegar a la tarea
  const handleTaskClick = (task) => {
    if (task.type === 'assignment') {
      // Cambia a la pestaña "Tarea" en esta misma página
      setMainTabValue(1);
    }
    if (task.type === 'quiz') {
      // Navega a la página del quiz
      navigate(`/courses/${courseId}/modules/${task.module_id}/quiz`);
    }
  };


  // --- RENDERIZADO PRINCIPAL ---
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

      {/* Contenedor de 2 columnas (Flexbox) */}
      <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3 
      }}>
        
        {/* === COLUMNA IZQUIERDA (Contenido Activo) === */}
        <Box sx={{
            width: { xs: '100%', md: '70%' },
            flexBasis: '70%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3
        }}>
          {/* 1. Video o Clase en Vivo */}
          <motion.div variants={itemVariants}>
            <Paper sx={{...glassPaperStyle(theme), p: 1 }}>
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
                <Box sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', position: 'relative', paddingBottom: '56.25%', height: 0, bgcolor: 'background.default' }}>
                  <iframe
                    src={lesson.video_url}
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
          
          {/* 2. Tarea y Descripción (¡CONECTADO!) */}
          <motion.div variants={itemVariants}>
            <Paper sx={{...glassPaperStyle(theme), p: 0, overflow: 'hidden'}}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2, flexShrink: 0 }}>
                <Tabs value={mainTabValue} onChange={handleMainTabChange}>
                  <Tab label="Descripción" icon={<DescriptionIcon />} iconPosition="start" />
                  <Tab label="Tarea" icon={<AssignmentIcon />} iconPosition="start" />
                </Tabs>
              </Box>
              
              {/* Contenido de Tab 1: Descripción */}
              <Box sx={{ p: 3, ...getScrollbarStyles(theme), overflowY: 'auto', minHeight: 300, display: mainTabValue === 0 ? 'block' : 'none' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Descripción de la Lección</Typography>
                <Typography variant="body1" paragraph color="text.secondary">
                  {lesson.content}
                </Typography>
              </Box>
              
              {/* Contenido de Tab 2: Tarea (¡FUNCIONAL!) */}
              <Box sx={{ p: 3, ...getScrollbarStyles(theme), overflowY: 'auto', minHeight: 300, display: mainTabValue === 1 ? 'block' : 'none' }} component="form" onSubmit={handleSubmissionSubmit}>
                {loadingAssignment ? (
                  <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
                ) : !assignment ? (
                  <Alert severity="info">Esta lección no tiene ninguna tarea asignada.</Alert>
                
                // --- VISTA "ENTREGADO" (si hay entrega Y NO estamos editando) ---
                ) : (submission && !isEditing) ? (
                  
                  <Box>
                    {submission.status === 'GRADED' ? (
                      <Alert severity="success">¡Tarea Calificada! Tu nota es: {submission.grade?.score || 'N/A'}</Alert>
                    ) : (
                      <Alert severity="info">Ya entregaste esta tarea (Estado: {submission.status}).</Alert>
                    )}
                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Tu entrega:</Typography>
                    {submission.content && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 2, whiteSpace: 'pre-wrap' }}>
                        <Typography variant="body1">{submission.content}</Typography>
                      </Paper>
                    )}
                    {submission.file_submission && (
                      <Chip
                        icon={<InsertDriveFileIcon />}
                        label={submission.file_name || "Ver archivo"}
                        onClick={() => window.open(submission.file_submission, '_blank')}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    
                    {/* --- Botón de Editar --- */}
                    <Box sx={{mt: 3}}>
                      {assignment.allow_edits && (!assignment.due_date || new Date() < new Date(assignment.due_date)) ? (
                        <Button 
                          variant="outlined" 
                          startIcon={<EditIcon />} 
                          onClick={() => setIsEditing(true)}
                        >
                          Editar Entrega
                        </Button>
                      ) : (
                        <Alert severity="warning" variant="outlined" sx={{maxWidth: 400}}>
                          {assignment.due_date && new Date() > new Date(assignment.due_date) ? 
                            "La fecha de entrega ha pasado. No se permiten más ediciones." :
                            "Esta tarea no permite ediciones."
                          }
                        </Alert>
                      )}
                    </Box>
                  </Box>
                
                // --- VISTA "FORMULARIO" (si NO hay entrega O estamos editando) ---
                ) : (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{assignment.title}</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {assignment.description}
                    </Typography>
                    <TextField 
                      label="Tu Respuesta de Texto" 
                      multiline 
                      rows={4} 
                      fullWidth 
                      variant="filled" 
                      sx={{mb: 2}}
                      value={submissionContent} // Carga el texto anterior
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      disabled={isSubmitting}
                    />
                    
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                    
                    {fileToUpload ? (
                      <Chip
                        icon={<InsertDriveFileIcon />}
                        label={fileToUpload.name}
                        onDelete={handleRemoveFile}
                        color="primary"
                        sx={{mb: 2}}
                      />
                    ) : (submission && submission.file_submission &&
                      <Chip
                        icon={<InsertDriveFileIcon />}
                        label={`Archivo actual: ${submission.file_name}`}
                        variant="outlined"
                        sx={{mb: 2}}
                      />
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        startIcon={<AttachFileIcon />}
                        onClick={handleFileButtonClick}
                        disabled={isSubmitting}
                      >
                        {fileToUpload ? "Cambiar Archivo" : (submission?.file_submission ? "Cambiar Archivo" : "Adjuntar Archivo")}
                      </Button>
                      <Button 
                        type="submit" 
                        variant="contained"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <CircularProgress size={24} /> : (isEditing ? "Guardar Cambios" : "Enviar Tarea")}
                      </Button>
                    </Box>
                    {isEditing && (
                      <Button 
                        color="secondary" 
                        onClick={() => setIsEditing(false)} 
                        sx={{mt: 2}}
                      >
                        Cancelar
                      </Button>
                    )}
                  </>
                )}
              </Box>
            </Paper>
          </motion.div>
        </Box>

        {/* === COLUMNA DERECHA (Panel de Herramientas) === */}
        <Box sx={{
            width: { xs: '100%', md: '30%' },
            flexBasis: '30%',
            position: 'sticky',
            top: 24, 
            maxHeight: 'calc(100vh - 80px - 24px - 24px)',
        }}>
            
            {isProfessor ? (
            
                <Box sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                    <ProfessorPanel theme={theme} />
                </Box>

            ) : (

                // --- VISTA DEL ALUMNO ---
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    height: '100%' 
                }}>
                    
                    {/* Widget de Completar (FUNCIONAL) */}
                    <motion.div variants={itemVariants} style={{ flexShrink: 0 }}>
                        <Paper sx={{...glassPaperStyle(theme), p: 3}}>
                            {isCompleted ? (
                                <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
                                ¡Lección Completada!
                                </Alert>
                            ) : (
                                <Button 
                                  fullWidth 
                                  variant="contained" 
                                  color="primary" 
                                  size="large" 
                                  startIcon={<CheckCircleIcon />} 
                                  onClick={handleMarkAsComplete}
                                  disabled={isCompleting}
                                >
                                  {isCompleting ? "Guardando..." : "Marcar como Completada"}
                                </Button>
                            )}
                        </Paper>
                    </motion.div>

                    {/* Widget de Pestañas */}
                    <motion.div variants={itemVariants} style={{
                        flex: 1,      
                        minHeight: 0,
                        flexShrink: 1 
                    }}>
                        <Paper sx={{...glassPaperStyle(theme), height: '100%', p: 0, display: 'flex', flexDirection: 'column'}}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1, flexShrink: 0 }}>
                                <Tabs 
                                    value={sideTabValue} 
                                    onChange={handleSideTabChange} 
                                    variant="fullWidth" 
                                >
                                    <Tooltip title="Chat"><Tab icon={<ChatIcon />} aria-label="Chat" sx={{minWidth: 'auto'}} /></Tooltip>
                                    <Tooltip title="Mis Notas"><Tab icon={<NotesIcon />} aria-label="Notas" sx={{minWidth: 'auto'}} /></Tooltip>
                                    <Tooltip title="Recursos"><Tab icon={<CloudDownloadIcon />} aria-label="Recursos" sx={{minWidth: 'auto'}} /></Tooltip>
                                    <Tooltip title="Calificaciones"><Tab icon={<GradeIcon />} aria-label="Calificaciones" sx={{minWidth: 'auto'}} /></Tooltip>
                                </Tabs>
                            </Box>

                            <Box sx={{ 
                                flex: 1,             
                                overflow: 'hidden',  
                                position: 'relative' 
                            }}>
                                <TabPanel value={sideTabValue} index={0} theme={theme}>
                                    <LessonChat theme={theme} />
                                </TabPanel>
                                <TabPanel value={sideTabValue} index={1} theme={theme}>
                                    <LessonNotes theme={theme} lessonId={lesson.id} />
                                </TabPanel>
                                <TabPanel value={sideTabValue} index={2} theme={theme}>
                                    <List sx={{p: 2}}>
                                    {lesson.resources && lesson.resources.length > 0 ? (
                                      lesson.resources.map(resource => (
                                        <ListItemButton key={resource.id} component="a" href={resource.file} target="_blank" rel="noopener noreferrer" sx={{borderRadius: 2}}>
                                          <ListItemAvatar>
                                            <Avatar sx={{bgcolor: 'primary.main'}}><CloudDownloadIcon /></Avatar>
                                          </ListItemAvatar>
                                          <ListItemText primary={resource.title} />
                                        </ListItemButton>
                                      ))
                                    ) : (
                                      <Typography sx={{p: 2, textAlign: 'center', color: 'text.secondary'}}>
                                        No hay recursos para esta lección.
                                      </Typography>
                                    )}
                                    </List>
                                </TabPanel>

                            {/* === ¡¡¡AQUÍ ESTÁ EL REDISEÑO!!! === */}
                            <TabPanel value={sideTabValue} index={3} theme={theme}>
                              
                              {/* ¡NUEVO! Contenedor Flex para empujar el botón hacia abajo */}
                              <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                // Esto hace que el contenedor ocupe al menos
                                // toda la altura del panel, permitiendo que
                                // el 'flexGrow' funcione.
                                minHeight: '100%', 
                              }}>

                                {/* Contenido (Título, Loading, Lista) */}
                                <Box sx={{ flexGrow: 1 }}> {/* ¡CLAVE! Esto empuja el resto hacia abajo */}
                                  
                                  {/* 1. Título */}
                                  <Typography variant="h6" sx={{ fontWeight: 600, p: 2, pb: 1 }}>
                                    Tareas Pendientes (Lección)
                                  </Typography>
                                  
                                  {/* 2. Loading */}
                                  {(loadingAssignment || loadingQuiz) && (
                                    <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
                                  )}

                                  {/* 3. Lista de Tareas */}
                                  {!(loadingAssignment || loadingQuiz) && (
                                    <List sx={{px: 1}} dense>
                                      {pendingTasks.length > 0 ? (
                                        pendingTasks.map(task => {
                                          const status = getTaskStatus(task.due_date);
                                          return (
                                            <ListItemButton key={task.id} sx={{borderRadius: 2, mb: 1}} onClick={() => handleTaskClick(task)}>
                                              <ListItemIcon sx={{minWidth: 40}}>
                                                {task.type === 'assignment' ? <AssignmentIcon /> : <AssessmentIcon />}
                                              </ListItemIcon>
                                              <ListItemText 
                                                primary={task.title}
                                                secondary={
                                                  <Chip 
                                                    icon={status.icon} 
                                                    label={status.label}
                                                    color={status.color} 
                                                    size="small" 
                                                    variant="outlined"
                                                    sx={{mt: 0.5}}
                                                  />
                                                }
                                              />
                                            </ListItemButton>
                                          );
                                        })
                                      ) : (
                                        // 4. Mensaje de "Todo listo"
                                        <Typography sx={{p: 2, textAlign: 'center', color: 'text.secondary'}}>
                                          ¡Estás al día! No tienes tareas ni exámenes pendientes para esta lección.
                                        </Typography>
                                      )}
                                    </List>
                                  )}
                                </Box> {/* Fin del contenido flexible */}

                                {/* Botón (Contenido Fijo en la parte inferior) */}
                                <Box sx={{ flexShrink: 0 }}> {/* Evita que este Box se encoja */}
                                  <Divider />
                                  <Box sx={{p: 2, bgcolor: 'background.default'}}>
                                    <Button 
                                      variant="outlined" 
                                      fullWidth
                                      component={RouterLink}
                                      to={`/courses/${courseId}/grades`}
                                    >
                                      Ver Libro de Calificaciones
                                    </Button>
                                  </Box>
                                </Box>
                                
                              </Box> {/* Fin del Contenedor Flex */}
                            </TabPanel>
                          </Box>
                        </Paper>
                    </motion.div>
                    
                    {/* Widget de Navegación (¡PARCIALMENTE REAL!) */}
                    <motion.div variants={itemVariants} style={{ flexShrink: 0 }}>
                        <Paper sx={{...glassPaperStyle(theme), p: 3}}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Navegación
                            </Typography>
                            <Button fullWidth variant="outlined" startIcon={<NavigateBeforeIcon />} disabled={!lesson.prev_lesson_id} onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.prev_lesson_id}`)} sx={{ mb: 1.5 }}>
                                Lección Anterior
                            </Button>
                            <Button fullWidth variant="contained" endIcon={<NavigateNextIcon />} disabled={!lesson.next_lesson_id} onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.next_lesson_id}`)}>
                                Siguiente Lección
                            </Button>
                            <Divider sx={{ my: 2 }} />
                            <Button fullWidth component={RouterLink} to={`/courses/${courseId}`}>
                                Volver al Índice del Curso
                            </Button>
                        </Paper>
                    </motion.div>
                </Box>
            )}
        </Box>
      </Box> {/* === FIN DEL CAMBIO A FLEXBOX === */}
      
      {/* --- ¡Snackbar AÑADIDO! --- */}
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

// (La función getScrollbarStyles va aquí)
const GetScrollbarStyles = (theme) => ({
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