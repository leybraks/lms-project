import React, { useState, useEffect,useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios'; 
import { useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";
import { useAuth } from '../context/AuthContext';
import CreateLiveQuiz from '../components/CreateLiveQuiz';
import CreateLiveCodeChallenge from '../components/CreateLiveCodeChallenge';
import AssignmentIcon from '@mui/icons-material/Assignment'; // <--- NUEVO ICONO
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import AssignmentIcon from '@mui/icons-material/Assignment';
// --- Componentes de UI Material ---
import {
  Box, Typography, CircularProgress, Alert, Button, Paper, Divider, Snackbar,
  Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Breadcrumbs, Link, Tabs, Tab, Avatar,
  Modal, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, IconButton,Tooltip,  Grid,   // <--- FALTABA ESTE
  TextField,FormControl,
  InputLabel,
  Select,
  MenuItem,Collapse,
} from '@mui/material';

// --- Iconos ---
import {
  ExpandMore as ExpandMoreIcon,
  OndemandVideo as OndemandVideoIcon,
  Article as ArticleIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  AutoStories as AutoStoriesIcon,
  NavigateNext as NavigateNextIcon,
  Assessment as AssessmentIcon,
  AccessTime as AccessTimeIcon,
  PeopleAlt as PeopleAltIcon,
  Checklist as ChecklistIcon,
  EmojiEvents as EmojiEventsIcon,
  VideoLabel as VideoLabelIcon,
  AllInclusive as AllInclusiveIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  Edit as EditIcon,
  Terminal as TerminalIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Grade as GradeIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';

// --- Helper para formatear bytes ---
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// === COMPONENTES INTERNOS ===

// 1. TABLA DE ESTUDIANTES (Profesor) - Funcional
const StudentsTab = ({ courseId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`/api/course/${courseId}/students/`)
      .then(res => setStudents(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <Box sx={{p:3, textAlign:'center'}}><CircularProgress /></Box>;
  if (students.length === 0) return <Alert severity="info" sx={{mt:2}}>Aún no hay estudiantes inscritos en este curso.</Alert>;

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ width: '100%', mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Estudiante</TableCell>
            <TableCell align="center">XP Acumulado</TableCell>
            <TableCell align="center">Email</TableCell>
            <TableCell align="right">Perfil</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell component="th" scope="row">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{student.username[0].toUpperCase()}</Avatar>
                  <Typography variant="subtitle2" fontWeight="bold">{student.username}</Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Chip icon={<EmojiEventsIcon />} label={`${student.experience_points} XP`} color="warning" variant="outlined" size="small" />
              </TableCell>
              <TableCell align="center">
                 <Typography variant="body2" color="text.secondary">{student.email}</Typography>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Ver Perfil">
                  <IconButton size="small"><AssessmentIcon /></IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// 2. GESTOR DE ARCHIVOS (VISUALMENTE CORREGIDO)
const ResourcesTab = ({ courseId, isProfessor, courseStructure = [],refreshTrigger }) => { 
  const [resources, setResources] = useState([]); 
  const [uploading, setUploading] = useState(false);
  
  // Estados para selección de destino
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');

  // Cargar archivos
  useEffect(() => {
    if(courseId) fetchFiles();
  }, [courseId,refreshTrigger]);

  const fetchFiles = () => {
    axiosInstance.get(`/api/courses/${courseId}/all_resources/`)
      .then(res => setResources(res.data))
      .catch(err => console.error("Error cargando archivos", err));
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedLessonId) {
        alert("Selecciona una lección primero.");
        return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
        await axiosInstance.post(`/api/lesson/${selectedLessonId}/resources/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        fetchFiles(); 
        e.target.value = null; 
    } catch (err) {
        console.error(err);
        alert("Error al subir archivo.");
    } finally {
        setUploading(false);
    }
  };

  const handleDelete = async (resourceId, lessonIdTarget) => {
      if(!window.confirm("¿Borrar archivo permanentemente?")) return;
      try {
          await axiosInstance.delete(`/api/lesson/${lessonIdTarget}/resources/${resourceId}/`);
          setResources(prev => prev.filter(r => r.id !== resourceId));
      } catch(err) { console.error(err); }
  };

  const availableLessons = selectedModuleId && Array.isArray(courseStructure)
    ? courseStructure.find(m => m.id == selectedModuleId)?.lessons || []
    : [];

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      
      {/* PANEL DE SUBIDA (Solo Profesor) */}
      {isProfessor && (
        <Paper variant="outlined" sx={{ p: 3, mb: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{display:'flex', alignItems:'center', gap:1, mb: 2}}>
                <CloudUploadIcon color="primary"/> Subir Nuevo Recurso
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
                {/* SELECTOR DE MÓDULO */}
                <Grid item xs={12} md={5}>
                    <FormControl fullWidth size="small" sx={{ minWidth: 200 }}> {/* <-- Ancho mínimo forzado */}
                        <InputLabel id="select-module-label">Seleccionar Módulo</InputLabel>
                        <Select
                            labelId="select-module-label"
                            label="Seleccionar Módulo"
                            value={selectedModuleId}
                            onChange={(e) => {
                                setSelectedModuleId(e.target.value);
                                setSelectedLessonId(''); 
                            }}
                        >
                            {courseStructure.map((m) => (
                                <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* SELECTOR DE LECCIÓN */}
                <Grid item xs={12} md={5}>
                    <FormControl fullWidth size="small" disabled={!selectedModuleId} sx={{ minWidth: 200 }}> {/* <-- Ancho mínimo forzado */}
                        <InputLabel id="select-lesson-label">Seleccionar Lección</InputLabel>
                        <Select
                            labelId="select-lesson-label"
                            label="Seleccionar Lección"
                            value={selectedLessonId}
                            onChange={(e) => setSelectedLessonId(e.target.value)}
                        >
                            {availableLessons.length > 0 ? (
                                availableLessons.map((l) => (
                                    <MenuItem key={l.id} value={l.id}>{l.title}</MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled value="">No hay lecciones</MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>

                {/* BOTÓN SUBIR */}
                <Grid item xs={12} md={2}>
                    <Button
                        variant="contained"
                        component="label"
                        fullWidth
                        disabled={!selectedLessonId || uploading}
                        startIcon={uploading ? <CircularProgress size={20} color="inherit"/> : <CloudUploadIcon />}
                        sx={{ height: 40 }} // Altura fija para alinear con los inputs
                    >
                        {uploading ? "..." : "Subir"}
                        <input type="file" hidden onChange={handleUpload} />
                    </Button>
                </Grid>
            </Grid>
        </Paper>
      )}

      {/* LISTA DE ARCHIVOS */}
      {resources.length === 0 ? (
         <Alert severity="info" variant="outlined">No hay archivos compartidos en este curso.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <List disablePadding>
                {resources.map((file, index) => (
                    <React.Fragment key={file.id}>
                        <ListItem alignItems="flex-start"
                            secondaryAction={
                                <Box>
                                    <IconButton edge="end" color="primary" component="a" href={file.file} target="_blank" download sx={{mr:1}}>
                                        <DownloadIcon />
                                    </IconButton>
                                    {isProfessor && (
                                        <IconButton edge="end" color="error" onClick={() => handleDelete(file.id, file.lesson_id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            }
                        >
                            <ListItemIcon sx={{ mt: 1 }}>
                                <ArticleIcon color="action" fontSize="large" />
                            </ListItemIcon>
                            <ListItemText 
                                primary={<Typography variant="subtitle1" fontWeight="600">{file.title}</Typography>}
                                secondary={
                                    <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip 
                                                label={`${file.module_title || 'Módulo'} > ${file.lesson_title || 'Lección'}`} 
                                                size="small" 
                                                color="primary" 
                                                variant="outlined" 
                                                component="span" // <--- ¡ESTO ARREGLA EL ERROR DE HYDRATION!
                                                sx={{ fontSize: '0.75rem', height: 22, cursor: 'default' }} 
                                                clickable={false} // Aseguramos que no sea un botón interactivo
                                            />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatBytes(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                } 
                            />
                        </ListItem>
                        {index < resources.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                ))}
            </List>
        </TableContainer>
      )}
    </Box>
  );
};

// 3. CONFIGURACIÓN (Solo Profesor) - Funcional
const ConfigurationTab = ({ courseId, isPublished, onUpdateStatus }) => {
    const handleArchive = async () => {
        if(!window.confirm("¿Estás seguro? Los alumnos no podrán ver el curso si lo archivas.")) return;
        try {
            const res = await axiosInstance.patch(`/api/courses/${courseId}/status/`, {
                is_published: !isPublished
            });
            onUpdateStatus(res.data.is_published);
            alert(`Curso ${res.data.is_published ? 'Publicado' : 'Archivado'} correctamente.`);
        } catch (err) { console.error(err); alert("Error al actualizar estado"); }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Estado del Curso</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Actualmente el curso está: <strong>{isPublished ? "PÚBLICO" : "OCULTO (ARCHIVADO)"}</strong>.
                </Typography>
                <Button 
                    variant={isPublished ? "outlined" : "contained"} 
                    color={isPublished ? "error" : "success"} 
                    startIcon={isPublished ? <DeleteIcon /> : <CheckCircleIcon />}
                    onClick={handleArchive}
                >
                    {isPublished ? "Archivar Curso" : "Publicar Curso"}
                </Button>
            </Paper>
        </Box>
    );
};

// 4. MIS NOTAS (Alumno) - Funcional (Nuevo)
const StudentGradesTab = ({ courseId }) => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get(`/api/courses/${courseId}/gradebook/`)
            .then(res => setGrades(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [courseId]);

    if (loading) return <CircularProgress />;
    if (grades.length === 0) return <Alert severity="info" sx={{mt:2}}>No tienes tareas calificadas aún.</Alert>;

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Actividad</TableCell>
                        <TableCell align="right">Calificación</TableCell>
                        <TableCell align="right">Fecha</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {grades.map((item, idx) => (
                        <TableRow key={idx}>
                            <TableCell>
                                <Typography variant="body2" fontWeight="bold">{item.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{item.type === 'assignment' ? 'Tarea' : 'Examen'}</Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Chip 
                                    label={item.grade ? item.grade : 'Pendiente'} 
                                    color={item.grade ? (item.grade >= 11 ? 'success' : 'error') : 'default'} 
                                    size="small" 
                                />
                            </TableCell>
                            <TableCell align="right">
                                {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
// === NUEVO COMPONENTE: ITEM DE LECCIÓN EXPANDIBLE CON DRAG & DROP ===

const LessonItem = ({ lesson, isOwner, navigate, courseId, onUploadFile, onEditItem }) => {
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null); // Referencia para el input oculto

  const handleDragOver = (e) => { e.preventDefault(); if(isOwner) setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (!isOwner) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUploadFile(files, lesson.id);
  };

  // Manejar clic en botón "Subir Archivo"
  const handleFileBtnClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
          onUploadFile(Array.from(e.target.files), lesson.id);
      }
  };

  // Construimos la lista de contenidos
  const contents = [
    ...(lesson.live_quizzes || []).map(q => ({ ...q, type: 'live_quiz', icon: <EmojiEventsIcon color="warning"/>, label: 'Quiz en Vivo' })),
    ...(lesson.live_code_challenges || []).map(c => ({ ...c, type: 'live_code', icon: <TerminalIcon color="secondary"/>, label: 'Desafío IA' })),
    ...(lesson.resources || []).map(r => ({ ...r, type: 'file', icon: <ArticleIcon color="info"/>, label: 'Archivo' })),
    // Aquí podrías agregar los quizzes normales si el backend los manda en la lista 'quizzes'
    // ...(lesson.quizzes || []).map(q => ({ ...q, type: 'standard_quiz', icon: <AssessmentIcon color="success"/>, label: 'Quiz Calificado' })),
  ];

  return (
    <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      
      {/* CABECERA DE LA LECCIÓN */}
      <ListItemButton 
        onClick={() => setExpanded(!expanded)}
        sx={{ 
            py: 2, pl: 3, pr: 2, 
            bgcolor: isDragging ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
            borderLeft: isDragging ? '4px solid #2196f3' : '4px solid transparent',
            transition: '0.2s'
        }}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
            <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', opacity: 0.7 }} />
        </ListItemIcon>
        
        <ListItemText 
            primary={<Typography fontWeight={600}>{lesson.title}</Typography>} 
            secondary={`Lección ${lesson.order + 1} • ${contents.length} elementos`} 
        />

        {/* --- BARRA DE HERRAMIENTAS DEL PROFESOR --- */}
        {isOwner && (
            <Box 
                sx={{ display: 'flex', gap: 0.5, mr: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 0.5 }}
                onClick={(e) => e.stopPropagation()} 
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* 1. Quiz Rápido (En Vivo) */}
                <Tooltip title="Crear Quiz en Vivo (Kahoot)">
                    <IconButton 
                        size="small" 
                        sx={{ color: '#ffca28', '&:hover': {bgcolor: 'rgba(255, 202, 40, 0.1)'} }}
                        onClick={() => onEditItem('create_live_quiz', lesson.id)}
                    >
                        <EmojiEventsIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                {/* 2. Desafío Código (IA) */}
                <Tooltip title="Crear Desafío de Código">
                    <IconButton 
                        size="small" 
                        sx={{ color: '#f06292', '&:hover': {bgcolor: 'rgba(240, 98, 146, 0.1)'} }}
                        onClick={() => onEditItem('create_live_challenge', lesson.id)}
                    >
                        <TerminalIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                {/* 3. Quiz Normal (Calificado) */}
                <Tooltip title="Crear Examen Calificado">
                    <IconButton 
                        size="small" 
                        sx={{ color: '#66bb6a', '&:hover': {bgcolor: 'rgba(102, 187, 106, 0.1)'} }}
                        onClick={() => onEditItem('create_standard_quiz', lesson.id)}
                    >
                        <AssessmentIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                {/* 4. Subir Archivo */}
                <Tooltip title="Subir Archivo">
                    <IconButton 
                        size="small" 
                        sx={{ color: '#42a5f5', '&:hover': {bgcolor: 'rgba(66, 165, 245, 0.1)'} }}
                        onClick={handleFileBtnClick}
                    >
                        <CloudUploadIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <span style={{color: 'red', fontSize: '20px'}}>TEST</span>
                <Tooltip title="Asignar Tarea (Entrega de Archivo/Texto)">
                    <IconButton 
                        size="small" 
                        sx={{ color: '#ab47bc', '&:hover': {bgcolor: 'rgba(171, 71, 188, 0.1)'} }}
                        onClick={() => onEditItem('create_assignment', lesson.id)}
                    >
                        <AssignmentIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                {/* Input oculto para archivos */}
                <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                />
            </Box>
        )}

        <Button 
            size="small" 
            variant="outlined" 
            onClick={(e) => { e.stopPropagation(); navigate(`/courses/${courseId}/lessons/${lesson.id}`); }}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'text.secondary', minWidth: 0, px: 2 }}
        >
            Entrar
        </Button>
      </ListItemButton>

      {/* CONTENIDO DESPLEGABLE */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 9, pr: 3, pb: 3, bgcolor: 'rgba(0,0,0,0.02)' }}>
            <List dense disablePadding>
                {contents.map((item) => (
                    <ListItem 
                        key={`${item.type}-${item.id}`} 
                        sx={{ 
                            borderLeft: '1px solid rgba(255,255,255,0.1)', 
                            ml: 1, mb: 1, borderRadius: 1,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                        }}
                        secondaryAction={
                            <Box>
                                {item.type === 'file' ? (
                                    <IconButton size="small" color="primary" href={item.file} target="_blank" download><DownloadIcon fontSize="small"/></IconButton>
                                ) : (
                                    <Button size="small" onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)}>Ir</Button>
                                )}
                                {isOwner && (
                                    <IconButton size="small" onClick={() => onEditItem('edit_' + item.type, item.id)}><EditIcon fontSize="small" /></IconButton>
                                )}
                            </Box>
                        }
                    >
                        <ListItemIcon sx={{minWidth: 32}}>{item.icon}</ListItemIcon>
                        <ListItemText 
                            primary={item.title} 
                            secondary={item.type === 'file' ? formatBytes(item.file_size) : item.label} 
                        />
                    </ListItem>
                ))}
                {contents.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{display:'block', py:1, fontStyle:'italic'}}>
                        Sin contenido extra. Usa los botones de arriba para añadir material.
                    </Typography>
                )}
            </List>
        </Box>
      </Collapse>
    </Box>
  );
};
// === COMPONENTE PRINCIPAL ===
function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme(); 
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]); 
  
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [modalTarget, setModalTarget] = useState({ type: null, lessonId: null });
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [resourceUpdateTrigger, setResourceUpdateTrigger] = useState(0);
  const refreshCourseData = async () => {
      try {
        // No ponemos setLoading(true) aquí para que no parpadee toda la pantalla al actualizar
        // solo actualizamos los datos silenciosamente.
        const [courseRes, enrollRes, compRes] = await Promise.all([
          axiosInstance.get(`/api/courses/${courseId}/`),
          axiosInstance.get(`/api/enrollments/my_enrollments/`),
          axiosInstance.get('/api/completions/my_completions/')
        ]);

        setCourse(courseRes.data);
        setCompletedLessons(compRes.data.map(c => c.lesson.id));
        
        // (Tu lógica de roles...)
        if (courseRes.data.professor && user.username === courseRes.data.professor.username) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
          setIsEnrolled(!!enrollRes.data.find(e => e.course.id === parseInt(courseId)));
        }
      } catch (err) {
        console.error(err);
        // Solo mostramos error si es la carga inicial y no tenemos curso
        if (!course) setError("Error cargando el curso.");
      } finally {
        setLoading(false);
      }
  };
  useEffect(() => {
    if (user) {
        setLoading(true); // Spinner inicial
        refreshCourseData();
    }
  }, [courseId, user]);
  // --- Carga de Datos ---
  // --- Función para Subida Rápida (Drag & Drop) ---
  const handleQuickUpload = async (files, lessonIdTarget) => {
    if (!files || files.length === 0) return;
    
    setSnackbarMessage("Subiendo archivo...");
    setSnackbarOpen(true);

    // Subimos el primer archivo (puedes hacer un loop si quieres múltiples)
    const file = files[0]; 
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
        await axiosInstance.post(`/api/lesson/${lessonIdTarget}/resources/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSnackbarMessage("¡Archivo subido correctamente!");
        setSnackbarSeverity("success");
        refreshCourseData();
        // RECARGAR DATOS (Importante para que aparezca en la lista)
        // Truco rápido: Volver a llamar a la API del curso
        const res = await axiosInstance.get(`/api/courses/${courseId}/`);
        setCourse(res.data);
        setResourceUpdateTrigger(prev => prev + 1);
    } catch (err) {
        console.error(err);
        setSnackbarMessage("Error al subir el archivo.");
        setSnackbarSeverity("error");
    } finally {
        setSnackbarOpen(true);
    }
  };
  const handleEnroll = async () => {
    try {
        await axiosInstance.post('/api/enroll/', { course_id: courseId });
        setIsEnrolled(true);
        setSnackbarMessage("¡Bienvenido al curso!");
        setSnackbarOpen(true);
    } catch (err) { console.error(err); }
  };

  const calculateProgress = () => {
    if (!course || !course.modules) return 0;
    let totalLessons = 0;
    course.modules.forEach(m => totalLessons += m.lessons?.length || 0);
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.length / totalLessons) * 100);
  };

  if (loading) return <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{m:3}}>{error}</Alert>;
  if (!course) return null;

  const progress = calculateProgress();

  return (
    <Box sx={{ pb: 10, width: '100%' }}>
      
      {/* 1. HERO SECTION (Flexbox para ocupar todo) */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          pt: 6, pb: 8, 
          px: { xs: 3, md: 5 },
          mb: -4,
          width: '100%'
        }}
      >
         {/* ESTRUCTURA FLEXBOX IGUAL A LESSON PAGE */}
         <Box sx={{ 
             display: 'flex', 
             flexDirection: { xs: 'column', md: 'row' }, 
             gap: 4, 
             alignItems: 'flex-start',
             width: '100%' 
         }}> 
           
           {/* COLUMNA IZQUIERDA HERO (Información) */}
           <Box sx={{ flex: 1 }}>
               <Breadcrumbs sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                  <Link component={RouterLink} to="/courses" color="inherit" underline="hover">Cursos</Link>
                  <Typography color="white">{course.title}</Typography>
               </Breadcrumbs>

                <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>{course.title}</Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, fontWeight: 400 }}>{course.description}</Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                   <Chip icon={<SchoolIcon sx={{color:'white !important'}}/>} label={`Prof. ${course.professor?.username}`} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                   <Chip icon={<AutoStoriesIcon sx={{color:'white !important'}}/>} label={`${course.modules.length} Módulos`} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                   <Chip icon={<AccessTimeIcon sx={{color:'white !important'}}/>} label={course.estimated_duration || "Ritmo propio"} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                </Box>
           </Box>
             
           {/* COLUMNA DERECHA HERO (Tarjeta Flotante) - Ancho fijo como Sidebar */}
           <Box sx={{ width: { xs: '100%', md: 350 }, flexShrink: 0 }}>
                <Paper 
                  sx={{ 
                    p: 3, width: '100%', 
                    borderRadius: 4, 
                    bgcolor: 'rgba(30, 30, 30, 0.6)', 
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white', 
                    textAlign: 'center',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
                  }}
                >
                    {isOwner ? (
                        <>
                            <Typography variant="h6" gutterBottom>Panel de Profesor</Typography>
                            <Button fullWidth variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/courses/${courseId}/edit`)} sx={{ mb: 2, bgcolor: 'white', color: 'primary.main', '&:hover': {bgcolor: '#f0f0f0'} }}>
                                Editar Curso
                            </Button>
                            <Button fullWidth variant="outlined" startIcon={<AssessmentIcon />} onClick={() => navigate(`/courses/${courseId}/grades`)} sx={{ color: 'white', borderColor: 'white', '&:hover': {borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)'} }}>
                                Ver Notas
                            </Button>
                        </>
                    ) : isEnrolled ? (
                        <>
                            <Typography variant="subtitle2" align="left" gutterBottom>Tu Progreso</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.3)' }} />
                                <Typography variant="body2" fontWeight="bold">{progress}%</Typography>
                            </Box>
                            <Button fullWidth variant="contained" size="large" startIcon={<PlayCircleOutlineIcon />} sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': {bgcolor: '#f0f0f0'} }} onClick={() => navigate(`/courses/${courseId}/lessons/${completedLessons[completedLessons.length-1] || course.modules[0]?.lessons[0]?.id}`)}>
                                {progress > 0 ? 'Continuar' : 'Empezar Curso'}
                            </Button>
                        </>
                    ) : (
                        <>
                           <Typography variant="h5" fontWeight="bold" gutterBottom>Gratis</Typography>
                           <Button fullWidth variant="contained" size="large" sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': {bgcolor: '#f0f0f0'} }} onClick={handleEnroll}>Inscribirse Ahora</Button>
                           <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.7 }}>Acceso de por vida • Certificado incluido</Typography>
                        </>
                    )}
                </Paper>
           </Box>

         </Box>
      </Box>

      {/* 2. CONTENIDO PRINCIPAL (Full Width - Flexbox) */}
      <Box sx={{ mt: 6, px: { xs: 3, md: 5 }, width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="fullWidth">
            <Tab label="Contenido" icon={<AutoStoriesIcon />} iconPosition="start" />
            <Tab label={isOwner ? "Estudiantes" : "Mis Notas"} icon={<PeopleAltIcon />} iconPosition="start" />
            <Tab label="Recursos" icon={<ArticleIcon />} iconPosition="start" />
            {isOwner && <Tab label="Configuración" icon={<AssessmentIcon />} iconPosition="start" />}
          </Tabs>
        </Box>

        {/* --- TAB 0: CONTENIDO --- */}
        <Box sx={{ display: currentTab === 0 ? 'block' : 'none' }}>
            
            {/* ESTRUCTURA FLEXBOX IGUAL A LESSON PAGE (70% - 30%) */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: 4,
                width: '100%'
            }}>
                
                {/* COLUMNA IZQUIERDA (Temario) - Flex 1 para ocupar el resto */}
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Estructura del Curso</Typography>
                    {course.modules.map((module, idx) => (
                        <Accordion 
                            key={module.id} 
                            defaultExpanded={idx === 0} 
                            sx={{ 
                                mb: 2, borderRadius: '12px !important', 
                                bgcolor: 'rgba(255,255,255,0.03)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                boxShadow: 'none', '&:before': {display:'none'}, color: 'text.primary' 
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight="bold">Módulo {idx + 1}: {module.title}</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <List disablePadding>
                                  {module.lessons?.map((lesson) => (
                                      <LessonItem 
                                          key={lesson.id}
                                          lesson={lesson}
                                          isOwner={isOwner}
                                          navigate={navigate}
                                          courseId={courseId}
                                          onUploadFile={handleQuickUpload} // Pasamos la función de subida
                                          onEditItem={(action, id) => {
                                            console.log("Acción:", action, "ID:", id); // Para depurar

                                            if (action === 'create_live_quiz') {
                                                // Abrir modal de Quiz Rápido
                                                setModalTarget({ type: 'live_quiz', lessonId: id });
                                            } 
                                            else if (action === 'create_live_challenge') {
                                                // Abrir modal de Desafío Código
                                                setModalTarget({ type: 'live_challenge', lessonId: id });
                                            }
                                            else if (action === 'create_assignment') {
                                                setModalTarget({ type: 'create_assignment', lessonId: id });
                                            } 
                                            else if (action === 'create_standard_quiz') {
                                                // Redirigir a la página de creación de Quiz Normal (Examen)
                                                // Asumiendo que tienes una ruta para esto
                                                navigate(`/courses/${courseId}/lessons/${id}/quiz/create`);
                                                // O si prefieres un modal (pero suele ser muy grande para un modal):
                                                // alert("Implementar modal de Quiz Normal");
                                            }
                                            else if (action.startsWith('edit_')) {
                                                // Lógica para editar items existentes
                                                alert("Función de editar pendiente para: " + action);
                                            }
                                        }}
                                      />
                                  ))}
                              </List>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
                
                {/* COLUMNA DERECHA (Sidebar) - Ancho Fijo */}
                <Box sx={{ width: { xs: '100%', md: 350 }, flexShrink: 0 }}>
                    <Box sx={{ position: 'sticky', top: 100 }}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3, bgcolor: 'background.paper', border: 'none' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                                <AssessmentIcon color="primary" fontSize="small" /> Resumen
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <List dense disablePadding>
                                <ListItem sx={{ px: 0 }}><ListItemIcon sx={{minWidth:36}}><AutoStoriesIcon fontSize="small"/></ListItemIcon><ListItemText primary={`${course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} lecciones`} /></ListItem>
                                <ListItem sx={{ px: 0 }}><ListItemIcon sx={{minWidth:36}}><AccessTimeIcon fontSize="small"/></ListItemIcon><ListItemText primary={course.estimated_duration || "Variable"} /></ListItem>
                                <ListItem sx={{ px: 0 }}><ListItemIcon sx={{minWidth:36}}><GradeIcon fontSize="small"/></ListItemIcon><ListItemText primary="Certificado al finalizar" /></ListItem>
                            </List>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: 'none' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                                <CheckCircleIcon color="success" fontSize="small" /> Accesos
                            </Typography>
                            {isOwner ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                                    <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setCurrentTab(2)}>Subir Archivos</Button>
                                    <Button variant="outlined" startIcon={<AssessmentIcon />} onClick={() => navigate(`/courses/${courseId}/grades`)}>Libro de Notas</Button>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">Completa todos los módulos para obtener tu certificado.</Typography>
                            )}
                        </Paper>
                    </Box>
                </Box>

            </Box>
        </Box>

        {/* --- TAB 1: ESTUDIANTES (Profesor) / MIS NOTAS (Alumno) --- */}
        <Box sx={{ display: currentTab === 1 ? 'block' : 'none' }}>
            {isOwner ? (
                <StudentsTab courseId={courseId} />
            ) : (
                <StudentGradesTab courseId={courseId} />
            )}
        </Box>

        {/* --- TAB 2: RECURSOS (Funcional para ambos) --- */}
        <Box sx={{ display: currentTab === 2 ? 'block' : 'none' }}>
            <ResourcesTab 
                courseId={courseId} 
                isProfessor={isOwner} 
                courseStructure={course.modules} // <--- ¡IMPORTANTE! PASAR ESTO
                refreshTrigger={resourceUpdateTrigger}
            />
        </Box>
        
        {/* --- TAB 3: CONFIGURACIÓN (Funcional - Solo Profesor) --- */}
        {isOwner && (
            <Box sx={{ display: currentTab === 3 ? 'block' : 'none' }}>
                <ConfigurationTab 
                    courseId={courseId} 
                    isPublished={course.is_published} 
                    onUpdateStatus={(newStatus) => setCourse({...course, is_published: newStatus})}
                />
            </Box>
        )}

      </Box>

      {/* --- MODALES --- */}
      <Modal open={!!modalTarget.type} onClose={() => setModalTarget({ type: null, lessonId: null })}>
        <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', borderRadius: 2 }}>
            {modalTarget.type === 'live_quiz' && <CreateLiveQuiz lessonId={modalTarget.lessonId} onQuizCreated={() => { setSnackbarMessage("Quiz Creado"); setSnackbarOpen(true); setModalTarget({type:null}); }} />}
            {modalTarget.type === 'live_challenge' && <CreateLiveCodeChallenge lessonId={modalTarget.lessonId} onChallengeCreated={() => { setSnackbarMessage("Reto Creado"); setSnackbarOpen(true); setModalTarget({type:null}); }} />}
            {modalTarget.type === 'create_assignment' && (
                <CreateAssignmentModal 
                    lessonId={modalTarget.lessonId} 
                    onCreated={() => { 
                        setSnackbarMessage("Tarea Publicada exitosamente"); 
                        setSnackbarOpen(true); 
                        setModalTarget({type:null}); 
                        refreshCourseData(); // Recarga para asegurar que todo esté sincro
                    }} 
                />
            )}
        </Paper>
      </Modal>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
    </Box>
  );
}

export default CourseDetailPage;