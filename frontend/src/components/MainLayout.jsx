import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext'; 
import { useTheme } from '@mui/material/styles'; 
import { AnimatePresence, motion } from "framer-motion"; 
import ExtensionIcon from '@mui/icons-material/Extension';

// --- 1. IMPORTACIONES NUEVAS PARA LA VIDEOLLAMADA ---
// (Asegúrate de haber creado estos archivos en los pasos anteriores)
import { VideoCallProvider } from '../context/VideoCallContext';
import GlobalJitsi from '../components/GlobalJitsi';

import { 
  AppBar, Box, CssBaseline, Drawer, List, ListItemButton, ListItemIcon, 
  ListItemText, Toolbar, Typography, Divider, ListSubheader, Avatar, 
  IconButton, InputBase, Badge, Paper
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

const drawerWidth = 280; 

function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const theme = useTheme(); 
  const colorMode = useColorMode(); 
  
  const [openSettings, setOpenSettings] = useState(false); 

  return (
    // --- 2. ENVOLVEMOS TODO EN EL PROVIDER ---
    <VideoCallProvider>
      <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
        <CssBaseline />
        
        {/* BARRA SUPERIOR (APPBAR) - Sin cambios */}
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
              <Paper 
                  component="form"
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
                      placeholder="Search your course..."
                      inputProps={{ 'aria-label': 'search your course' }}
                  />
              </Paper>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                    {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                  <IconButton color="inherit">
                      <Badge badgeContent={4} color="error">
                          <NotificationsIcon />
                      </Badge>
                  </IconButton>
                  <IconButton>
                      <Avatar sx={{ width: 40, height: 40 }} src="https://placehold.co/150" alt="Avatar" />
                  </IconButton>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {user?.username}
                  </Typography>
              </Box>
          </Toolbar>
        </AppBar>
        
        {/* BARRA LATERAL (DRAWER) - Sin cambios */}
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
              <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
                  Coursue
              </Typography>
          </Toolbar>
          <Box sx={{ overflow: 'auto', p: 1, flexGrow: 1 }}>
              <List component="nav" subheader={
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 600, color: 'text.secondary' }}>
                  OVERVIEW
                </ListSubheader>
              }>
                  <ListItemButton component={RouterLink} to="/" selected={location.pathname === '/'}>
                      <ListItemIcon><DashboardIcon /></ListItemIcon>
                      <ListItemText primary="Dashboard" />
                  </ListItemButton>
                  <ListItemButton component={RouterLink} to="/inbox" selected={location.pathname === '/inbox'}>
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText primary="Inbox" />
                  </ListItemButton>
                  <ListItemButton component={RouterLink} to="/courses" selected={location.pathname.startsWith('/courses')}>
                      <ListItemIcon><MenuBookIcon /></ListItemIcon>
                      <ListItemText primary="Cursos" />
                  </ListItemButton>
                  <ListItemButton component={RouterLink} to="/practice">
                    <ListItemIcon><ExtensionIcon /></ListItemIcon>
                    <ListItemText primary="Mundo de Práctica" />
                  </ListItemButton>
              </List>
              <Divider sx={{ my: 2 }} />
              <List component="nav" subheader={
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 600, color: 'text.secondary' }}>
                  FRIENDS
                </ListSubheader>
              }>
                  <ListItemButton>
                      <ListItemIcon><Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }} src="https://placehold.co/50/FF5733/FFFFFF?text=BM" /></ListItemIcon>
                      <ListItemText primary="Bagas Mahpie" />
                  </ListItemButton>
              </List>
              <Divider sx={{ my: 2 }} />
              <List component="nav" subheader={
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 600, color: 'text.secondary' }}>
                  SETTINGS
                </ListSubheader>
              }>
                  <ListItemButton component={RouterLink} to="/settings" selected={location.pathname === '/settings'}>
                      <ListItemIcon><SettingsIcon /></ListItemIcon>
                      <ListItemText primary="Setting" />
                  </ListItemButton>
              </List>
          </Box>
          <Box sx={{ p: 1, pb: 2 }}>
              <ListItemButton onClick={logout} sx={{
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.15)' },
                  color: 'error.main'
              }}>
                  <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
                  <ListItemText primary="Logout" />
              </ListItemButton>
          </Box>
        </Drawer>
        
        {/* CONTENIDO PRINCIPAL (Outlet) */}
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
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* --- 3. EL COMPONENTE GLOBAL FLOTANTE (Fuera del Outlet) --- */}
        <GlobalJitsi />

      </Box>
    </VideoCallProvider>
  );
}

export default MainLayout;