import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";
import PetsIcon from '@mui/icons-material/Pets';
import { JitsiMeeting } from '@jitsi/react-sdk';
import TerminalIcon from '@mui/icons-material/Terminal';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
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
  Chip,
  CardMedia, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  LinearProgress, // <-- ¡Importado para la Mascota!
  Modal,
  Drawer, 
  Badge,
  Grid
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; 
import DownloadIcon from '@mui/icons-material/Download'; 
import CodeIcon from '@mui/icons-material/Code';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

// --- WebSocket y CodeShare ---
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; 
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; 
import { useAuth } from '../context/AuthContext'; 
import CodeChallengePanel from '../components/CodeChallengePanel';
// === VARIANTES DE ANIMACIÓN ===
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

// --- Estilo "Glass" ---
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

// --- Función de Scrollbar ---
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

// --- Componente de Pestaña ---
function TabPanel(props) {
  // 1. Añadimos 'enableScroll' y le damos un valor por defecto de 'true'
  const { children, value, index, theme, enableScroll = true, ...other } = props;
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
      <Box sx={{ 
          height: '100%', 
          // 2. Hacemos el scroll condicional
          overflowY: enableScroll ? 'auto' : 'hidden', 
          ...getScrollbarStyles(theme) 
        }}>
        {children}
      </Box>
    </div>
  );
}

