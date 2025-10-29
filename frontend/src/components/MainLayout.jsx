// frontend/src/components/MainLayout.jsx

import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom'; // No más useNavigate
// 1. Importa el hook
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
  Button // Para el botón de "Hola, Usuario"
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import LogoutIcon from '@mui/icons-material/Logout'; 

const drawerWidth = 240;

function MainLayout() {
  // 2. Obtiene 'user' y 'logout' del contexto
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      <AppBar 
        position="fixed" 
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            LMS Platform
          </Typography>
          
          {/* 3. Muestra el nombre del usuario si está logueado */}
          {user && (
            <Typography>
              Hola, {user.username}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column' 
          },
        }}
      >
        <Toolbar /> 
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {/* 4. Mejora los links para que usen 'react-router-dom' */}
            <ListItem button component={RouterLink} to="/">
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Inicio" />
            </ListItem>
            <ListItem button component={RouterLink} to="/">
              <ListItemIcon><SchoolIcon /></ListItemIcon>
              <ListItemText primary="Cursos" />
            </ListItem>
          </List>
        </Box>
        
        <Box sx={{ marginTop: 'auto' }}> 
          <Divider />
          <List>
            {/* 5. Llama a 'logout' del contexto al hacer clic */}
            <ListItem button onClick={logout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Cerrar Sesión" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> 
        <Outlet />
      </Box>
    </Box>
  );
}

export default MainLayout;