import React, { useState, useEffect } from 'react';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext'; 
import { useTheme } from '@mui/material/styles'; 
import { AnimatePresence, motion } from "framer-motion"; 
import ExtensionIcon from '@mui/icons-material/Extension';
import axiosInstance from '../api/axios'; // <--- IMPORTANTE

import { VideoCallProvider } from '../context/VideoCallContext';
import GlobalJitsi from '../components/GlobalJitsi';

import { 
  AppBar, Box, CssBaseline, Drawer, List, ListItemButton, ListItemIcon, 
  ListItemText, Toolbar, Typography, Divider, ListSubheader, Avatar, 
  IconButton, InputBase, Badge, Paper, Tooltip, CircularProgress
} from '@mui/material';

// Iconos
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EmailIcon from '@mui/icons-material/Email';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PersonIcon from '@mui/icons-material/Person';

const drawerWidth = 280; 

function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme(); 
  const colorMode = useColorMode(); 
  
  // --- ESTADOS PARA DATOS REALES ---
  const [contacts, setContacts] = useState([]); // Para la lista "Friends"
  const [stats, setStats] = useState(null);     // Para notificaciones
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSidebar, setLoadingSidebar] = useState(false);

  // --- 1. CARGAR DATOS DEL SIDEBAR ---
  useEffect(() => {
    if (!user) return;

    const fetchSidebarData = async () => {
        try {
            setLoadingSidebar(true);
            // Cargar contactos (Compañeros/Profesores)
            // Usamos el endpoint que creamos: ContactListView
            const contactsRes = await axiosInstance.get('/api/inbox/contacts/');
            setContacts(contactsRes.data);

            // Cargar notificaciones (usamos pendientes del dashboard)
            const statsRes = await axiosInstance.get('/api/dashboard/stats/');
            setStats(statsRes.data);

        } catch (error) {
            console.error("Error cargando sidebar data", error);
        } finally {
            setLoadingSidebar(false);
        }
    };

    fetchSidebarData();
  }, [user, location.pathname]); // Recargar si cambiamos de ruta (opcional)

  // --- 2. MANEJAR BÚSQUEDA ---
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        // Redirigir al catálogo de cursos con el filtro activado
        // (Necesitarás lógica en CoursesPage para leer '?search=...')
        navigate(`/courses?search=${searchQuery}`);
    }
  };

  // Determinar número de notificaciones (Tareas pendientes o sin calificar)
  const notificationCount = stats ? (user.role === 'PROFESSOR' ? stats.pending_tasks : 0) : 0;

  return (
    <VideoCallProvider>
      <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
        <CssBaseline />
        
        {/* BARRA SUPERIOR (APPBAR) */}
        <AppBar 
          position="fixed" 
          color="transparent"
          elevation={0}
          sx={{ 
            width: `calc(100% - ${drawerWidth}px)`, 
            ml: `${drawerWidth}px`,
            backdropFilter: 'blur(10px)', 
            backgroundColor: theme.palette.background.default, 
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', height: 80 }}>
              
              {/* BUSCADOR FUNCIONAL */}
              <Paper 
                  component="form"
                  onSubmit={handleSearch}
                  sx={{ 
                      p: '2px 8px', display: 'flex', alignItems: 'center', width: 300, 
                      borderRadius: 12, backgroundColor: theme.palette.mode === 'dark' ? '#3B3D40' : '#EAEFF8', 
                      boxShadow: 'none', 
                  }}
              >
                  <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
                      <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                  </IconButton>
                  <InputBase
                      sx={{ ml: 1, flex: 1, color: theme.palette.text.primary }}
                      placeholder={user.role === 'PROFESSOR' ? "Buscar alumno..." : "Buscar curso..."}
                      inputProps={{ 'aria-label': 'search' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </Paper>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                    {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                  
                  {/* NOTIFICACIONES REALES */}
                  <IconButton color="inherit" onClick={() => navigate(user.role === 'PROFESSOR' ? '/' : '/inbox')}>
                      <Badge badgeContent={notificationCount} color="error">
                          <NotificationsIcon />
                      </Badge>
                  </IconButton>
                  
                  {/* AVATAR REAL */}
                  <IconButton onClick={() => navigate('/settings')}>
                      <Avatar 
                        sx={{ width: 40, height: 40, bgcolor: 'primary.main' }} 
                        src={user?.profile_image} 
                        alt={user?.username}
                      >
                          {user?.username?.charAt(0).toUpperCase()}
                      </Avatar>
                  </IconButton>
                  
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {user?.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                          {user?.role === 'PROFESSOR' ? 'Profesor' : 'Estudiante'}
                      </Typography>
                  </Box>
              </Box>
          </Toolbar>
        </AppBar>
        
        {/* BARRA LATERAL (DRAWER) */}
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: 'background.paper',
              borderRight: 'none',
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Toolbar sx={{ justifyContent: 'flex-start', alignItems: 'center', py: 2, pl: 3, height: 80 }}>
              <SchoolIcon sx={{ mr: 1, color: 'primary.main', fontSize: 30 }} />
              <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
                  Coursue
              </Typography>
          </Toolbar>

          <Box sx={{ overflow: 'auto', p: 1, flexGrow: 1 }}>
              <List component="nav" subheader={
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 1 }}>
                  GENERAL
                </ListSubheader>
              }>
                  <ListItemButton component={RouterLink} to="/" selected={location.pathname === '/'}>
                      <ListItemIcon><DashboardIcon color={location.pathname === '/' ? "primary" : "inherit"}/></ListItemIcon>
                      <ListItemText primary="Dashboard" primaryTypographyProps={{fontWeight: location.pathname === '/' ? 600 : 400}} />
                  </ListItemButton>
                  <ListItemButton component={RouterLink} to="/inbox" selected={location.pathname.startsWith('/inbox')}>
                      <ListItemIcon><EmailIcon color={location.pathname.startsWith('/inbox') ? "primary" : "inherit"}/></ListItemIcon>
                      <ListItemText primary="Mensajes" primaryTypographyProps={{fontWeight: location.pathname.startsWith('/inbox') ? 600 : 400}} />
                  </ListItemButton>
                  <ListItemButton component={RouterLink} to="/courses" selected={location.pathname.startsWith('/courses')}>
                      <ListItemIcon><MenuBookIcon color={location.pathname.startsWith('/courses') ? "primary" : "inherit"}/></ListItemIcon>
                      <ListItemText primary="Cursos" primaryTypographyProps={{fontWeight: location.pathname.startsWith('/courses') ? 600 : 400}} />
                  </ListItemButton>
                  <ListItemButton component={RouterLink} to="/practice" selected={location.pathname.startsWith('/practice')}>
                    <ListItemIcon><ExtensionIcon color={location.pathname.startsWith('/practice') ? "primary" : "inherit"}/></ListItemIcon>
                    <ListItemText primary="Mundo Práctico" primaryTypographyProps={{fontWeight: location.pathname.startsWith('/practice') ? 600 : 400}} />
                  </ListItemButton>
              </List>

              <Divider sx={{ my: 2, opacity: 0.5 }} />
              
              {/* LISTA DE CONTACTOS REAL */}
              <List component="nav" subheader={
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 1, display:'flex', justifyContent:'space-between' }}>
                  {user?.role === 'PROFESSOR' ? 'MIS ALUMNOS' : 'MENTORES & COMPAÑEROS'}
                </ListSubheader>
              }>
                  {loadingSidebar ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>
                  ) : contacts.length > 0 ? (
                      contacts.slice(0, 5).map((contact) => (
                          <ListItemButton 
                            key={contact.id} 
                            onClick={() => navigate('/inbox')} // O abrir chat directo
                          >
                              <ListItemIcon>
                                <Badge 
                                    color="success" 
                                    variant="dot" 
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                >
                                    <Avatar 
                                        sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'secondary.main' }} 
                                        src={contact.profile_image}
                                    >
                                        {contact.username[0].toUpperCase()}
                                    </Avatar>
                                </Badge>
                              </ListItemIcon>
                              <ListItemText 
                                primary={contact.username} 
                                primaryTypographyProps={{ fontSize: '0.9rem' }}
                                secondary={contact.role === 'PROFESSOR' ? 'Profesor' : null}
                                secondaryTypographyProps={{ fontSize: '0.7rem' }}
                              />
                          </ListItemButton>
                      ))
                  ) : (
                      <Typography variant="caption" sx={{ pl: 4, color: 'text.secondary' }}>
                          No hay contactos aún.
                      </Typography>
                  )}
                  
                  {/* Botón Ver Todos si hay muchos */}
                  {contacts.length > 5 && (
                      <ListItemButton component={RouterLink} to="/inbox">
                          <ListItemText primary="Ver todos..." primaryTypographyProps={{ fontSize: '0.8rem', color: 'primary.main' }} sx={{ pl: 7 }} />
                      </ListItemButton>
                  )}
              </List>

              <Divider sx={{ my: 2, opacity: 0.5 }} />
              
              <List component="nav" subheader={
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 1 }}>
                  CUENTA
                </ListSubheader>
              }>
                  <ListItemButton component={RouterLink} to="/settings" selected={location.pathname === '/settings'}>
                      <ListItemIcon><SettingsIcon /></ListItemIcon>
                      <ListItemText primary="Configuración" />
                  </ListItemButton>
              </List>
          </Box>
          
          {/* LOGOUT */}
          <Box sx={{ p: 2 }}>
              <ListItemButton onClick={logout} sx={{
                  borderRadius: 2,
                  backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.15)' },
                  color: 'error.main',
                  transition: '0.2s'
              }}>
                  <ListItemIcon><LogoutIcon color="error" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
          </Box>
        </Drawer>
        
        {/* CONTENIDO PRINCIPAL */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: `calc(100% - ${drawerWidth}px)`,
            mt: '80px',
            height: 'calc(100vh - 80px)', 
            position: "relative"
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              // Animación suave al cambiar de página
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Global Jitsi (Llamadas) */}
        <GlobalJitsi />

      </Box>
    </VideoCallProvider>
  );
}

export default MainLayout;