// --- Helper para formatear tamaño de archivo ---
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// --- Componentes de Mensaje (para el Chat) ---
const CodeShareBlock = ({ sender, code, language, time, isStartOfGroup, user, onCopy }) => {
  const isMe = sender.username === user.username; 
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      onCopy("¡Código copiado!");
    }, (err) => {
      onCopy("Error al copiar el código.");
    });
  };
  const handleDownloadCode = () => {
    let ext = 'txt';
    if (language === 'python') ext = 'py';
    if (language === 'javascript') ext = 'js';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `snippet.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', alignItems: 'flex-start', mt: isStartOfGroup ? 2 : 0.25 }}>
      {!isMe && (<Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>{sender.username[0]}</Avatar>)}
      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: `1px solid #444`, width: '100%' }}>
        {isStartOfGroup && !isMe && (<Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', px: 2, pt: 1.5 }}>{sender.username}</Typography>)}
        <Box sx={{ p: '8px 16px', bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{language}</Typography>
          <Box><IconButton size="small" title="Copiar código" onClick={handleCopyCode}><ContentCopyIcon fontSize="small" /></IconButton><IconButton size="small" title="Descargar archivo" onClick={handleDownloadCode}><DownloadIcon fontSize="small" /></IconButton></Box>
        </Box>
        <SyntaxHighlighter language={language} style={atomDark} customStyle={{ margin: 0, padding: '16px', fontSize: '0.9rem' }} wrapLongLines={true}>{String(code).trim()}</SyntaxHighlighter>
        <Divider />
        <Typography variant="caption" sx={{ p: '4px 12px', display: 'block', textAlign: 'right', opacity: 0.7, bgcolor: 'background.paper' }}>{new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Typography>
      </Paper>
      {isMe && (<Avatar sx={{ bgcolor: '#888', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>{user.username[0]}</Avatar>)}
    </Box>
  );
};
const TextBlock = ({ sender, text, time, isStartOfGroup, user }) => {
  const isMe = sender.username === user.username; 
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', alignItems: 'flex-start', mt: isStartOfGroup ? 2 : 0.25 }}>
      {!isMe && (<Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>{sender.username[0]}</Avatar>)}
      <Paper sx={{ p: 1.5, borderRadius: 4, bgcolor: isMe ? 'primary.main' : 'background.paper', color: isMe ? 'primary.contrastText' : 'text.primary' }}>
        {isStartOfGroup && !isMe && (<Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>{sender.username}</Typography>)}
        <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}>{text}</Typography>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7, mt: 0.5 }}>{new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Typography>
      </Paper>
      {isMe && (<Avatar sx={{ bgcolor: '#888', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>{user.username[0]}</Avatar>)}
    </Box>
  );
};

// --- Componente "Chat de Lección" (Funcional) ---
const LessonChat = ({ 
  theme, 
  user, 
  chatHistory, 
  loadingHistory,
  setChatHistory, 
  setLoadingHistory, 
  readyState, 
  isSending,
  onSendJsonMessage, 
  onNotify, 
  conversationId,
  isActive
}) => {
  // --- Lógica del Scroll (Corregida) ---
  const chatContainerRef = useRef(null);
  
  const [tabValue, setTabValue] = useState(0); 
  const [textContent, setTextContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [codeLang, setCodeLang] = useState("python");

  useEffect(() => {
    // 1. Solo intenta hacer scroll SI la pestaña está activa
    if (chatContainerRef.current && isActive) {
      const scrollableNode = chatContainerRef.current;
      scrollableNode.scrollTop = scrollableNode.scrollHeight;
    }
  }, [chatHistory, isActive]);

  // --- Lógica de Cargar Historial (Sin cambios) ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!conversationId) {
        setLoadingHistory(false);
        setChatHistory([]);
        return; 
      }
      try {
        setLoadingHistory(true);
        const response = await axiosInstance.get(`/api/inbox/conversations/${conversationId}/messages/`);
        if (response.data && Array.isArray(response.data.results)) {
          setChatHistory(response.data.results.reverse());
        } else if (Array.isArray(response.data)) {
          setChatHistory(response.data);
        } else {
          setChatHistory([]);
        }
      } catch (err) {
        console.error("Error al cargar historial de chat:", err);
        setChatHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [conversationId, setChatHistory, setLoadingHistory]);

  // --- Lógica de Enviar Mensaje (Sin cambios) ---
  const handleChatSubmit = (e) => {
    e.preventDefault();
    const isCode = tabValue === 1;
    const content = isCode ? codeContent : textContent;
    if (content.trim() === "" || readyState !== 1) return;
    onSendJsonMessage({
      message_type: isCode ? 'CODE' : 'TEXT',
      content: content,
      language: isCode ? codeLang : null
    });
    if (isCode) setCodeContent("");
    else setTextContent("");
  };

  return (
    <Box sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      {/* Lista de Mensajes (Scrollable) */}
      <Box 
        ref={chatContainerRef} // <-- El Ref va aquí
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 2, 
          ...getScrollbarStyles(theme),
          display: 'flex',
          flexDirection: 'column' 
        }}
      >
        {loadingHistory ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
        ) : (
          chatHistory.map((msg, index) => {
            const prevMsg = chatHistory[index - 1];
            const isStartOfGroup = index === 0 || !prevMsg || msg.sender.username !== prevMsg.sender.username;
            if (msg.message_type === 'CODE') {
              return <CodeShareBlock key={msg.id} sender={msg.sender} code={msg.content} language={msg.language} time={msg.timestamp} isStartOfGroup={isStartOfGroup} user={user} onCopy={onNotify} />
            }
            return <TextBlock key={msg.id} sender={msg.sender} text={msg.content} time={msg.timestamp} isStartOfGroup={isStartOfGroup} user={user} />
          })
        )}
        {chatHistory.length === 0 && !loadingHistory && (
          <Typography sx={{p: 2, textAlign: 'center', color: 'text.secondary'}}>
            Aún no hay mensajes en este chat.
          </Typography>
        )}
      </Box>
      <Divider />
      
      {/* --- ¡¡¡EL FORMULARIO DE INPUT (RESTURADO)!!! --- */}
      <Box component="form" onSubmit={handleChatSubmit} sx={{ p: 0, bgcolor: 'background.default' }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<ChatIcon />} iconPosition="start" label="Mensaje" sx={{minHeight: 48}} />
          <Tab icon={<CodeIcon />} iconPosition="start" label="CodeShare" sx={{minHeight: 48}} />
        </Tabs>
        
        {/* Panel de Texto */}
        <Box sx={{ p: 2, display: tabValue === 0 ? 'block' : 'none' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Escribe tu pregunta aquí..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            disabled={readyState !== 1 || isSending}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton color="primary" type="submit" disabled={readyState !== 1 || isSending}><SendIcon /></IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        {/* Panel de Código */}
        <Box sx={{ p: 2, display: tabValue === 1 ? 'block' : 'none' }}>
          <FormControl fullWidth size="small" sx={{ mb: 1.5 }} disabled={readyState !== 1 || isSending}>
            <InputLabel>Lenguaje</InputLabel>
            <Select value={codeLang} label="Lenguaje" onChange={(e) => setCodeLang(e.target.value)}>
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="javascript">JavaScript</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
              <MenuItem value="css">CSS</MenuItem>
              <MenuItem value="text">Texto Plano</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="Pega tu código aquí..."
            value={codeContent}
            onChange={(e) => setCodeContent(e.target.value)}
            disabled={readyState !== 1 || isSending}
            sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace' } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{alignSelf: 'flex-end'}}>
                  <IconButton color="primary" type="submit" disabled={readyState !== 1 || isSending}><SendIcon /></IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
      {/* --- FIN DEL FORMULARIO RESTAURADO --- */}
    </Box>
  );
};

// --- Componente "Mis Notas" (Funcional) ---
const LessonNotes = ({ theme, lessonId }) => {
  const [notes, setNotes] =useState([]);
  const [newNote, setNewNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    if (!lessonId) return;
    const fetchNotes = async () => {
      try {
        setLoadingNotes(true);
        const response = await axiosInstance.get(`/api/lessons/${lessonId}/notes/`);
        setNotes(response.data);
      } catch (err) { console.error("Error al cargar notas:", err); } 
      finally { setLoadingNotes(false); }
    };
    fetchNotes();
  }, [lessonId]);

  const handleAddNote = async (e) => {
    e.preventDefault(); 
    if (newNote.trim() === "") return;
    try {
      const response = await axiosInstance.post(`/api/lessons/${lessonId}/notes/`, {
        content: newNote, is_completed: false
      });
      setNotes([...notes, response.data]); 
      setNewNote(""); 
    } catch (err) { console.error("Error al añadir nota:", err); }
  };
  
  const handleDeleteNote = async (noteId) => {
    try {
      await axiosInstance.delete(`/api/lessons/${lessonId}/notes/${noteId}/`);
      setNotes(notes.filter(note => note.id !== noteId)); 
    } catch (err) { console.error("Error al borrar nota:", err); }
  };

  const handleToggleNote = async (note) => {
    try {
      const updatedNote = { ...note, is_completed: !note.is_completed };
      await axiosInstance.patch(`/api/lessons/${lessonId}/notes/${note.id}/`, {
        is_completed: updatedNote.is_completed
      });
      setNotes(notes.map(n => (n.id === note.id ? updatedNote : n)));
    } catch (err) { console.error("Error al actualizar nota:", err); }
  };

  return (
    <Box sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, ...getScrollbarStyles(theme) }}>
        {loadingNotes ? ( <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} /> ) : (
          <List dense>
            {notes.map(note => (
              <ListItem key={note.id} secondaryAction={ <IconButton edge="end" size="small" onClick={() => handleDeleteNote(note.id)}><DeleteIcon fontSize="small" /></IconButton> } disablePadding>
                <ListItemButton dense onClick={() => handleToggleNote(note)}>
                  <ListItemIcon sx={{minWidth: 0, mr: 1.5}}><Checkbox edge="start" tabIndex={-1} disableRipple checked={note.is_completed} /></ListItemIcon>
                  <ListItemText primary={note.content} sx={{textDecoration: note.is_completed ? 'line-through' : 'none', opacity: note.is_completed ? 0.7 : 1}} />
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
            endAdornment: ( <InputAdornment position="end"><IconButton color="primary" type="submit"><AddIcon /></IconButton></InputAdornment> ),
          }}
        />
      </Box>
    </Box>
  );
};

// --- PROFESSOR PANEL (VERSIÓN INTEGRADA / TRANSPARENTE) ---
const ProfessorPanel = ({ 
  theme, 
  gameInProgress, 
  handleEndGameParent, 
  onOpenDrawer, 
  quizStats 
}) => {

  return (
    <motion.div 
      variants={itemVariants} 
      style={{ height: '100%' }}
    >
      {/* CAMBIO CLAVE: 
          1. Usamos Box en lugar de Paper.
          2. Quitamos 'glassPaperStyle' porque el contenedor padre (TabPanel) ya lo tiene.
          3. Quitamos bordes y sombras externas.
      */}
      <Box 
        sx={{
          p: 3, // Padding interno para que el texto no toque los bordes
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto', // Scroll interno si el contenido es muy largo
          // Opcional: Si quieres ocultar la barra de scroll fea
          ...getScrollbarStyles(theme) 
        }}
      >
        
        {/* 1. CABECERA */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: -0.5 }}>
              Panel de Control
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: gameInProgress ? 'error.main' : 'success.main', boxShadow: gameInProgress ? '0 0 8px red' : '0 0 8px green' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                {gameInProgress ? 'EN VIVO' : 'SALA ESPERANDO'}
              </Typography>
            </Box>
          </Box>
          
          <Button 
            variant="contained" 
            size="medium"
            startIcon={<AssessmentIcon />}
            onClick={onOpenDrawer}
            sx={{ 
                borderRadius: 3, 
                // Un gradiente sutil para que destaque sin ser "otra tarjeta"
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 10px rgba(33, 203, 243, .3)',
                fontWeight: 700
            }}
          >
            Herramientas
          </Button>
        </Box>

        {/* 2. ZONA DE ACCIÓN (Hero Section) */}
        <Box sx={{ mb: 4 }}> 
            {/* Esta tarjeta interna SÍ mantiene su fondo para destacar del resto */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 4, 
                    // Fondo sutil que se mezcla mejor
                    bgcolor: gameInProgress ? 'rgba(244, 67, 54, 0.08)' : 'rgba(255, 255, 255, 0.03)', 
                    border: '1px dashed', 
                    borderColor: gameInProgress ? 'error.main' : 'divider',
                    borderRadius: 4,
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                }}
            >
              {gameInProgress === 'quiz' && (
                <>
                    <CircularProgress size={40} color="primary" thickness={5} sx={{ mb: 2 }} />
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Quiz en Curso</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                       Monitorizando respuestas en tiempo real...
                    </Typography>
                    <Button variant="contained" color="error" onClick={handleEndGameParent}>
                        Terminar Quiz
                    </Button>
                </>
              )}

              {gameInProgress === 'challenge' && (
                <>
                    <CircularProgress size={40} color="secondary" thickness={5} sx={{ mb: 2 }} />
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Desafío IA</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Los alumnos están programando...
                    </Typography>
                    <Button variant="contained" color="error" onClick={handleEndGameParent}>
                        Terminar Desafío
                    </Button>
                </>
              )}

              {!gameInProgress && (
                <Box sx={{ py: 2 }}>
                    <LiveTvIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1, opacity: 0.3 }} />
                    <Typography variant="h6" color="text.secondary" sx={{fontWeight: 600}}>
                        Sin actividad activa
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 300, mx: 'auto', mt: 1 }}>
                        Usa el botón <b>Herramientas</b> (arriba) para lanzar una actividad a la clase.
                    </Typography>
                </Box>
              )}
            </Paper>
        </Box>

        {/* 3. HISTORIAL (Integrado sin bordes extraños) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, letterSpacing: 1 }}>
                HISTORIAL RECIENTE
            </Typography>
            
            {/* Usamos un fondo oscuro sólido para el log, como en tu imagen, pero sin bordes externos */}
            <Paper 
                elevation={0}
                sx={{ 
                    flex: 1, 
                    bgcolor: '#1e1e1e', // Color oscuro sólido (ajusta si usas tema claro)
                    borderRadius: 3, 
                    p: 0,
                    overflow: 'hidden'
                }}
            >
                <List sx={{ width: '100%', bgcolor: 'transparent' }}>
                    <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                            primary={<Typography variant="body2" sx={{color: '#fff', fontWeight: 500}}>Clase iniciada correctamente</Typography>}
                            secondary={<Typography variant="caption" sx={{color: 'grey.500'}}>Hace 15 min</Typography>} 
                        />
                    </ListItem>
                    <Divider variant="inset" component="li" sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                    <ListItem>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <PeopleIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                            primary={<Typography variant="body2" sx={{color: '#fff', fontWeight: 500}}>Lista de asistencia actualizada</Typography>}
                            secondary={<Typography variant="caption" sx={{color: 'grey.500'}}>Hace 2 min</Typography>} 
                        />
                    </ListItem>
                </List>
            </Paper>
        </Box>

      </Box>
    </motion.div>
  );
};
// --- NUEVO COMPONENTE: CAJA DE HERRAMIENTAS (DRAWER) ---
// --- TOOLS DRAWER CORREGIDO ---
// --- COMPONENTE TOOLS DRAWER (COMPLETO) ---
const ToolsDrawer = ({ 
  open, onClose, theme, user, contacts, connectedIds, onGiveXp, 
  liveQuizzes, liveChallenges, onLaunchQuiz, onLaunchChallenge,
  lessonId 
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const isProfessor = user.role === 'PROFESSOR';
  
  // Estados internos
  const [resources, setResources] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 1. Cargar archivos al abrir el Drawer
  useEffect(() => {
    if (open && lessonId) {
        fetchResources();
    }
  }, [open, lessonId]);

  // Función para obtener archivos desde el backend
  const fetchResources = async () => {
    try {
        const res = await axiosInstance.get(`/api/lesson/${lessonId}/resources/`);
        setResources(res.data);
    } catch (err) { console.error("Error cargando recursos", err); }
  };

  // --- AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA ---
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name); 
        
        try {
            // Ajusta la URL si tu backend usa otra ruta
            await axiosInstance.post(`/api/lesson/${lessonId}/resources/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } catch (err) {
            console.error("Error subiendo archivo:", file.name, err);
            alert(`Error subiendo ${file.name}`);
        }
    }
    
    setUploading(false);
    fetchResources(); // Recargar la lista para ver el nuevo archivo
  };
  // -----------------------------------------

  // Función para borrar archivos
  const handleDeleteResource = async (resourceId) => {
      // eslint-disable-next-line no-restricted-globals
      if(!confirm("¿Estás seguro de borrar este archivo?")) return;
      try {
          await axiosInstance.delete(`/api/lesson/${lessonId}/resources/${resourceId}/`);
          setResources(resources.filter(r => r.id !== resourceId));
      } catch(err) { console.error(err); }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: 9999 }} 
      PaperProps={{ sx: { width: { xs: '100%', md: 500 }, bgcolor: 'background.paper' } }}
    >
      {/* CABECERA */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
           <AssessmentIcon /> Herramientas de Clase
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }}><NavigateNextIcon /></IconButton>
      </Box>

      {/* TABS */}
      <Tabs 
        value={currentTab} 
        onChange={(e, v) => setCurrentTab(v)} 
        variant="fullWidth" 
        indicatorColor="primary"
        textColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<PeopleIcon />} label="Alumnos" />
        <Tab icon={<CloudDownloadIcon />} label="Archivos" />
        {isProfessor && <Tab icon={<EmojiEventsIcon />} label="Actividades" />}
      </Tabs>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        
        {/* TAB 1: ALUMNOS */}
        {currentTab === 0 && (
          <List sx={{ p: 0 }}>
            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" color="text.secondary">
                    Total Conectados: {connectedIds ? connectedIds.size : 0} / {contacts ? contacts.length : 0}
                </Typography>
            </Box>
            {contacts && contacts.map(contact => {
              const isConnected = connectedIds && connectedIds.has(contact.id);
              return (
                <ListItem 
                  key={contact.id} 
                  divider
                  secondaryAction={
                    isProfessor && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Dar Puntos">
                            <IconButton onClick={() => onGiveXp(contact.id, 10)} color="primary" size="small">
                                <EmojiEventsIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Marcar Falta">
                            <IconButton color="error" size="small">
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                      </Box>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Badge 
                      overlap="circular" 
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      color={isConnected ? "success" : "error"}
                    >
                      <Avatar sx={{ bgcolor: isConnected ? 'primary.main' : 'grey.500' }}>
                        {contact.username && contact.username[0].toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={contact.username} 
                    secondary={isConnected ? "En línea" : "Desconectado"}
                    sx={{ mr: 8 }} 
                  />
                </ListItem>
              );
            })}
          </List>
        )}

        {/* TAB 2: ARCHIVOS */}
        {currentTab === 1 && (
            <Box sx={{ p: 3 }}>
                {/* ZONA DE CARGA (SOLO PROFESOR) */}
                {isProfessor && (
                    <Box sx={{ 
                        p: 3, border: '2px dashed', borderColor: uploading ? 'primary.main' : 'divider', 
                        borderRadius: 2, textAlign: 'center', bgcolor: 'action.hover', 
                        cursor: uploading ? 'wait' : 'pointer', mb: 3, transition: '0.3s'
                    }}>
                        {uploading ? (
                            <Box>
                                <CircularProgress size={24} sx={{mb: 1}} />
                                <Typography>Subiendo archivos...</Typography>
                            </Box>
                        ) : (
                            <>
                                <input 
                                    type="file" 
                                    multiple 
                                    id="drawer-file-upload" 
                                    style={{ display: 'none' }} 
                                    // AQUÍ SE LLAMA A LA FUNCIÓN QUE DABA ERROR
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="drawer-file-upload" style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}>
                                    <CloudDownloadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                    <Typography variant="h6" color="text.primary">Subir Material</Typography>
                                    <Typography variant="body2" color="text.secondary">Clic para seleccionar</Typography>
                                </label>
                            </>
                        )}
                    </Box>
                )}

                <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    ARCHIVOS DISPONIBLES ({resources.length})
                </Typography>
                
                <List>
                    {resources.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                            No hay archivos compartidos aún.
                        </Typography>
                    )}
                    {resources.map((file) => (
                        <ListItem 
                            key={file.id} 
                            sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 1 }}
                            secondaryAction={
                                isProfessor ? (
                                    <IconButton edge="end" color="error" onClick={() => handleDeleteResource(file.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                ) : (
                                    <IconButton edge="end" color="primary" component="a" href={file.file} target="_blank" download>
                                        <CloudDownloadIcon />
                                    </IconButton>
                                )
                            }
                        >
                            <ListItemIcon>
                                <InsertDriveFileIcon color="action" />
                            </ListItemIcon>
                            <ListItemText 
                                primary={file.title} 
                                secondary={new Date(file.uploaded_at).toLocaleDateString()} 
                                primaryTypographyProps={{ fontWeight: 500 }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>
        )}

        {/* TAB 3: ACTIVIDADES (SOLO PROFESOR) */}
        {currentTab === 2 && isProfessor && (
          <Box sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                QUIZZES RÁPIDOS
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4, mt: 1 }}>
              {liveQuizzes && liveQuizzes.map(quiz => (
                <Chip 
                  key={quiz.id} 
                  label={quiz.title} 
                  onClick={() => { onLaunchQuiz(quiz.id); }}
                  icon={<EmojiEventsIcon />}
                  color="primary"
                  clickable
                  sx={{ py: 2 }} 
                />
              ))}
              {(!liveQuizzes || liveQuizzes.length === 0) && <Alert severity="info" sx={{ width: '100%' }}>No hay quizzes creados.</Alert>}
            </Box>

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                DESAFÍOS DE CÓDIGO (IA)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {liveChallenges && liveChallenges.map(ch => (
                <Chip 
                  key={ch.id} 
                  label={ch.title} 
                  onClick={() => { onLaunchChallenge(ch.id); }}
                  icon={<TerminalIcon />}
                  color="secondary"
                  clickable
                  sx={{ py: 2 }}
                />
              ))}
               {(!liveChallenges || liveChallenges.length === 0) && <Alert severity="info" sx={{ width: '100%' }}>No hay desafíos creados.</Alert>}
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};
// === COMPONENTE PRINCIPAL ===
function LessonPage() {
  const { courseId, lessonId } = useParams(); 
  const navigate = useNavigate();
  const theme = useTheme(); 
  const { user, authTokens, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null); 
  console.log("USER DESDE AUTHCONTEXT:", user);
  const isProfessor = user.role === 'PROFESSOR';
  const [gameInProgress, setGameInProgress] = useState(null);
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

  // --- Estados del Quiz (Maqueta) ---
  const [quiz, setQuiz] = useState(null);
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true); 
  // Estados de UI
  const [sideTabValue, setSideTabValue] = useState(0);
  const [mainTabValue, setMainTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [contacts, setContacts] = useState([]);
  const [connectedUserIds, setConnectedUserIds] = useState(new Set());
  const [quizGameState, setQuizGameState] = useState({ view: 'hidden', data: null });
  const [quizStats, setQuizStats] = useState(null);
  const [currentXp, setCurrentXp] = useState(user?.experience_points || 0);
  const [timerProgress, setTimerProgress] = useState(100);
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const timerRef = useRef(null);
  const [codeSolution, setCodeSolution] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false); // <--- ESTADO DEL DRAWER
  const [liveQuizzes, setLiveQuizzes] = useState([]);      // <--- Mover aquí la carga
  const [liveChallenges, setLiveChallenges] = useState([]);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }
  // --- useEffect CONECTADO ---
  useEffect(() => {
    if (!user) return;
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        setError(null);
        setAssignment(null); 
        setSubmission(null); 
        setQuiz(null);
        setQuizAttempt(null);
        setFileToUpload(null); 
        setSubmissionContent(""); 
        setIsEditing(false); 
        setLoadingAssignment(true); 
        setLoadingQuiz(true);       

        const lessonResponse = await axiosInstance.get(`/api/lessons/${lessonId}/`);
        setLesson(lessonResponse.data);

        (async () => {
          try {
            const completionsResponse = await axiosInstance.get('/api/completions/my_completions/');
            const numericLessonId = parseInt(lessonId, 10);
            const completed = completionsResponse.data.some(comp => comp.lesson.id === numericLessonId);
            setIsCompleted(completed);
          } catch (err) { 
            console.error("Error al cargar estado de completado:", err); 
          }
        })();

        (async () => {
          try {
            const assignmentResponse = await axiosInstance.get(`/api/assignments/lesson/${lessonId}/`);
            const loadedAssignment = assignmentResponse.data;
            setAssignment(loadedAssignment);

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
            setLoadingAssignment(false);
          }
        })();
        if (user.role === 'PROFESSOR') {
          (async () => {
            try {
              // ¡Llamamos al NUEVO endpoint!
              const response = await axiosInstance.get(`/api/course/${courseId}/students/`);
              setContacts(response.data); 
            } catch (err) {
              console.error("Error al cargar la lista de alumnos:", err);
            }
          })();
        }
        (async () => {
          try {
            if (lessonId === "2") { 
              setQuiz({ id: 101, title: "Quiz: Variables y Tipos", module_id: 1});
            }
          } catch (err) {
             console.log("Esta lección no tiene quiz.");
          } finally {
            setLoadingQuiz(false);
          }
        })();
        if (user.role === 'PROFESSOR') {
            try {
                const [qRes, cRes] = await Promise.all([
                    axiosInstance.get(`/api/lesson/${lessonId}/live_quizzes/`),
                    axiosInstance.get(`/api/lesson/${lessonId}/live_challenges/`)
                ]);
                setLiveQuizzes(qRes.data);
                setLiveChallenges(cRes.data);
            } catch (err) { console.error("Error cargando actividades", err); }
        }
      } catch (err) {
        console.error("Error al cargar la lección:", err);
        setError("Error al cargar el contenido de la lección.");
        setLoadingAssignment(false);
        setLoadingQuiz(false);
      } finally {
        setLoading(false);
      }
    };
    fetchLessonData();
  }, [lessonId, courseId, navigate,user]);

  // --- Handlers (Funcionales) ---
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

  const handleLaunchQuiz = (quizId) => {
    // Verificamos conexión
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({ 
        message_type: "START_QUIZ", 
        quiz_id: quizId 
      });
      setGameInProgress('quiz'); // Actualizamos estado visual
      setDrawerOpen(false);      // Cerramos el menú automáticamente
      setSnackbarMessage("¡Quiz iniciado!");
      setSnackbarOpen(true);
    } else {
      alert("Error de conexión con el servidor.");
    }
  };

  const handleLaunchChallenge = (challengeId) => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({ 
        message_type: "START_CODE_CHALLENGE", 
        challenge_id: challengeId 
      });
      setGameInProgress('challenge');
      setDrawerOpen(false);
      setSnackbarMessage("¡Desafío iniciado!");
      setSnackbarOpen(true);
    }
  };

  const WS_BASE = 'ws://127.0.0.1:8000'; 

  // Construcción de la URL
  const socketUrl = (authTokens && authTokens.access && lesson) 
    // NOTA LA BARRA '/' ANTES DEL '?' ¡ES CRÍTICA PARA TU REGEX!
    ? `${WS_BASE}/ws/chat/lesson/${lessonId}/?token=${authTokens.access}`
    : null;

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    socketUrl,
    {
      onOpen: () => {
        console.log('🟢 [FRONTEND] Conectado al WebSocket');
        // Opcional: Anunciar presencia si tu Consumer lo espera
        sendJsonMessage({ message_type: 'ANNOUNCE_PRESENCE' });
      },
      onClose: (e) => console.log('🔴 [FRONTEND] Desconectado', e),
      shouldReconnect: (closeEvent) => true,
      retryOnError: true,
    },
    !!socketUrl // Solo conecta si la URL es válida
  );
  useEffect(() => {
    if (lastJsonMessage !== null) {
      
      // --- 1. Lógica de Chat ---
      if (lastJsonMessage.type === 'chat_message') {
        setChatHistory(prev => [...prev, lastJsonMessage.message]);
      } 
      
      // --- 2. Lógica de XP (Gamificación) ---
      else if (lastJsonMessage.type === 'xp_notification') {
        console.log("XP Recibido:", lastJsonMessage);
        setSnackbarMessage(`¡${lastJsonMessage.username} ha ganado ${lastJsonMessage.points} XP!`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        // Actualiza el estado de la mascota si es para mí
        if (lastJsonMessage.user_id === user.id) {
            setCurrentXp(lastJsonMessage.total_xp);
        }
      }
      
      // --- 3. Lógica de "Pregunta de Quiz" (para Alumno y Profesor) ---
      else if (lastJsonMessage.type === 'quiz_question') {
        console.log("¡QUIZ_QUESTION recibido!", lastJsonMessage.data);
            
        // Esta lógica es para TODOS (para que el profesor vea el timer, etc.)
        // 1. Limpia el temporizador y la selección
        if (timerRef.current) clearInterval(timerRef.current);
        setTimerProgress(100);
        setSelectedChoiceId(null);

        const totalTime = lastJsonMessage.data.timer || 15;
        const updatesPerSecond = 10;
        const totalSteps = totalTime * updatesPerSecond;
        const stepPercentage = 100 / totalSteps;

        // 2. Inicia el nuevo temporizador
        timerRef.current = setInterval(() => {
          setTimerProgress(prev => {
            if (prev <= 0) {
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - stepPercentage;
          });
        }, 1000 / updatesPerSecond);

        // 3. Muestra la pregunta (SOLO AL ALUMNO)
        if (user.role !== 'PROFESSOR') {
          setQuizGameState({ view: 'question', data: lastJsonMessage.data });
        }
      }
          
      // --- 4. Lógica de "Resultado de Respuesta" (Solo Alumno) ---
      else if (lastJsonMessage.type === 'answer_result') {
        if (user.role !== 'PROFESSOR') {
          setQuizGameState(prevState => ({
            ...prevState,
            view: lastJsonMessage.data.is_correct ? 'result_correct' : 'result_incorrect'
          }));
        }
      }

      // --- 5. Lógica de "Estadísticas del Quiz" (Ambos) ---
      else if (lastJsonMessage.type === 'quiz_stats_update') {
        console.log("Estadísticas recibidas:", lastJsonMessage.data);
        
        // Para el profesor: Actualiza el gráfico de barras del panel
        if (user.role === 'PROFESSOR') {
          setQuizStats(lastJsonMessage.data.stats);
        }
        // Para el alumno: Muestra la vista de "stats" en el modal
        else {
          setQuizGameState({ view: 'stats', data: lastJsonMessage.data });
        }
      }

      // --- 6. Lógica de "Ranking del Quiz" (Solo Alumno) ---
      else if (lastJsonMessage.type === 'quiz_ranking_update') {
        console.log("Ranking recibido:", lastJsonMessage.data);
        
        // Actualizamos SIEMPRE los datos del gráfico/ranking en segundo plano
        setQuizStats(prev => ({ ...prev, ranking: lastJsonMessage.data.ranking }));

        if (user.role !== 'PROFESSOR') {
          setQuizGameState(prevState => {
            // [CORRECCIÓN CRÍTICA]
            // Si el alumno está viendo su resultado ("Correcto" o "Incorrecto"),
            // IGNORAMOS el cambio de vista automático. 
            // El alumno irá al ranking manualmente con el botón "Ver Ranking" que agregamos antes.
            if (prevState.view === 'result_correct' || prevState.view === 'result_incorrect') {
              return prevState; // No hacemos nada visualmente
            }
            
            // Si estaba esperando (waiting_ia) o ya estaba en el ranking, actualizamos.
            return { view: 'ranking', data: lastJsonMessage.data };
          });
        }
      }

      // --- 7. Lógica de "Prepárate" (Solo Alumno) ---
      else if (lastJsonMessage.type === 'quiz_get_ready') {
        if (user.role !== 'PROFESSOR') {
          setQuizGameState({ view: 'get_ready', data: null });
        }
      }
      
      // --- 8. Lógica de "Resultados Finales" (Solo Alumno) ---
      else if (lastJsonMessage.type === 'quiz_final_results') {
        console.log("Resultados finales recibidos:", lastJsonMessage.data);
        if (timerRef.current) clearInterval(timerRef.current);
        
        setQuizStats(lastJsonMessage.data);
        setGameInProgress(null);
        if (user.role !== 'PROFESSOR') {
          setQuizGameState(prevState => {
            
            // 1. Si el alumno CERRÓ el modal manualmente ('hidden'), 
            // NO se lo volvemos a abrir. Respetamos su decisión.
            if (prevState.view === 'hidden') {
              return prevState; 
            }

            // 2. En cualquier otro caso (esté viendo ranking, correcto, incorrecto, etc.)
            // le mostramos el resumen final.
            return { 
               view: 'game_over_student', 
               data: lastJsonMessage.data 
            };
          });
        }
      }
      else if (lastJsonMessage.type === 'code_challenge_question') {
            console.log("¡DESAFÍO DE CÓDIGO RECIBIDO!", lastJsonMessage.data);
            setCodeSolution(lastJsonMessage.data.challenge.starter_code || "");
            // Inicia el temporizador (similar al quiz)
            if (timerRef.current) clearInterval(timerRef.current);
            setTimerProgress(100);
            
            const totalTime = lastJsonMessage.data.timer || 300;
            const updatesPerSecond = 1; // 1 actualización por segundo
            const totalSteps = totalTime * updatesPerSecond;
            const stepPercentage = 100 / totalSteps;

            timerRef.current = setInterval(() => {
              setTimerProgress(prev => {
                if (prev <= 0) {
                  clearInterval(timerRef.current);
                  return 0;
                }
                return prev - stepPercentage;
              });
            }, 1000 / updatesPerSecond); // Se ejecuta 1 vez por segundo
            
            // Muestra la nueva vista del modal (SOLO AL ALUMNO)
            if (user.role !== 'PROFESSOR') {
              setQuizGameState({ view: 'code_challenge', data: lastJsonMessage.data });
            }
          }
      // --- 9. Lógica de "Usuario se unió" (Sistema de Presencia) ---
      else if (lastJsonMessage.type === 'user_joined') {
        const joinedUser = lastJsonMessage.user; 
        if (joinedUser) {
          console.log(`[DIAGNÓSTICO] user_joined recibido:`, joinedUser);
          setConnectedUserIds(prevIds => {
            const newIds = new Set(prevIds).add(joinedUser.id);
            console.log(`[DIAGNÓSTICO] Nuevo Set de Conectados:`, newIds);
            return newIds;
          });
        }
      }

      // --- 10. Lógica de "Usuario se fue" (Sistema de Presencia) ---
      else if (lastJsonMessage.type === 'user_left') {
        console.log('Usuario desconectado:', lastJsonMessage.user_id);
        setConnectedUserIds(prevIds => {
          const newIds = new Set(prevIds);
          newIds.delete(lastJsonMessage.user_id);
          return newIds;
        });
      }
      
    }
  }, [lastJsonMessage, user.id, user.role]);
  useEffect(() => {
    // Comprueba si el estado del socket es 'OPEN' (1)
    if (readyState === ReadyState.OPEN) {
      console.log('Socket está ABIERTO, anunciando presencia...');
      
      // Ahora que ESTAMOS SEGUROS de que está abierto, enviamos el anuncio
      sendJsonMessage({
        message_type: 'ANNOUNCE_PRESENCE'
      });
    }
  }, [readyState, sendJsonMessage]);
  const handleGiveXp = (targetUserId, points) => {
    console.log(`Dando ${points} XP a ${targetUserId}...`);
    sendJsonMessage({
      message_type: "GIVE_XP",
      target_user_id: targetUserId,
      points: points
    });
  };
  const handleAnswerSubmit = (questionId, choiceId) => {
    if (readyState !== 1 || selectedChoiceId) { 
      return;
    }
    setSelectedChoiceId(choiceId);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    sendJsonMessage({
      message_type: "SUBMIT_ANSWER",
      question_id: questionId, // Pasamos el ID de la pregunta
      choice_id: choiceId
    });
  };
  const handleCodeSubmit = () => {
    if (readyState !== 1 || !quizGameState.data) {
      console.error("Socket no está listo o no hay datos del desafío.");
      return;
    }
    
    // 1. Envía el código al backend
    sendJsonMessage({
      message_type: "SUBMIT_CODE_SOLUTION", // ¡NUEVO TIPO DE MENSAJE!
      challenge_id: quizGameState.data.challenge.id,
      code: codeSolution // Envía el código desde el estado
    });

    // 2. Detén el temporizador del cliente
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // 3. Muestra la vista de "esperando" (¡esta vez es 'waiting_ia'!)
    setQuizGameState(prevState => ({ ...prevState, view: 'waiting_ia' }));
  };
  // --- Lógica para el Panel de Calificaciones (Funcional) ---
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
      due_date: quiz.due_date,
      module_id: quiz.module,
      type: 'quiz'
    });
  }
  const getTaskStatus = (dueDate) => {
    if (!dueDate) {
      return { label: 'Sin fecha límite', color: 'default', icon: <AccessTimeIcon fontSize="small" /> };
    }
    const now = new Date();
    const due = new Date(dueDate);
    if (due < now) {
      return { label: 'Vencido', color: 'error', icon: <ErrorOutlineIcon fontSize="small" /> };
    }
    const threeDays = 1000 * 60 * 60 * 24 * 3;
    if (due.getTime() - now.getTime() < threeDays) {
      return { label: 'Vence pronto', color: 'warning', icon: <AccessTimeIcon fontSize="small" /> };
    }
    return { label: 'A tiempo', color: 'success', icon: <CheckCircleIcon fontSize="small" /> };
  };
  const handleTaskClick = (task) => {
    if (task.type === 'assignment') {
      setMainTabValue(1);
    }
    if (task.type === 'quiz') {
      navigate(`/courses/${courseId}/modules/${task.module_id}/quiz`);
    }
  };

  // --- Vistas de Carga y Error ---
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Alert severity="error">{error}</Alert></Box>;
  }
  if (!lesson) return null;

  const calculateLevel = (xp) => {
      const xpPerLevel = 100; // 100 XP para subir de nivel
      const level = Math.floor(xp / xpPerLevel) + 1;
      const xpInCurrentLevel = xp % xpPerLevel;
      const xpForNextLevel = xpPerLevel;
      const percentage = (xpInCurrentLevel / xpForNextLevel) * 100;
      
      let petEmoji = '🥚'; // Nivel 1+
      if (level >= 5) petEmoji = '🐣'; // Nivel 5+
      if (level >= 10) petEmoji = '🐉'; // Nivel 10+
      
      return {
          level,
          xpInCurrentLevel,
          xpForNextLevel,
          percentage,
          petEmoji
      };
  };
  
  const petData = calculateLevel(currentXp);
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
      <ToolsDrawer 
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        theme={theme}
        user={user}
        contacts={contacts}
        connectedIds={connectedUserIds}
        onGiveXp={handleGiveXp}
        lessonId={lessonId}
        liveQuizzes={liveQuizzes}       // Pasamos la lista
        liveChallenges={liveChallenges} // Pasamos la lista
        onLaunchQuiz={handleLaunchQuiz} // Pasamos la función
        onLaunchChallenge={handleLaunchChallenge} // Pasamos la función
        websocketReadyState={readyState}
      />
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
          {/* 1. Video o Clase en Vivo (¡AHORA FUNCIONAL!) */}
          <motion.div variants={itemVariants}>
            <Paper sx={{...glassPaperStyle(theme), p: 1, overflow: 'hidden' }}>
              
              {/* --- Lógica de Renderizado --- */}
              {lesson.live_session_room ? (
                  
                  // --- VISTA DE CLASE EN VIVO (JITSI) ---
                  <Box
                    sx={{
                      height: '70vh',
                      minHeight: 500,
                      borderRadius: 3,
                      overflow: 'hidden',
                      bgcolor: 'background.default'
                    }}
                  >
                    <JitsiMeeting
                      roomName={lesson.live_session_room}
                      userInfo={{ displayName: user.username }}

                      // --- NIVEL 2: THEME PERSONALIZADO ---
                      configOverwrite={{
                        prejoinPageEnabled: true,
                        startWithAudioMuted: true,
                        startWithVideoMuted: true,
                        analytics: { disabled: true },
                        disableThirdPartyRequests: true,

                        // Fusionar Jitsi con tu theme de MUI
                        defaultLanguage: "es",
                        toolbarConfig: {
                          toolbarButtons: [
                            "microphone", "camera", "desktop", "raisehand",
                            "fullscreen", "tileview", "hangup"
                          ]
                        },
                      }}

                      interfaceConfigOverwrite={{
                        // Evitar cualquier branding o watermark
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_POWERED_BY: false,
                        SHOW_CHROME_EXTENSION_BANNER: false,

                        // Cambiar nombre interno de la plataforma
                        APP_NAME: 'Tu Plataforma',
                        NATIVE_APP_NAME: 'Tu Plataforma',
                        PROVIDER_NAME: 'Tu Marca',

                        // Tema de colores → MUI Theme
                        MAIN_COLOR: theme.palette.primary.main,
                        TOOLBAR_BACKGROUND: theme.palette.background.paper,
                        DEFAULT_BACKGROUND: theme.palette.background.default,

                        // Elimina botones sensibles
                        TOOLBAR_BUTTONS: [
                          'microphone',
                          'camera',
                          'raisehand',
                          'desktop',
                          'fullscreen',
                          'tileview',
                          'hangup'
                        ],
                      }}

                      // --- NIVEL 1: INYECTOR PARA 100% OCULTAR JITSI ---
                      getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = "100%";
                        iframeRef.style.width = "100%";

                        const injectCSS = () => {
                          try {
                            const iframeDoc = iframeRef.contentWindow?.document;
                            if (!iframeDoc || !iframeDoc.head) return false;

                            const style = iframeDoc.createElement("style");
                            style.innerHTML = `
                              /* Ocultar logos / branding */
                              .jitsi-logo,
                              .watermark,
                              .watermark-left,
                              .atlas-logo,
                              a[href*="jitsi"],
                              .branding,
                              .header-logo-container {
                                display: none !important;
                                visibility: hidden !important;
                              }

                              /* Prejoin: textos */
                              .premeeting-screen .title,
                              .premeeting-screen .description {
                                display: none !important;
                              }

                              /* Powered by */
                              .poweredby,
                              .attribution-wrap {
                                display: none !important;
                              }

                              /* Banners */
                              .chrome-extension-banner,
                              .extension-banner,
                              .notice,
                              .notice-warning,
                              .notice-info {
                                display: none !important;
                              }
                            `;

                            iframeDoc.head.appendChild(style);
                            return true; // Inyección exitosa
                          } catch (e) {
                            return false;
                          }
                        };

                        // Intentar cada 300ms hasta que cargue el DOM
                        const interval = setInterval(() => {
                          const success = injectCSS();
                          if (success) {
                            clearInterval(interval);
                            console.log("✔ CSS inyectado en Jitsi");
                          }
                        }, 300);

                        // Failsafe (detener a los 8s para no dejarlo infinito)
                        setTimeout(() => clearInterval(interval), 8000);
                      }}

                    />
                  </Box>

                  
              ) : (
                
                // --- VISTA DE VIDEO PREGRABADO (Normal) ---
                <Box sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', position: 'relative', paddingBottom: '56.25%', height: 0, bgcolor: 'background.default' }}>
                  <iframe
                    src={lesson.video_url} // <-- El video de YouTube/Vimeo
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
                      value={submissionContent}
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
            
            // --- ¡NUEVA VISTA DE PESTAÑAS PARA EL PROFESOR! ---
              <Paper sx={{...glassPaperStyle(theme), height: '100%', p: 0, display: 'flex', flexDirection: 'column'}}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1, flexShrink: 0 }}>
                      <Tabs 
                          // Re-usamos el estado 'sideTabValue'
                          value={sideTabValue}
                          onChange={handleSideTabChange} 
                          variant="fullWidth" 
                      >
                          <Tooltip title="Panel de Control"><Tab icon={<PeopleIcon />} aria-label="Panel" sx={{minWidth: 'auto'}} /></Tooltip>
                          <Tooltip title="Chat de la Lección"><Tab icon={<ChatIcon />} aria-label="Chat" sx={{minWidth: 'auto'}} /></Tooltip>
                      </Tabs>
                  </Box>

                  <Box sx={{ 
                      flex: 1,             
                      overflow: 'hidden',  
                      position: 'relative' 
                  }}>
                      {/* Pestaña 1: El Panel de Control */}
                      <TabPanel value={sideTabValue} index={0} theme={theme} enableScroll={false}>
                          <ProfessorPanel 
                              theme={theme}
                              gameInProgress={gameInProgress}
                              quizStats={quizStats}
                              // Función para terminar cualquier juego (Quiz o Challenge)
                              handleEndGameParent={() => {
                                  if (readyState === ReadyState.OPEN) {
                                      sendJsonMessage({ message_type: "STOP_GAME" });
                                      setGameInProgress(null); 
                            
                                      setSnackbarMessage("Desafío finalizado correctamente");
                                      setSnackbarOpen(true);
                                  }
                              }}
                              // Conectamos el botón del panel con el estado del Drawer
                              onOpenDrawer={() => setDrawerOpen(true)} 
                          />
                      </TabPanel>

                      {/* Pestaña 2: El Chat de la Lección */}
                      <TabPanel value={sideTabValue} index={1} theme={theme} enableScroll={false}>
                          <LessonChat 
                            theme={theme} 
                            lessonId={lesson.id}
                            conversationId={lesson.chat_conversation}
                            user={user}
                            chatHistory={chatHistory}
                            loadingHistory={loadingHistory}
                            setChatHistory={setChatHistory}
                            setLoadingHistory={setLoadingHistory}
                            readyState={readyState}
                            isSending={isSubmitting} // Usamos 'isSubmitting' de la tarea para deshabilitar
                            onSendJsonMessage={sendJsonMessage}
                            isActive={sideTabValue === 1}
                            onNotify={(msg) => { 
                              setSnackbarMessage(msg);
                              setSnackbarSeverity("success");
                              setSnackbarOpen(true);
                            }}
                          />
                      </TabPanel>
                  </Box>
              </Paper>
              // --- FIN DE LA VISTA DEL PROFESOR ---

          ) : (
                // --- VISTA DEL ALUMNO ---
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    height: '100%' 
                }}>
                    
                    {/* NOTA: El 'motion.div' duplicado que estaba aquí
                      ha sido eliminado para evitar el error.
                      El widget de pestañas de abajo ahora es el único
                      lugar que renderiza LessonChat y LessonNotes.
                    */}

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
                                    <Tooltip title="Entregables"><Tab icon={<AssignmentTurnedInIcon />} aria-label="Entregables" sx={{minWidth: 'auto'}} /></Tooltip>
                                    <Tooltip title="Mascota"><Tab icon={<PetsIcon />} aria-label="Mascota" sx={{minWidth: 'auto'}} /></Tooltip>
                                </Tabs>
                            </Box>

                            <Box sx={{ 
                                flex: 1,             
                                overflow: 'hidden',  
                                position: 'relative' 
                            }}>
                                <TabPanel value={sideTabValue} index={0} theme={theme} enableScroll={false}>
                                    {/* ¡¡¡CHAT AHORA ES FUNCIONAL Y CORREGIDO!!! */}
                                    <LessonChat 
                                      theme={theme} 
                                      lessonId={lesson.id}
                                      conversationId={lesson.chat_conversation}
                                      // --- Props requeridos añadidos ---
                                      user={user}
                                      chatHistory={chatHistory}
                                      loadingHistory={loadingHistory}
                                      setChatHistory={setChatHistory}
                                      setLoadingHistory={setLoadingHistory}
                                      readyState={readyState}
                                      isSending={isSubmitting}
                                      onSendJsonMessage={sendJsonMessage}
                                      isActive={sideTabValue === 0}
                                      // --- Fin de props añadidos ---
                                      onNotify={(msg) => { 
                                        setSnackbarMessage(msg);
                                        setSnackbarSeverity("success");
                                        setSnackbarOpen(true);
                                      }}
                                    />
                                </TabPanel>
                                <TabPanel value={sideTabValue} index={1} theme={theme} enableScroll={false}>
                                    {/* ¡NOTAS ES FUNCIONAL! */}
                                    <LessonNotes theme={theme} lessonId={lesson.id} />
                                </TabPanel>
                                <TabPanel value={sideTabValue} index={2} theme={theme} enableScroll={false}>
                                    {/* ¡RECURSOS ES REAL! */}
                                    <List sx={{p: 2}}>
                                    {lesson.resources && lesson.resources.length > 0 ? (
                                      lesson.resources?.map(resource => (
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
                                <TabPanel value={sideTabValue} index={3} theme={theme} enableScroll={false}>
                                    {/* ¡ENTREGABLES ES REAL! */}
                                    <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100%'}}>
                                      <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, p: 2, pb: 1 }}>
                                          Tareas Pendientes (Lección)
                                        </Typography>
                                        {(loadingAssignment || loadingQuiz) && (
                                          <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
                                        )}
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
                                              <Typography sx={{p: 2, textAlign: 'center', color: 'text.secondary'}}>
                                                ¡Estás al día con esta lección!
                                              </Typography>
                                            )}
                                          </List>
                                        )}
                                      </Box>
                                      <Box sx={{ flexShrink: 0 }}>
                                        <Divider sx={{m: 2}} />
                                        <Box sx={{px: 2, pb: 2}}>
                                          <Button 
                                            variant="outlined" 
                                            fullWidth
                                            component={RouterLink}
                                            to={`/courses/${courseId}/grades`}
                                            startIcon={<GradeIcon />}
                                          >
                                            Ver Libro de Calificaciones
                                          </Button>
                                        </Box>
                                      </Box>
                                    </Box>
                                </TabPanel>
                                {/* --- ¡REEMPLAZA ESTE BLOQUE ENTERO! --- */}
                                <TabPanel value={sideTabValue} index={4} theme={theme}>
                                  <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    p: 3,
                                    gap: 2
                                  }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                      Tu Mascota
                                    </Typography>
                                    
                                    {/* Avatar de la Mascota (Funcional) */}
                                    <Avatar sx={{ width: 120, height: 120, fontSize: '4rem', bgcolor: 'grey.700' }}>
                                      {petData.petEmoji}
                                    </Avatar>
                                    
                                    {/* Barra de XP (Funcional) */}
                                    <Box sx={{ width: '100%' }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          Nivel {petData.level}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {petData.xpInCurrentLevel} / {petData.xpForNextLevel} XP
                                        </Typography>
                                      </Box>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={petData.percentage} // <-- Conectado
                                        sx={{ height: 10, borderRadius: 5 }} 
                                      />
                                    </Box>

                                    {/* Botón de Acceso (Maqueta) */}
                                    <Button 
                                      variant="contained" 
                                      fullWidth 
                                      sx={{mt: 2}}
                                      // onClick={() => navigate('/pet-inventory')} // (Para el futuro)
                                    >
                                      Ver y Editar Mascota
                                    </Button>
                                  </Box>
                                </TabPanel>
                                <TabPanel value={sideTabValue} index={5} theme={theme} enableScroll={false}>
                                <CodeChallengePanel 
                                  theme={theme}
                                  lessonId={lesson.id}
                                  onNotify={(msg, severity) => { 
                                    setSnackbarMessage(msg);
                                    setSnackbarSeverity(severity || "success");
                                    setSnackbarOpen(true);
                                  }}
                                  // Pasa la función para actualizar el XP de la mascota
                                  onXpEarned={(newTotalXp) => setCurrentXp(newTotalXp)}
                                />
                                </TabPanel>
                                {/* --- FIN DEL REEMPLAZO --- */}
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
      {/* --- ¡REEMPLAZA TU MODAL CON ESTE CÓDIGO (VERSIÓN ANIDADA CORRECTA)! --- */}
      <Modal
        open={quizGameState.view !== 'hidden'}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Paper sx={{ p: 4, width: '90%', maxWidth: 500, outline: 'none', textAlign: 'center' }}>

          {/* === VISTA 1: PREGUNTA (CÓDIGO CORREGIDO) === */}
          {quizGameState.view === 'question' && quizGameState.data && (
            <>
              {/* --- Barra Regresiva --- */}
              <LinearProgress 
                variant="determinate" 
                value={timerProgress} 
                sx={{ height: 10, borderRadius: 5, mb: 2, transition: 'transform 0.1s linear' }} 
              />
              
              <Typography variant="h5" color="primary" gutterBottom>
                {/* ¡CORREGIDO! Lee 'data.question_number' */}
                ¡Desafío Rápido! ({quizGameState.data.question_number}/{quizGameState.data.total_questions})
              </Typography>
              <Typography variant="h6" sx={{ my: 2, fontWeight: 600 }}>
                {/* ¡CORREGIDO! Lee 'data.question.text' */}
                {quizGameState.data.question.text}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 3 }}>
                {/* ¡CORREGIDO! Lee 'data.question.choices' */}
                {quizGameState.data.question.choices.map(choice => (
                  <Button
                    key={choice.id}
                    variant={selectedChoiceId === choice.id ? 'contained' : 'outlined'}
                    disabled={selectedChoiceId !== null} 
                    // ¡CORREGIDO! Lee 'data.question.id'
                    onClick={() => handleAnswerSubmit(quizGameState.data.question.id, choice.id)}
                    sx={{ justifyContent: 'flex-start', p: 1.5 }}
                  >
                    {choice.text}
                  </Button>
                ))}
              </Box>
            </>
          )}
          
          {(quizGameState.view === 'result_correct') && (
            <Box>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>¡Correcto!</Typography>
              <Typography color="text.secondary">¡Buen trabajo! Has ganado puntos.</Typography>
              
              {/* --- ¡BOTÓN AÑADIDO (TU IDEA)! --- */}
              <Button 
                variant="contained" 
                fullWidth 
                sx={{ mt: 3 }}
                onClick={() => setQuizGameState({ view: 'ranking', data: null })}
              >
                Ver Ranking en Vivo
              </Button>
            </Box>
          )}
          
          {/* === VISTA 3: FEEDBACK INCORRECTO (¡CON BOTÓN!) === */}
          {(quizGameState.view === 'result_incorrect') && (
            <Box>
              <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>¡Incorrecto!</Typography>
              <Typography color="text.secondary">¡No te rindas! Sigue intentando o revisa el ranking.</Typography>
              
              {/* --- ¡BOTÓN AÑADIDO (TU IDEA)! --- */}
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mt: 3 }}
                onClick={() => setQuizGameState({ view: 'ranking', data: null })}
              >
                Ver Ranking en Vivo
              </Button>
            </Box>
          )}

          {/* === VISTA 4: GRÁFICO DE BARRAS (STATS) === */}
          {quizGameState.view === 'stats' && quizGameState.data && (
             <Box>
              <Typography variant="h5" color="primary" gutterBottom>Resultados de la Pregunta</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total de respuestas: {quizGameState.data.stats.total}
              </Typography>
              {/* (Aquí iría el gráfico de barras) */}
            </Box>
          )}
          
          {(quizGameState.view === 'ranking' || quizGameState.view === 'final_results') && (
            <Box>
              <Typography variant="h5" color={quizGameState.view === 'final_results' ? "success.main" : "primary"} gutterBottom>
                {quizGameState.view === 'final_results' ? "¡Resultados Finales!" : "Ranking en Vivo"}
              </Typography>
              
              <List dense sx={{ mt: 2, textAlign: 'left', maxHeight: 300, overflowY: 'auto' }}>
                {/* Usamos 'quizStats' (que se actualiza en vivo) en lugar de 'quizGameState.data' */}
                {(!quizStats || !quizStats.ranking || quizStats.ranking.length === 0) && (
                  <Typography color="text.secondary" sx={{textAlign: 'center', p: 2}}>
                    Aún no hay nadie en el ranking.
                  </Typography>
                )}
                
                {quizStats && quizStats.ranking && quizStats.ranking.map((player, index) => (
                  <ListItem key={index} sx={{ bgcolor: index < 3 ? 'action.hover' : 'transparent', borderRadius: 1, mb: 0.5 }}>
                    <ListItemIcon sx={{fontSize: '1.5rem'}}>
                      {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} {index > 2 && `${index + 1}.`}
                    </ListItemIcon>
                    <ListItemText primary={player.username} sx={{ fontWeight: 600 }} />
                    <Typography variant="h6" color="primary">{player.score} pts</Typography>
                  </ListItem>
                ))}
              </List>
              
              {/* --- ¡BOTÓN AÑADIDO/MODIFICADO! --- */}
              <Button 
                variant={quizGameState.view === 'final_results' ? "contained" : "outlined"} 
                fullWidth 
                sx={{ mt: 3 }}
                onClick={() => setQuizGameState({ view: 'hidden', data: null })}
              >
                Cerrar
              </Button>
            </Box>
          )}
          
          {/* === VISTA 6: PREPÁRATE === */}
          {quizGameState.view === 'get_ready' && (
            <Box>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>¡Prepárate!</Typography>
              <Typography color="text.secondary">La siguiente pregunta está por comenzar...</Typography>
            </Box>
          )}
          {/* === VISTA 7: DESAFÍO DE CÓDIGO (¡CON BOTÓN DE CERRAR!) === */}
          {quizGameState.view === 'code_challenge' && quizGameState.data && (
            <Box sx={{ textAlign: 'left' }}>
              <LinearProgress variant="determinate" value={timerProgress} color="secondary" sx={{ height: 10, borderRadius: 5, mb: 2 }} />
              <Typography variant="h5" color="secondary" gutterBottom>¡Desafío de Código en Vivo!</Typography>
              <Typography variant="h6" sx={{ my: 2, fontWeight: 600 }}>
                {quizGameState.data.challenge.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto' }}>
                {quizGameState.data.challenge.description}
              </Typography>
              
              <Box sx={{ mb: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, overflow: 'hidden', fontSize: '0.9rem' }}>
                <CodeMirror
                  value={codeSolution}
                  height="250px"
                  theme={vscodeDark}
                  extensions={[python()]}
                  onChange={(value) => setCodeSolution(value)}
                />
              </Box>
              
              <Button variant="contained" color="secondary" fullWidth onClick={handleCodeSubmit}>
                Enviar Solución
              </Button>
            </Box>
          )}
          {quizGameState.view === 'game_over_student' && (
            <Box>
              <Typography variant="h4" sx={{ mb: 2 }}>🏁</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Desafío Finalizado
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                El profesor ha terminado la sesión.
              </Typography>
              
              {/* Muestra el puesto del alumno si está en el ranking */}
              {(() => {
                 const myRank = quizGameState.data.ranking.findIndex(p => p.username === user.username);
                 if (myRank !== -1) {
                   return (
                     <Alert severity="success" sx={{ mb: 2 }}>
                       ¡Quedaste en el puesto #{myRank + 1} con {quizGameState.data.ranking[myRank].score} puntos!
                     </Alert>
                   )
                 }
                 return <Alert severity="info">¡Buen intento! Sigue practicando.</Alert>
              })()}

              <Button 
                variant="contained" 
                fullWidth 
                onClick={() => setQuizGameState({ view: 'hidden', data: null })}
              >
                Cerrar
              </Button>
            </Box>
          )}
          {/* --- ¡NUEVA VISTA DE ESPERA DE IA! --- */}
          {(quizGameState.view === 'waiting_ia') && (
            <Box>
              <CircularProgress color="secondary" sx={{ mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>Evaluando tu código...</Typography>
              <Typography color="text.secondary">La IA está revisando tu solución. ¡Un momento!</Typography>
            </Box>
          )}
        </Paper>
      </Modal>

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