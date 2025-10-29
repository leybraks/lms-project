// frontend/src/components/MainLayout.jsx

import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography,
  Divider,
  Button,
  Collapse,
  ListItemButton,
  ListSubheader,
  Avatar 
} from '@mui/material';

// Iconos
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import ListAltIcon from '@mui/icons-material/ListAlt';

// ¡CAMBIO 1: ANCHO INCREMENTADO!
const drawerWidth = 300; 

function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // ¡CAMBIO 2: ESTADO INICIAL COMPRIMIDO!
  const [openReports, setOpenReports] = useState(false); 
  
  const handleReportsClick = () => {
      setOpenReports(!openReports);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* 1. BARRA SUPERIOR (APPBAR) */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: `calc(100% - ${drawerWidth}px)`, 
          ml: `${drawerWidth}px`,
          backgroundColor: 'background.paper' 
        }}
      >
        <Toolbar sx={{ justifyContent: 'flex-end' }}>
            <Typography variant="body2" color="text.secondary">
                {/* Contenido opcional de la barra superior */}
            </Typography>
        </Toolbar>
      </AppBar>
      
      {/* 2. BARRA LATERAL (DRAWER) */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        {/* Logo o nombre de la app */}
        <Toolbar sx={{ justifyContent: 'center', py: 2, borderBottom: '1px solid #333' }}>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                LMS Platform
            </Typography>
        </Toolbar>
        
        {/* Contenedor principal de la navegación */}
        <Box sx={{ overflow: 'auto', p: 1, flexGrow: 1 }}>
            
            {/* SECCIÓN 1: NAVEGACIÓN PRINCIPAL */}
            <List component="nav" subheader={<ListSubheader sx={{ bgcolor: 'transparent' }}>Dashboard Types</ListSubheader>}>
                {/* Ítem "Overview" (Home) */}
                <ListItemButton 
                    component={RouterLink} 
                    to="/" 
                    selected={location.pathname === '/'} 
                    sx={{ my: 0.5 }}
                >
                    <ListItemIcon><HomeIcon /></ListItemIcon>
                    <ListItemText primary="Overview (Inicio)" />
                </ListItemButton>

                {/* Ítem "Cursos" */}
                <ListItemButton 
                    component={RouterLink} 
                    to="/" 
                    selected={location.pathname.startsWith('/courses')} 
                    sx={{ my: 0.5 }}
                >
                    <ListItemIcon><AutoStoriesIcon /></ListItemIcon>
                    <ListItemText primary="Explorar Cursos" />
                </ListItemButton>
            </List>

            <Divider sx={{ my: 1 }} />

            {/* SECCIÓN 2: MENÚ PLEGABLE */}
            <List component="nav" subheader={<ListSubheader sx={{ bgcolor: 'transparent' }}>Report Summaries</ListSubheader>}>
                
                {/* Botón Plegable */}
                <ListItemButton onClick={handleReportsClick} sx={{ my: 0.5 }}>
                    <ListItemIcon><StarIcon /></ListItemIcon>
                    <ListItemText primary="Monthly Insights" />
                    {openReports ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                
                <Collapse in={openReports} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton sx={{ pl: 4, my: 0.5 }}>
                            <ListItemText primary="Weekly Reports" />
                        </ListItemButton>
                        <ListItemButton sx={{ pl: 4, my: 0.5 }}>
                            <ListItemText primary="Quarterly Analysis" />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* Ítem fijo de Business Intelligence */}
                <ListItemButton sx={{ my: 0.5 }}>
                    <ListItemIcon><ListAltIcon /></ListItemIcon>
                    <ListItemText primary="Performance Metrics" />
                </ListItemButton>

            </List>
        </Box>

        {/* 3. FOOTER DEL DRAWER (USUARIO Y LOGOUT) */}
        <Box sx={{ p: 1 }}>
            <Divider sx={{ mb: 1 }}/>
            
            {/* Información del Usuario */}
            <ListItem sx={{ py: 1, px: 2 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', color: '#121212' }}>
                        {user.username ? user.username[0].toUpperCase() : 'U'}
                    </Avatar>
                </ListItemIcon>
                <ListItemText 
                    primary={user.username} 
                    secondary="Estudiante"
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                />
            </ListItem>

            {/* Botón de Logout */}
            <ListItemButton onClick={logout} sx={{ my: 0.5, backgroundColor: 'rgba(255, 0, 0, 0.1)', '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.2)' } }}>
                <ListItemIcon>
                    <LogoutIcon color="error" />
                </ListItemIcon>
                <ListItemText primary="Cerrar Sesión" />
            </ListItemButton>
        </Box>

      </Drawer>
      
      {/* 3. CONTENIDO PRINCIPAL (Outlet) */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }} 
      >
        <Outlet /> 
      </Box>
    </Box>
  );
}

export default MainLayout;