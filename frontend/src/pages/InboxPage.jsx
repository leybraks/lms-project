// InboxPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useWebSocket from 'react-use-websocket';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Modal,
  Fade,
  Backdrop,
  InputAdornment,
  Snackbar,
  Tooltip,
  Chip,
  CardMedia,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';

// --- Iconos ---
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// --- Resaltado de código ---
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// === VARIANTES Y ESTILOS (Sin cambios) ===
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delayChildren: 0.2, staggerChildren: 0.15 } }
};
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { ease: "easeOut" } }
};
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
const getScrollbarStyles = (theme) => ({
  scrollbarWidth: 'thin',
  scrollbarColor: `${theme.palette.primary.main} ${theme.palette.background.paper}`,
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent', borderRadius: '10px' },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: '10px',
    border: `1px solid ${theme.palette.background.default}`,
    backgroundClip: 'content-box',
  },
  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: theme.palette.primary.dark }
});
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', md: 500 },
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column'
};
// === FIN ESTILOS ===

// --- Helpers (Sin cambios) ---
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'ahora';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
// --- FIN HELPERS ---


function InboxPage() {
  const theme = useTheme();
  const { user, authTokens } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Estados ---
  const [groupChats, setGroupChats] = useState([]);
  const [dmChats, setDmChats] = useState([]);
  const [filteredLessonChats, setFilteredLessonChats] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Estados de Filtros
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedModule, setSelectedModule] = useState('');

  // Estados del Chat Activo
  const [messages, setMessages] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  
  // --- ¡NUEVOS ESTADOS! ---
  const [readReceipts, setReadReceipts] = useState([]); // Para "Visto por..."
  const [typingUsers, setTypingUsers] = useState({}); // Para "Está escribiendo..."
  // --- FIN NUEVOS ESTADOS ---

  // Estados de Inputs
  const [tabValue, setTabValue] = useState(0);
  const [codeLang, setCodeLang] = useState('python');
  const [textContent, setTextContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);

  // Estados de UI
  const [modalOpen, setModalOpen] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [tick, setTick] = useState(0);

  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  // Refs para Debouncing
  const markReadTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null); // <-- ¡NUEVO!

  // --- Lógica de WebSocket ---
  // --- CAMBIO: URL DE PRODUCCIÓN (RAILWAY) ---
  const socketUrl = selectedConvo && authTokens
    ? `wss://lms-project-production-39d6.up.railway.app/ws/chat/conversation/${selectedConvo.id}/?token=${authTokens?.access}`
    : null;

  const { lastJsonMessage, sendJsonMessage } = useWebSocket( // <-- ¡Obtenemos sendJsonMessage!
    socketUrl,
    {
      onOpen: () => console.log('WebSocket (Inbox) conectado'),
      onClose: (e) => console.log('WebSocket (Inbox) desconectado:', e?.reason),
      onError: (e) => console.error('WebSocket (Inbox) error:', e),
      shouldReconnect: (closeEvent) => true,
    },
    !!socketUrl
  );

  // ==========================
  // === useEffects / Data ===
  // ==========================

  // 1. Cargar datos del Sidebar (Grupos, DMs, Contactos y Cursos)
  // (Sin cambios)
  useEffect(() => {
    let mounted = true;
    const fetchSidebarData = async () => {
      try {
        setLoadingSidebar(true);
        setError(null);
        const [
          groupsResponse,
          dmsResponse,
          contactsResponse,
          coursesResponse
        ] = await Promise.all([
          axiosInstance.get('/api/inbox/group_chats/'),
          axiosInstance.get('/api/inbox/dm_chats/'),
          axiosInstance.get('/api/inbox/contacts/'),
          axiosInstance.get('/api/courses/all/')
        ]);
        if (!mounted) return;
        const groups = groupsResponse.data || [];
        const dms = dmsResponse.data || [];
        const safeSort = (arr) => arr.slice().sort((a, b) => {
          const ta = a.last_message_timestamp ? new Date(a.last_message_timestamp).getTime() : 0;
          const tb = b.last_message_timestamp ? new Date(b.last_message_timestamp).getTime() : 0;
          return tb - ta;
        });
        setGroupChats(safeSort(groups));
        setDmChats(safeSort(dms));
        setContacts(contactsResponse.data || []);
        setCourses(coursesResponse.data || []);
        const lastConvoId = localStorage.getItem('lastSelectedConvoId');
        let convoToSet = null;
        if (lastConvoId) {
          const allUserConvos = [...groups, ...dms];
          const found = allUserConvos.find(c => String(c.id) === String(lastConvoId));
          if (found) convoToSet = found;
          else localStorage.removeItem('lastSelectedConvoId');
        }
        if (!convoToSet) {
          if (groups.length > 0) convoToSet = groups[0];
          else if (dms.length > 0) convoToSet = dms[0];
        }
        if (convoToSet) {
          setSelectedConvo(convoToSet);
        }
      } catch (err) {
        console.error("Error al cargar datos del sidebar:", err);
        if (mounted) setError("No se pudieron cargar tus chats.");
      } finally {
        if (mounted) setLoadingSidebar(false);
      }
    };
    fetchSidebarData();
    return () => { mounted = false; };
  }, []);

  // 2. Cargar mensajes Y "Visto por..."
  // (¡ACTUALIZADO!)
  useEffect(() => {
    if (!selectedConvo) {
      setMessages([]);
      setReadReceipts([]);
      setNextPageUrl(null); // <-- ¡Limpiar la URL de pág. anterior!
      return;
    }

    let mounted = true;
    const fetchMessagesAndReceipts = async () => {
      try {
        setError(null);
        setLoadingMessages(true);
        
        const [messagesResponse, receiptsResponse] = await Promise.all([
          // Esta URL ahora devuelve la Página 1 (los 30 más nuevos)
          axiosInstance.get(`/api/inbox/conversations/${selectedConvo.id}/messages/`), 
          axiosInstance.get(`/api/inbox/conversations/${selectedConvo.id}/read_receipts/`) 
        ]);

        if (!mounted) return;

        // --- ¡INICIO DE LA CORRECCIÓN! ---
        // 1. Los mensajes ahora están en 'results' y vienen en orden [nuevo...viejo]
        // 2. Los invertimos para que se muestren [viejo...nuevo]
        const msgs = (messagesResponse.data.results || []).reverse();
        setMessages(msgs);
        
        // 3. Guardamos la URL para la siguiente página (los más antiguos)
        setNextPageUrl(messagesResponse.data.next); 
        // --- FIN DE LA CORRECCIÓN! ---

        setReadReceipts(receiptsResponse.data || []); 

        // Marcar como leído (sin cambios)
        if (markReadTimeoutRef.current) clearTimeout(markReadTimeoutRef.current);
        markReadTimeoutRef.current = setTimeout(() => {
          axiosInstance.post(`/api/inbox/conversations/${selectedConvo.id}/mark_as_read/`)
            .catch(e => console.error('Error mark_as_read:', e));
        }, 300);

        // Reset unread_count (sin cambios)
        const updateCount = (chats) => chats.map(chat =>
          chat.id === selectedConvo.id ? { ...chat, unread_count: 0 } : chat
        );
        setGroupChats(prev => updateCount(prev));
        setDmChats(prev => updateCount(prev));
        setFilteredLessonChats(prev => updateCount(prev));

      } catch (err) {
        console.error("Error al cargar mensajes o recibos:", err);
        if (mounted) setError("No se pudieron cargar los mensajes.");
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    };

    setMessages([]); // Limpia mensajes anteriores
    fetchMessagesAndReceipts();

    return () => {
      mounted = false;
    };
  }, [selectedConvo]);

  // 3. Escuchar WebSocket (Mensajes Y "Typing")
  // (¡ACTUALIZADO!)
  useEffect(() => {
    if (!lastJsonMessage || !user) return;

    // --- ¡MODIFICACIÓN! ---
    // El mensaje puede ser un chat o un evento de typing
    
    if (lastJsonMessage.type === 'chat_message') {
      // --- Lógica de CHAT MESSAGE (la que ya tenías) ---
      const incoming = lastJsonMessage.message;
      if (!incoming) return;

      setMessages(prevMessages => {
        if (prevMessages.some(m => String(m.id) === String(incoming.id))) return prevMessages;
        const merged = [...prevMessages, incoming].slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return merged;
      });
      
      if (
        incoming.conversation === selectedConvo?.id &&
        incoming.sender.username !== user.username
      ) {
        if (markReadTimeoutRef.current) clearTimeout(markReadTimeoutRef.current);
        markReadTimeoutRef.current = setTimeout(() => {
          axiosInstance.post(`/api/inbox/conversations/${selectedConvo.id}/mark_as_read/`)
            .catch(e => console.error('Error mark_as_read (ws):', e));
        }, 250);
      }
      
      let snippet = incoming.content;
      if (!snippet) {
        if (incoming.message_type === 'CODE') snippet = 'Código compartido';
        else if (incoming.message_type === 'IMAGE') snippet = 'Imagen';
        else if (incoming.message_type === 'FILE') snippet = incoming.file_name || 'Archivo';
      }
      
      const convoId = incoming.conversation;
      const updateChatInList = (chat) => {
        if (chat.id !== convoId) return chat;
        let newUnread = chat.unread_count || 0;
        if (chat.id === selectedConvo?.id) {
          newUnread = 0;
        } else {
          if (incoming.sender?.username !== user.username) {
            newUnread = (chat.unread_count || 0) + 1;
          }
        }
        return {
          ...chat,
          unread_count: newUnread,
          last_message_snippet: snippet,
          last_message_timestamp: incoming.timestamp
        };
      };

      const reorder = (arr) => arr
        .map(updateChatInList)
        .slice()
        .sort((a, b) => {
          const ta = a.last_message_timestamp ? new Date(a.last_message_timestamp).getTime() : 0;
          const tb = b.last_message_timestamp ? new Date(b.last_message_timestamp).getTime() : 0;
          return tb - ta;
        });

      setGroupChats(prev => reorder(prev));
      setDmChats(prev => reorder(prev));
      setFilteredLessonChats(prev => reorder(prev));

    } else if (lastJsonMessage.type === 'typing_event') {
      // --- ¡NUEVA LÓGICA! ---
      // Es un evento de "está escribiendo"
      const incoming = lastJsonMessage;
      
      // No actualices si soy yo el que escribe
      if (incoming.user === user.username) return;

      setTypingUsers(prev => ({
        ...prev,
        [incoming.user]: incoming.is_typing
      }));
    }
    // --- FIN DE LA MODIFICACIÓN ---

  }, [lastJsonMessage, selectedConvo, user]);

  // 4. Guardar la última conversación en localStorage (sin cambios)
  useEffect(() => {
    if (selectedConvo) {
      try {
        localStorage.setItem('lastSelectedConvoId', String(selectedConvo.id));
      } catch (e) {
        console.error('No se pudo guardar lastSelectedConvoId:', e);
      }
    }
  }, [selectedConvo]);

  // 5. Scroll al fondo del chat (sin cambios)
  useEffect(() => {
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 80);
    return () => clearTimeout(t);
  }, [messages]);

  // 6. Cargar Módulos (sin cambios)
  useEffect(() => {
    if (selectedCourse) {
      setSelectedModule('');
      let mounted = true;
      const fetchModules = async () => {
        try {
          const response = await axiosInstance.get(`/api/courses/${selectedCourse}/`);
          if (!mounted) return;
          setModules(response.data.modules || []);
        } catch (err) {
          console.error("Error al cargar módulos:", err);
          if (mounted) setModules([]);
        }
      };
      fetchModules();
      return () => { mounted = false; };
    } else {
      setModules([]);
    }
  }, [selectedCourse]);

  // 7. Filtrar chats de lección (sin cambios)
  useEffect(() => {
    let mounted = true;
    const fetchLessonChats = async () => {
      const params = {};
      if (selectedCourse) params.course_id = selectedCourse;
      if (selectedModule) params.module_id = selectedModule;
      try {
        const response = await axiosInstance.get('/api/inbox/lesson_chats/', { params });
        if (!mounted) return;
        const sorted = (response.data || []).slice().sort((a, b) => {
          const ta = a.last_message_timestamp ? new Date(a.last_message_timestamp).getTime() : 0;
          const tb = b.last_message_timestamp ? new Date(b.last_message_timestamp).getTime() : 0;
          return tb - ta;
        });
        setFilteredLessonChats(sorted);
      } catch (err) {
        console.error("Error al filtrar chats de lección:", err);
      }
    };
    fetchLessonChats();
    return () => { mounted = false; };
  }, [selectedCourse, selectedModule]);

  // 8. Actualizar tick (sin cambios)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60 * 1000); // cada 1 minuto
    return () => clearInterval(interval);
  }, []);

  // 9. --- ¡NUEVO! Limpia los "typing" que se queden colgados
  useEffect(() => {
    const users = Object.keys(typingUsers);
    if (users.length === 0) return;

    const timer = setTimeout(() => {
      setTypingUsers(prev => {
        const newTypingUsers = { ...prev };
        users.forEach(username => {
          if (newTypingUsers[username]) {
            // Si ha pasado 3s, asumimos que paró
            newTypingUsers[username] = false; 
          }
        });
        return newTypingUsers;
      });
    }, 3000); // Límite de 3 segundos

    return () => clearTimeout(timer);
  }, [typingUsers]);

  // ==========================
  // === Handlers y UI ===
  // ==========================

  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedConvo) return;
    const isCode = tabValue === 1;
    const content = isCode ? codeContent : textContent;
    if (content.trim() === "" && !fileToUpload) return;
    setIsSending(true);
    const formData = new FormData();
    let messageType = 'TEXT';
    if (fileToUpload) {
      formData.append('file_upload', fileToUpload);
      const type = fileToUpload.type || '';
      messageType = type.startsWith('image/') ? 'IMAGE' : 'FILE';
    }
    if (content.trim() !== "") {
      formData.append('content', content);
      if (!fileToUpload) messageType = isCode ? 'CODE' : 'TEXT';
      if (isCode) formData.append('language', codeLang);
    }
    formData.append('message_type', messageType);
    try {
      await axiosInstance.post(
        `/api/inbox/conversations/${selectedConvo.id}/messages/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setTextContent("");
      setCodeContent("");
      setFileToUpload(null);
      if (fileInputRef.current) {
        try { fileInputRef.current.value = null; } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      setSnackbarMessage("Error al enviar el mensaje.");
      setSnackbarOpen(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenModal = async () => {
    setModalOpen(true);
    setFilteredContacts(contacts);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSearchQuery("");
  };
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query === "") setFilteredContacts(contacts);
    else {
      setFilteredContacts(
        contacts.filter(contact =>
          (contact.username || '').toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  };
  const handleStartConversation = async (contactId) => {
    try {
      const response = await axiosInstance.post('/api/inbox/start_dm/', { user_id: contactId });
      const newOrExistingConvo = response.data;
      setDmChats(prev => {
        if (prev.some(chat => String(chat.id) === String(newOrExistingConvo.id))) {
          return prev;
        }
        const next = [newOrExistingConvo, ...prev];
        return next.slice().sort((a, b) => {
          const ta = a.last_message_timestamp ? new Date(a.last_message_timestamp).getTime() : 0;
          const tb = b.last_message_timestamp ? new Date(b.last_message_timestamp).getTime() : 0;
          return tb - ta;
        });
      });
      setSelectedConvo(newOrExistingConvo);
      handleCloseModal();
    } catch (err) {
      console.error("Error al iniciar conversación:", err);
      setSnackbarMessage("No se pudo iniciar la conversación.");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };
  const handleFileButtonClick = () => fileInputRef.current?.click();
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) setFileToUpload(e.target.files[0]);
  };
  const handleRemoveFile = () => {
    setFileToUpload(null);
    if (fileInputRef.current) {
      try { fileInputRef.current.value = null; } catch (e) {}
    }
  };

  const handleCourseFilterChange = (e) => setSelectedCourse(e.target.value);
  const handleModuleFilterChange = (e) => setSelectedModule(e.target.value);
  const handleLoadMoreMessages = async () => {
    if (!nextPageUrl || loadingMoreMessages) return; // No hacer nada si ya está cargando o no hay más

    setLoadingMoreMessages(true);
    try {
      const response = await axiosInstance.get(nextPageUrl); // Llama a la URL de la pág. 2
      
      // Los nuevos mensajes (más antiguos) también deben invertirse
      const newOldMessages = (response.data.results || []).reverse();

      // ¡Añade los mensajes antiguos AL PRINCIPIO del array!
      setMessages(prevMessages => [...newOldMessages, ...prevMessages]);

      // Actualiza la URL para la pág. 3
      setNextPageUrl(response.data.next);
      
    } catch (err) {
      console.error("Error al cargar más mensajes:", err);
      setSnackbarMessage("Error al cargar mensajes anteriores.");
      setSnackbarOpen(true);
    } finally {
      setLoadingMoreMessages(false);
    }
  };
  // --- ¡NUEVO HANDLER! ---
  // Envía el evento de "typing" al WebSocket (con debounce)
  const handleOnTyping = useCallback(() => {
    
    // --- ¡INICIO DE LA CORRECCIÓN! ---
    // Si sendJsonMessage no está listo o la conexión no está activa, no hagas nada.
    if (!sendJsonMessage) {
      return; 
    }
    // --- FIN DE LA CORRECCIÓN! ---

    // 1. Envía "está escribiendo"
    try {
      sendJsonMessage({
        type: 'typing',
        is_typing: true
      });
    } catch (e) {
      console.warn("WS no está listo para 'typing':", e);
    }

    // 2. Cancela el "stop typing" anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 3. Programa un "stop typing" para dentro de 2 segundos
    typingTimeoutRef.current = setTimeout(() => {
      try {
        sendJsonMessage({
          type: 'typing',
          is_typing: false
        });
      } catch (e) {
        // Ignora el error si el socket se cerró mientras tanto
      }
    }, 2000);
  }, [sendJsonMessage]);


  // --- Componentes de mensaje (Sin cambios) ---
  const CodeShareBlock = ({ sender, code, language, time, isStartOfGroup }) => {
    const isMe = sender?.username === user?.username;
    const handleCopyCode = () => {
      navigator.clipboard.writeText(code).then(() => {
        setSnackbarMessage("¡Código copiado al portapapeles!");
        setSnackbarOpen(true);
      }, (err) => {
        console.error('Error al copiar: ', err);
        setSnackbarMessage("Error al copiar el código.");
        setSnackbarOpen(true);
      });
    };
    const handleDownloadCode = () => {
      let ext = 'txt';
      if (language === 'python') ext = 'py';
      if (language === 'javascript') ext = 'js';
      if (language === 'html') ext = 'html';
      if (language === 'css') ext = 'css';
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snippet.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <Box sx={{ display: 'flex', gap: 1.5, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', alignItems: 'flex-start', mt: isStartOfGroup ? 2 : 0.25 }}>
        {!isMe && (
          <Avatar
            src={sender?.profile_image || undefined}
            sx={{ bgcolor: 'primary.main', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}
          >
            {sender?.username ? sender.username[0] : '?'}
          </Avatar>
        )}
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, width: '100%' }}>
          {isStartOfGroup && !isMe && (
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', px: 2, pt: 1.5 }}>
              {sender?.username}
            </Typography>
          )}
          <Box sx={{ p: '8px 16px', bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{language}</Typography>
            <Box>
              <IconButton size="small" title="Copiar código" onClick={handleCopyCode}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" title="Descargar archivo" onClick={handleDownloadCode}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <SyntaxHighlighter language={language} style={atomDark} customStyle={{ margin: 0, padding: '16px', fontSize: '0.9rem' }} wrapLongLines={true}>
            {String(code || '').trim()}
          </SyntaxHighlighter>
          <Divider />
          <Typography variant="caption" sx={{ p: '4px 12px', display: 'block', textAlign: 'right', opacity: 0.7, bgcolor: 'background.paper' }}>
            {new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
        {isMe && (
          <Avatar
            src={user?.profile_image || undefined}
            sx={{ bgcolor: '#888', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}
          >
            {user?.username ? user.username[0] : '?'}
          </Avatar>
        )}
      </Box>
    );
  };
  const TextBlock = ({ sender, text, time, isStartOfGroup }) => {
    const isMe = sender?.username === user?.username;
    return (
      <Box sx={{ display: 'flex', gap: 1.5, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', alignItems: 'flex-start', mt: isStartOfGroup ? 2 : 0.25 }}>
        {!isMe && (
          <Avatar
            src={sender?.profile_image || undefined}
            sx={{ bgcolor: 'primary.main', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}
          >
            {sender?.username ? sender.username[0] : '?'}
          </Avatar>
        )}
        <Paper
          sx={{
            p: 1.5,
            borderRadius: 4,
            bgcolor: isMe ? 'primary.main' : 'background.paper',
            color: isMe ? 'primary.contrastText' : 'text.primary',
          }}
        >
          {isStartOfGroup && !isMe && (
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
              {sender?.username}
            </Typography>
          )}
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7, mt: 0.5 }}>
            {new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
        {isMe && (
          <Avatar
            src={user?.profile_image || undefined}
            sx={{ bgcolor: '#888', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}
          >
            {user?.username ? user.username[0] : '?'}
          </Avatar>
        )}
      </Box>
    );
  };
  const ImageBlock = ({ sender, text, fileUrl, time, isStartOfGroup }) => {
    const isMe = sender?.username === user?.username;
    return (
      <Box sx={{ display: 'flex', gap: 1.5, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: { xs: '80%', sm: 400 }, alignItems: 'flex-start', mt: isStartOfGroup ? 2 : 0.25 }}>
        {!isMe && (
          <Avatar
            src={sender?.profile_image || undefined}
            sx={{ bgcolor: 'primary.main', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}
          >
            {sender?.username ? sender.username[0] : '?'}
          </Avatar>
        )}
        <Paper
          sx={{
            bgcolor: isMe ? 'primary.main' : 'background.paper',
            borderRadius: 4,
            overflow: 'hidden',
            width: '100%'
          }}
        >
          {isStartOfGroup && !isMe && (
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', p: 1.5, pb: 0 }}>
              {sender?.username}
            </Typography>
          )}
          <CardMedia
            component="img"
            src={fileUrl}
            alt="Adjunto"
            sx={{ width: '100%', display: 'block', cursor: 'pointer', p: 0.5 }}
            onClick={() => window.open(fileUrl, '_blank')}
          />
          {text && (
            <Typography variant="body1" sx={{ p: 1.5, pt: 1, color: isMe ? 'primary.contrastText' : 'text.primary' }}>
              {text}
            </Typography>
          )}
          <Typography variant="caption" sx={{ p: '4px 12px', display: 'block', textAlign: 'right', opacity: 0.7, color: isMe ? 'primary.contrastText' : 'text.secondary' }}>
            {new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
        {isMe && (
          <Avatar
            src={user?.profile_image || undefined}
            sx={{ bgcolor: '#888', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}
          >
            {user?.username ? user.username[0] : '?'}
          </Avatar>
        )}
      </Box>
    );
  };
  const FileBlock = ({ sender, text, fileUrl, fileName, fileSize, time, isStartOfGroup }) => {
    const isMe = sender?.username === user?.username;
    return (
      <Box sx={{ display: 'flex', gap: 1.5, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: { xs: '80%', sm: 350 }, alignItems: 'flex-start', mt: isStartOfGroup ? 2 : 0.25 }}>
        {!isMe && (
          <Avatar
            src={sender?.profile_image || undefined}
            sx={{ bgcolor: 'primary.main', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}
          >
            {sender?.username ? sender.username[0] : '?'}
          </Avatar>
        )}
        <Paper
          sx={{
            borderRadius: 4,
            bgcolor: isMe ? 'primary.main' : 'background.paper',
            color: isMe ? 'primary.contrastText' : 'text.primary',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          {isStartOfGroup && !isMe && (
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', p: 1.5, pb: 0 }}>
              {sender?.username}
            </Typography>
          )}
          <Divider />
          <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: isMe ? 'rgba(255,255,255,0.2)' : 'primary.main', width: 48, height: 48 }}>
              {(fileName && fileName.endsWith('.pdf')) ? <PictureAsPdfIcon /> : <InsertDriveFileIcon />}
            </Avatar>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
                  {fileName || "archivo.adjunto"}
                </Typography>
              }
              secondary={
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {formatBytes(fileSize) || "0 MB"}
                </Typography>
              }
              sx={{ m: 0 }}
            />
            <IconButton href={fileUrl} target="_blank" download={fileName || 'archivo'} sx={{ color: 'inherit' }}>
              <DownloadForOfflineIcon />
            </IconButton>
          </Box>
          {text && (
            <Typography variant="body1" sx={{ px: 1.5, pb: 1, pt: 0.5, color: isMe ? 'primary.contrastText' : 'text.primary' }}>
              {text}
            </Typography>
          )}
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7, p: '4px 12px' }}>
            {new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
        {isMe && (
          <Avatar
            src={user?.profile_image || undefined}
            sx={{ bgcolor: '#888', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}
          >
            {user?.username ? user.username[0] : '?'}
          </Avatar>
        )}
      </Box>
    );
  };
  // --- FIN COMPONENTES DE MENSAJE ---

  // --- ¡NUEVO COMPONENTE "TYPING"! ---
  const TypingIndicator = () => {
    const usersWriting = Object.entries(typingUsers)
      .filter(([user, isTyping]) => isTyping)
      .map(([user]) => user);

    if (usersWriting.length === 0) {
      // Devuelve un placeholder para mantener la altura
      return <Box sx={{ height: '20px', px: 2 }} />;
    }

    let text;
    if (usersWriting.length === 1) {
      text = `${usersWriting[0]} está escribiendo...`;
    } else if (usersWriting.length === 2) {
      text = `${usersWriting[0]} y ${usersWriting[1]} están escribiendo...`;
    } else {
      text = 'Varios usuarios están escribiendo...';
    }

    return (
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'text.secondary', 
          px: 2, 
          height: '20px', 
          fontStyle: 'italic',
          transition: 'opacity 0.3s ease'
        }}
      >
        {text}
      </Typography>
    );
  };
  
  // --- ¡NUEVO COMPONENTE "VISTO POR"! ---
  const SeenByDisplay = ({ lastMessage, receipts, isGroup }) => {
    // Solo muestra "Visto por" en TUS propios mensajes
    if (!lastMessage || !receipts || lastMessage.sender?.username !== user?.username) {
      return null;
    }
    
    // Si es un chat grupal, no mostramos nada (como pediste)
    if (isGroup) {
      return null;
    }
    
    const lastMessageTime = new Date(lastMessage.timestamp);
    
    // Filtra los recibos: solo usuarios que han leído DESPUÉS de que enviaste este mensaje
    const usersWhoHaveSeen = receipts
      .filter(receipt => new Date(receipt.last_read_timestamp) >= lastMessageTime);
      
    if (usersWhoHaveSeen.length === 0) {
      return null; // Nadie lo ha visto aún
    }
  
    // Para DMs, si al menos 1 persona lo ha visto, muestra "Visto"
    const seenByText = "Visto";
  
    return (
      <Typography
        variant="caption"
        sx={{ 
          textAlign: 'right', 
          color: 'text.secondary', 
          display: 'block', 
          mr: { xs: 0, sm: '56px' }, 
          mt: 0.5 
        }}
      >
        {seenByText}
      </Typography>
    );
  };


  // --- RENDERIZADO PRINCIPAL ---
  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ height: '100%', p: 3, boxSizing: 'border-box', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, overflow: 'hidden' }}
    >

      {/* === COLUMNA IZQUIERDA (Lista de Conversaciones) === */}
      <Box
        component={motion.div}
        variants={itemVariants}
        sx={{ width: { xs: '100%', md: '35%' }, minWidth: { md: 320 }, display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Paper sx={glassPaperStyle(theme)}>
          {/* Header */}
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Inbox
            </Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              size="small"
              onClick={handleOpenModal}
            >
              Redactar
            </Button>
          </Box>

          {/* Lista (Scrollable) */}
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', ...getScrollbarStyles(theme) }}>
            {loadingSidebar ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>
            ) : (
              <>
                {/* --- SECCIÓN DE GRUPOS (Plegable) --- */}
                <Accordion
                  defaultExpanded
                  disableGutters
                  sx={{ bgcolor: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48, '&.Mui-expanded': { minHeight: 48 }, '& .MuiAccordionSummary-content': { margin: '12px 0' } }}>
                    <Typography sx={{ fontWeight: 600, color: 'text.secondary', pl: 1 }}>
                      GRUPOS (Chats de Cursos)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, pt: 0 }}>
                    <List sx={{ p: 1, pt: 0 }}>
                      {groupChats.map(convo => (
                        <ListItemButton
                          key={convo.id}
                          selected={selectedConvo?.id === convo.id}
                          onClick={() => setSelectedConvo(convo)}
                          sx={{ borderRadius: 2, mb: 0.5 }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.light' }}>
                              {convo.name ? convo.name[0] : '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                                  {convo.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, ml: 1 }}>
                                  {formatRelativeTime(convo.last_message_timestamp)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ noWrap: true, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {convo.last_message_snippet || "Sin mensajes"}
                                </Typography>
                                <Badge
                                  badgeContent={convo.unread_count}
                                  color="primary"
                                  sx={{ ml: 2, flexShrink: 0 }}
                                />
                              </Box>
                            }
                            primaryTypographyProps={{ component: 'div' }}
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Divider sx={{ mx: 2 }} />

                {/* --- SECCIÓN DE MENSAJES DIRECTOS --- */}
                <Accordion
                  defaultExpanded
                  disableGutters
                  sx={{ bgcolor: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48, '&.Mui-expanded': { minHeight: 48 }, '& .MuiAccordionSummary-content': { margin: '12px 0' } }}>
                    <Typography sx={{ fontWeight: 600, color: 'text.secondary', pl: 1 }}>
                      MENSAJES DIRECTOS
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, pt: 0 }}>
                    <List sx={{ p: 1, pt: 0 }}>
                      {dmChats.map(convo => {
                        const otherParticipant = (convo.participants || []).find(p => p.username !== user?.username);
                        if (!otherParticipant) return null;

                        return (
                          <ListItemButton
                            key={convo.id}
                            selected={selectedConvo?.id === convo.id}
                            onClick={() => setSelectedConvo(convo)}
                            sx={{ borderRadius: 2, mb: 0.5 }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                src={otherParticipant.profile_image || undefined}
                                sx={{ bgcolor: 'primary.light' }}
                              >
                                {otherParticipant.username ? otherParticipant.username[0] : '?'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    {otherParticipant.username}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, ml: 1 }}>
                                    {formatRelativeTime(convo.last_message_timestamp)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography sx={{ noWrap: true, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {/* Lógica actualizada para mostrar snippet o rol */ }
                                    {convo.last_message_snippet && convo.last_message_snippet !== "Sin mensajes"
                                      ? convo.last_message_snippet
                                      : (otherParticipant.role === 'Profesor' ? 'Profesor' : 'Compañero')}
                                  </Typography>
                                  <Badge
                                    badgeContent={convo.unread_count}
                                    color="primary"
                                    sx={{ ml: 2, flexShrink: 0 }}
                                  />
                                </Box>
                              }
                              primaryTypographyProps={{ component: 'div' }}
                              secondaryTypographyProps={{ component: 'div' }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Divider sx={{ mx: 2 }} />

                {/* --- SECCIÓN CHATS DE LECCIÓN --- */}
                <Accordion
                  defaultExpanded
                  disableGutters
                  sx={{ bgcolor: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48, '&.Mui-expanded': { minHeight: 48 }, '& .MuiAccordionSummary-content': { margin: '12px 0' } }}>
                    <Typography sx={{ fontWeight: 600, color: 'text.secondary', pl: 1 }}>
                      CHATS DE LECCIÓN
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 1, pt: 0 }}>

                    <Box sx={{ display: 'flex', gap: 1, mb: 1, px: 1 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Curso</InputLabel>
                        <Select
                          value={selectedCourse}
                          label="Curso"
                          onChange={handleCourseFilterChange}
                        >
                          <MenuItem value=""><em>Todos</em></MenuItem>
                          {courses.map(course => (
                            <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth size="small" disabled={!selectedCourse}>
                        <InputLabel>Módulo</InputLabel>
                        <Select
                          value={selectedModule}
                          label="Módulo"
                          onChange={handleModuleFilterChange}
                        >
                          <MenuItem value=""><em>Todos</em></MenuItem>
                          {modules.map(module => (
                            <MenuItem key={module.id} value={module.id}>{module.title}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <List sx={{ p: 0 }}>
                      {filteredLessonChats.map(convo => (
                        <ListItemButton
                          key={convo.id}
                          selected={selectedConvo?.id === convo.id}
                          onClick={() => setSelectedConvo(convo)}
                          sx={{ borderRadius: 2, mb: 0.5 }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'info.light', fontSize: '1rem' }}>
                              <CodeIcon fontSize="inherit" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                                  {convo.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, ml: 1 }}>
                                  {formatRelativeTime(convo.last_message_timestamp)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ noWrap: true, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {convo.last_message_snippet || "Sin mensajes"}
                                </Typography>
                                <Badge
                                  badgeContent={convo.unread_count}
                                  color="primary"
                                  sx={{ ml: 2, flexShrink: 0 }}
                                />
                              </Box>
                            }
                            primaryTypographyProps={{ component: 'div' }}
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItemButton>
                      ))}
                    </List>

                  </AccordionDetails>
                </Accordion>

              </>
            )}
          </Box>
        </Paper>
      </Box>

      {/* === COLUMNA DERECHA (Vista del Mensaje) === */}
      <Box
        component={motion.div}
        variants={itemVariants}
        sx={{ width: { xs: '100%', md: '65%' }, display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Paper sx={glassPaperStyle(theme)}>
          {/* Header del Mensaje */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', minHeight: '80px', flexShrink: 0 }}>
            {selectedConvo ? (
              <>
                <Avatar
                  sx={{ bgcolor: 'primary.main', mr: 2 }}
                  src={!selectedConvo.is_group ? (selectedConvo.participants || []).find(p => p.username !== user?.username)?.profile_image : undefined}
                >
                  {selectedConvo.is_group ? (selectedConvo.name ? selectedConvo.name[0] : '?') : ((selectedConvo.participants || []).find(p => p.username !== user?.username)?.username?.[0] || '?')}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedConvo.is_group ? selectedConvo.name : ((selectedConvo.participants || []).find(p => p.username !== user?.username)?.username || 'Usuario')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedConvo.is_group ? `${(selectedConvo.participants || []).length} participantes` : 'Mensaje Directo'}
                  </Typography>
                </Box>
              </>
            ) : (
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Selecciona un chat</Typography>
            )}
          </Box>

          {/* Cuerpo de Mensajes (Scrollable) */}
          <Box sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            ...getScrollbarStyles(theme)
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              {nextPageUrl && ( // Solo muestra si hay una pág. siguiente
                <Button
                  onClick={handleLoadMoreMessages}
                  disabled={loadingMoreMessages}
                  size="small"
                >
                  {loadingMoreMessages ? <CircularProgress size={20} /> : "Cargar mensajes anteriores"}
                </Button>
              )}
            </Box>
            {loadingMessages ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : messages.length === 0 && selectedConvo ? (
              <Alert severity="info" sx={{ m: 1 }}>Empieza la conversación. ¡Tu mensaje será el primero!</Alert>
            ) : (
              // --- ¡MAPEO DE MENSAJES ACTUALIZADO! ---
            messages.map((msg, index) => {
              const prevMsg = messages[index - 1];
              const isStartOfGroup = index === 0 || !prevMsg || msg.sender?.username !== prevMsg.sender?.username;
              
              // Verifica si este es el ÚLTIMO mensaje
              const isLastMessage = index === messages.length - 1;

              // Variable para el componente que vamos a renderizar
              let messageBlock;

              if (msg.message_type === 'IMAGE') {
                messageBlock = (
                  <ImageBlock 
                    sender={msg.sender} 
                    text={msg.content} 
                    fileUrl={msg.file_upload_url} // <-- ¡Prop correcta!
                    time={msg.timestamp} 
                    isStartOfGroup={isStartOfGroup} 
                  />
                );
              } else if (msg.message_type === 'FILE') {
                messageBlock = (
                  <FileBlock 
                    sender={msg.sender} 
                    text={msg.content} 
                    fileUrl={msg.file_upload_url} // <-- ¡Prop correcta!
                    fileName={msg.file_name} 
                    fileSize={msg.file_size} 
                    time={msg.timestamp} 
                    isStartOfGroup={isStartOfGroup} 
                  />
                );
              } else if (msg.message_type === 'CODE') {
                messageBlock = (
                  <CodeShareBlock 
                    sender={msg.sender} 
                    code={msg.content} // <-- Prop 'code'
                    language={msg.language} 
                    time={msg.timestamp} 
                    isStartOfGroup={isStartOfGroup} 
                  />
                );
              } else {
                // El fallback es el TextBlock
                messageBlock = (
                  <TextBlock 
                    sender={msg.sender} 
                    text={msg.content} // <-- Prop 'text'
                    time={msg.timestamp} 
                    isStartOfGroup={isStartOfGroup} 
                  />
                );
              }

              return (
                <React.Fragment key={msg.id}>
                  {messageBlock}
                  
                  {/* Lógica para "Visto por..." */}
                  {isLastMessage && (
                    <SeenByDisplay 
                      lastMessage={msg} 
                      receipts={readReceipts}
                      isGroup={selectedConvo?.is_group} 
                    />
                  )}
                </React.Fragment>
              );
            })
              // --- FIN DE MAPEO ---
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* ¡INDICADOR "TYPING" AÑADIDO! */}
          <TypingIndicator />

          {/* Caja de Respuesta (con Tabs) */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.default', flexShrink: 0 }}
          >
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab icon={<ChatIcon />} iconPosition="start" label="Mensaje" />
              <Tab icon={<CodeIcon />} iconPosition="start" label="CodeShare" />
            </Tabs>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <Box sx={{ p: 2, display: tabValue === 0 ? 'block' : 'none' }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Escribe tu mensaje..."
                variant="outlined"
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value);
                  handleOnTyping(); // <-- ¡Llama al handler de typing!
                }}
                disabled={!selectedConvo || isSending}
              />
            </Box>
            <Box sx={{ p: 2, display: tabValue === 1 ? 'block' : 'none' }}>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }} disabled={!selectedConvo || isSending}>
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
                multiline
                rows={8}
                placeholder="Pega tu código aquí..."
                variant="outlined"
                value={codeContent}
                onChange={(e) => {
                  setCodeContent(e.target.value);
                  handleOnTyping(); // <-- ¡Llama al handler de typing!
                }}
                disabled={!selectedConvo || isSending}
                sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: 1.6 } }}
              />
            </Box>

            {fileToUpload && (
              <Box sx={{ px: 2, pb: 1 }}>
                <Chip
                  icon={fileToUpload.type && fileToUpload.type.startsWith("image/") ? <ImageIcon /> : <InsertDriveFileIcon />}
                  label={fileToUpload.name}
                  onDelete={handleRemoveFile}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            )}

            <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tooltip title="Adjuntar archivo">
                <span>
                  <IconButton
                    onClick={handleFileButtonClick}
                    disabled={!selectedConvo || isSending}
                  >
                    <AttachFileIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                type="submit"
                endIcon={<SendIcon />}
                disabled={!selectedConvo || isSending || (textContent.trim() === "" && codeContent.trim() === "" && !fileToUpload)}
              >
                {isSending ? "Enviando..." : "Enviar"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* === MODAL PARA REDACTAR MENSAJE (Sin cambios) === */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={modalOpen}>
          <Box sx={modalStyle}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              Nuevo Mensaje
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar profesor o compañero..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 200, maxHeight: 400, ...getScrollbarStyles(theme) }}>
              <List>
                {filteredContacts.length > 0 ? (
                  filteredContacts.map(contact => (
                    <ListItemButton
                      key={contact.id}
                      onClick={() => handleStartConversation(contact.id)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={contact.profile_image || undefined}
                          sx={{ bgcolor: 'primary.light' }}
                        >
                          {contact.username ? contact.username[0] : '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={contact.username}
                        secondary={contact.role === 'PROFESSOR' ? 'Profesor' : (contact.title || 'Estudiante')}
                      />
                    </ListItemButton>
                  ))
                ) : (
                  <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    {searchQuery ? 'No se encontraron contactos.' : 'No hay contactos disponibles.'}
                  </Typography>
                )}
              </List>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* --- Snackbar para notificaciones (Sin cambios) --- */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </Box>
  );
}

export default InboxPage;