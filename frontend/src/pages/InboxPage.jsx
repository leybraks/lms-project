import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";
import axiosInstance from '../api/axios'; 
import { useAuth } from '../context/AuthContext';
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
  ListSubheader,
  CircularProgress,
  Alert,
  Modal,
  Fade,
  Backdrop,
  InputAdornment,
  Snackbar,
  Tooltip,
  Chip,
  CardMedia
} from '@mui/material';

// --- Iconos ---
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import CommentIcon from '@mui/icons-material/Comment';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';

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

// --- Helper para formatear tamaño de archivo ---
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}


function InboxPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // --- Estados (Sin cambios) ---
  const [groupChats, setGroupChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [codeLang, setCodeLang] = useState('python');
  const [textContent, setTextContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loadingContactsModal, setLoadingContactsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [fileToUpload, setFileToUpload] = useState(null);

  
  // --- useEffects (Sin cambios) ---
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setLoadingSidebar(true);
        setError(null);
        const [groupsResponse, contactsResponse] = await Promise.all([
          axiosInstance.get('/api/inbox/group_chats/'),
          axiosInstance.get('/api/inbox/contacts/')
        ]);
        
        const groups = groupsResponse.data;
        const contacts = contactsResponse.data;

        setGroupChats(groups);
        setContacts(contacts);
        
        const lastConvoString = localStorage.getItem('lastSelectedConvo');
        let convoToSet = null;

        if (lastConvoString) {
          try {
            convoToSet = JSON.parse(lastConvoString);
          } catch (e) {
            console.error("Error al parsear la conversación guardada:", e);
            localStorage.removeItem('lastSelectedConvo');
          }
        }
        
        if (!convoToSet && groups.length > 0) {
          convoToSet = groups[0];
        }

        if (convoToSet) {
          setSelectedConvo(convoToSet);
        }
        
      } catch (err) { 
        console.error("Error al cargar datos del sidebar:", err);
        setError("No se pudieron cargar tus chats.");
      } 
      finally { setLoadingSidebar(false); }
    };
    fetchSidebarData();
  }, []); 

  useEffect(() => {
    if (!selectedConvo) return;
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        setError(null);
        const response = await axiosInstance.get(`/api/inbox/conversations/${selectedConvo.id}/messages/`);
        setMessages(response.data);
      } catch (err) { 
        console.error("Error al cargar mensajes:", err);
        setError("No se pudieron cargar los mensajes.");
      } 
      finally { setLoadingMessages(false); }
    };
    fetchMessages();
  }, [selectedConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  useEffect(() => {
    if (selectedConvo) {
      localStorage.setItem('lastSelectedConvo', JSON.stringify(selectedConvo));
    }
  }, [selectedConvo]);

  // --- Handlers (Sin cambios) ---
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
      messageType = fileToUpload.type.startsWith('image/') ? 'IMAGE' : 'FILE';
    }
    if (content.trim() !== "") {
      formData.append('content', content);
      if (!fileToUpload) {
        messageType = isCode ? 'CODE' : 'TEXT';
      }
      if (isCode) {
        formData.append('language', codeLang);
      }
    }
    formData.append('message_type', messageType);
    try {
      const response = await axiosInstance.post(
        `/api/inbox/conversations/${selectedConvo.id}/messages/`, 
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setMessages(prevMessages => [...prevMessages, response.data]);
      setTextContent("");
      setCodeContent("");
      setFileToUpload(null);
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
    if (query === "") {
      setFilteredContacts(contacts);
    } else {
      setFilteredContacts(
        contacts.filter(contact => 
          contact.username.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  };
  
  const handleStartConversation = async (contactId) => {
    try {
      const response = await axiosInstance.post('/api/inbox/start_dm/', {
        user_id: contactId
      });
      const newOrExistingConvo = response.data;
      setSelectedConvo(newOrExistingConvo);
      handleCloseModal();
    } catch (err) {
      console.error("Error al iniciar conversación:", err);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
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

  // --- Componente de Diseño para el Bloque de Código ---
  const CodeShareBlock = ({ sender, code, language, time, isStartOfGroup }) => {
    const isMe = sender.username === user.username; 
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
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>
            {sender.username[0]}
          </Avatar>
        )}
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, width: '100%' }}>
          {isStartOfGroup && !isMe && (
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', px: 2, pt: 1.5 }}>
              {sender.username}
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
            {String(code).trim()}
          </SyntaxHighlighter>
          <Divider />
          <Typography variant="caption" sx={{ p: '4px 12px', display: 'block', textAlign: 'right', opacity: 0.7, bgcolor: 'background.paper' }}>
            {new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
        {isMe && (
          <Avatar sx={{ bgcolor: '#888', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>
            {user.username[0]}
          </Avatar>
        )}
      </Box>
    );
  };

  // --- Componente para Mensaje de Texto ---
  const TextBlock = ({ sender, text, time, isStartOfGroup }) => {
    const isMe = sender.username === user.username; 
    return (
      <Box sx={{ display: 'flex', gap: 1.5, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', alignItems: 'flex-start', mt: isStartOfGroup ? 2 : 0.25 }}>
        {!isMe && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>
            {sender.username[0]}
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
              {sender.username}
            </Typography>
          )}
          <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}>{text}</Typography>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7, mt: 0.5 }}>
            {new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
        {isMe && (
          <Avatar sx={{ bgcolor: '#888', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>
            {user.username[0]}
          </Avatar>
        )}
      </Box>
    );
  };
  
  // --- Componente para Imágenes ---
  const ImageBlock = ({ sender, text, fileUrl, time, isStartOfGroup }) => {
    const isMe = sender.username === user.username;
    return (
      <Box sx={{ display: 'flex', gap: 1.5, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: {xs: '80%', sm: 400}, alignItems: 'flex-start', mt: isStartOfGroup ? 2 : 0.25 }}>
        {!isMe && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>
            {sender.username[0]}
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
              {sender.username}
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
          <Avatar sx={{ bgcolor: '#888', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>
            {user.username[0]}
          </Avatar>
        )}
      </Box>
    );
  };
  
  // --- Componente para Archivos Genéricos ---
  const FileBlock = ({ sender, text, fileUrl, fileName, fileSize, time, isStartOfGroup }) => {
    const isMe = sender.username === user.username;
    
    return (
      <Box sx={{ display: 'flex', gap: 1.5, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: {xs: '80%', sm: 350}, alignItems: 'flex-start', mt: isStartOfGroup ? 2 : 0.25 }}>
        {!isMe && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>
            {sender.username[0]}
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
              {sender.username}
            </Typography>
          )}
          
          {/* Simulación de Thumbnail (como en WhatsApp) */}
          <Box sx={{ p: 0.5, bgcolor: 'rgba(0,0,0,0.1)' }}>
            <CardMedia
              component="img"
              height="100" 
              image="https://placehold.co/600x200/555/FFF?text=PREVIEW"
              alt="Vista previa"
              sx={{ objectFit: 'cover', opacity: 0.5 }}
            />
          </Box>
          
          <Divider />
          
          <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: isMe ? 'rgba(255,255,255,0.2)' : 'primary.main', width: 48, height: 48 }}>
              {(fileName && fileName.endsWith('.pdf')) ? <PictureAsPdfIcon /> : <InsertDriveFileIcon />}
            </Avatar>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
                  {fileName || "archivo.pdf"}
                </Typography>
              }
              secondary={
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {formatBytes(fileSize) || "0 MB"}
                </Typography>
              }
              sx={{ m: 0 }}
            />
            {/* --- ¡¡¡AQUÍ ESTÁ EL ARREGLO!!! --- */}
            <IconButton href={fileUrl} target="_blank" download={fileName || 'archivo'} sx={{ color: 'inherit' }}>
              <DownloadForOfflineIcon />
            </IconButton>
          </Box>
          
          {text && (
            <Typography variant="body1" sx={{ px: 1.5, pb: 1, pt: 0.5 }}>
              {text}
            </Typography>
          )}
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7, p: '4px 12px' }}>
            {new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
        {isMe && (
          <Avatar sx={{ bgcolor: '#888', width: 40, height: 40, visibility: isStartOfGroup ? 'visible' : 'hidden' }}>
            {user.username[0]}
          </Avatar>
        )}
      </Box>
    );
  };


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
                {/* --- SECCIÓN DE GRUPOS --- */}
                <List sx={{ p: 1 }} subheader={<ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 600, color: 'text.secondary', lineHeight: '30px' }}>GRUPOS (Chats de Cursos)</ListSubheader>}>
                  {groupChats.map(convo => (
                    <ListItemButton 
                      key={convo.id} 
                      selected={selectedConvo?.id === convo.id}
                      onClick={() => setSelectedConvo(convo)}
                      sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                      <ListItemAvatar><Avatar sx={{ bgcolor: 'secondary.light' }}>{convo.name[0]}</Avatar></ListItemAvatar>
                      <ListItemText 
                        primary={convo.name}
                        secondary={convo.last_message_snippet}
                        primaryTypographyProps={{ fontWeight: 600 }}
                        secondaryTypographyProps={{ noWrap: true, opacity: 0.8 }}
                      />
                    </ListItemButton>
                  ))}
                </List>
                <Divider sx={{ mx: 2 }} />

                {/* --- SECCIÓN DE MENSAJES DIRECTOS (Contactos) --- */}
                <List sx={{ p: 1 }} subheader={<ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 600, color: 'text.secondary', lineHeight: '30px' }}>MENSAJES DIRECTOS (Contactos)</ListSubheader>}>
                  {contacts.map(contact => (
                    <ListItemButton 
                      key={contact.id} 
                      selected={selectedConvo?.is_group === false && selectedConvo?.participants.some(p => p.id === contact.id)}
                      onClick={() => handleStartConversation(contact.id)}
                      sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                      <ListItemAvatar><Avatar sx={{ bgcolor: 'primary.light' }}>{contact.username[0]}</Avatar></ListItemAvatar>
                      <ListItemText 
                        primary={contact.username}
                        secondary={contact.role === 'PROFESSOR' ? 'Profesor' : 'Compañero'}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItemButton>
                  ))}
                </List>
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
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  {selectedConvo.is_group ? selectedConvo.name[0] : (selectedConvo.participants.find(p => p.username !== user.username)?.username[0] || '?')}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedConvo.is_group ? selectedConvo.name : (selectedConvo.participants.find(p => p.username !== user.username)?.username || 'Usuario')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedConvo.is_group ? `${selectedConvo.participants.length} participantes` : 'Mensaje Directo'}
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
            {loadingMessages ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : messages.length === 0 && selectedConvo ? (
                <Alert severity="info" sx={{ m: 1 }}>Empieza la conversación. ¡Tu mensaje será el primero!</Alert>
            ) : (
              // --- Mapeo con Lógica de Agrupación ---
              messages.map((msg, index) => {
                const prevMsg = messages[index - 1];
                const isStartOfGroup = index === 0 || !prevMsg || msg.sender.username !== prevMsg.sender.username;

                if (msg.message_type === 'IMAGE') {
                  return <ImageBlock key={msg.id} sender={msg.sender} text={msg.content} fileUrl={msg.file_upload} time={msg.timestamp} isStartOfGroup={isStartOfGroup} />
                }
                if (msg.message_type === 'FILE') {
                  return <FileBlock key={msg.id} sender={msg.sender} text={msg.content} fileUrl={msg.file_upload} fileName={msg.file_name} fileSize={msg.file_size} time={msg.timestamp} isStartOfGroup={isStartOfGroup} />
                }
                if (msg.message_type === 'CODE') {
                  return <CodeShareBlock key={msg.id} sender={msg.sender} code={msg.content} language={msg.language} time={msg.timestamp} isStartOfGroup={isStartOfGroup} />
                }
                return <TextBlock key={msg.id} sender={msg.sender} text={msg.content} time={msg.timestamp} isStartOfGroup={isStartOfGroup} />
              })
            )}
            
            <div ref={messagesEndRef} /> 
          </Box>

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
              // accept="image/*,video/*,.pdf,.doc,.docx,.zip"
            />
            
            <Box sx={{ p: 2, display: tabValue === 0 ? 'block' : 'none' }}>
              <TextField 
                fullWidth 
                multiline 
                rows={4}
                placeholder="Escribe tu mensaje..." 
                variant="outlined"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
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
                onChange={(e) => setCodeContent(e.target.value)}
                disabled={!selectedConvo || isSending}
                sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: 1.6 } }}
              />
            </Box>

            {fileToUpload && (
              <Box sx={{ px: 2, pb: 1 }}>
                <Chip
                  icon={fileToUpload.type.startsWith("image/") ? <ImageIcon /> : <InsertDriveFileIcon />}
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

      {/* === MODAL PARA REDACTAR MENSAJE === */}
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
              {loadingContactsModal ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <ListItemButton 
                        key={contact.id} 
                        onClick={() => handleStartConversation(contact.id)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>{contact.username[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={contact.username} 
                          secondary={contact.title || contact.email} 
                        />
                      </ListItemButton>
                    ))
                  ) : (
                    <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                      {searchQuery ? 'No se encontraron contactos.' : 'No hay contactos disponibles.'}
                    </Typography>
                  )}
                </List>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* --- Snackbar para notificaciones --- */}
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