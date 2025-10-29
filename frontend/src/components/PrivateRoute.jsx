// src/components/PrivateRoute.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material'; // Para un spinner

function PrivateRoute() {
  // 1. Obtenemos el estado completo del contexto
  const { isAuthenticated, loading } = useAuth();

  // 2. Si AÚN ESTÁ CARGANDO, mostramos un spinner
  //    ¡Esta es la lógica que te falta!
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 3. Si YA TERMINÓ de cargar y NO está autenticado, lo mandamos al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 4. Si YA TERMINÓ de cargar y SÍ está autenticado, mostramos la página
  return <Outlet />;
}

export default PrivateRoute;