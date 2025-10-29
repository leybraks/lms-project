// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Avatar,
  Alert,
  Paper,
  Link,
  Grid 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

function LoginPage() {
  // ... (Todos tus estados y handlers siguen igual) ...
  // Estado para el login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  
  // Estado para el registro
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Estado para la animación
  const [isRegistering, setIsRegistering] = useState(false);

  const { login } = useAuth();

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError(null);
    try {
      await login({ username: loginUsername, password: loginPassword });
    } catch (err) {
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(false);
    // TODO: Conectar a la API de registro
    try {
      setRegisterSuccess(true);
      setIsRegistering(false); 
    } catch (err) {
      setRegisterError('Error al registrarse.');
    }
  };

  return (
    // 1. Box principal modificado para 100%
    <Box sx={{ 
      height: '100vh', 
      width: '100vw', // <-- Ocupa todo el ancho
      display: 'flex', 
    }}>
      
      {/* 2. <Container> ha sido eliminado */}

      <Paper 
        elevation={0} // Sin sombra
        square // Sin bordes redondeados
        sx={{ 
          height: '100vh', // <-- Ocupa toda la altura
          width: '100vw', // <-- Ocupa todo el ancho
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          overflow: 'hidden', 
          position: 'relative', 
        }}
      >
        {/* ---- Panel de Registro (Izquierda) ---- */}
        <Box 
          component="form" 
          onSubmit={handleRegisterSubmit}
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            p: 4,
            backgroundColor: 'background.paper',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <PersonAddIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Crear Cuenta
          </Typography>
          {registerError && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{registerError}</Alert>}
          {registerSuccess && <Alert severity="success" sx={{ width: '100%', mt: 2 }}>¡Registro exitoso! Inicia sesión.</Alert>}
          
          <TextField margin="normal" required fullWidth label="Nombre de Usuario" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} />
          <TextField margin="normal" required fullWidth label="Correo Electrónico" type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
          <TextField margin="normal" required fullWidth label="Contraseña" type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
          
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Registrarse
          </Button>
        </Box>

        {/* ---- Panel de Login (Derecha) ---- */}
        <Box 
          component="form" 
          onSubmit={handleLoginSubmit}
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            p: 4,
            backgroundColor: 'background.paper', 
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Iniciar Sesión
          </Typography>
          {loginError && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{loginError}</Alert>}
          
          <TextField margin="normal" required fullWidth label="Nombre de Usuario" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} autoFocus />
          <TextField margin="normal" required fullWidth label="Contraseña" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
          
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Ingresar
          </Button>
          
          <Grid container>
            <Grid item sx={{ flexGrow: 1 }}>
              <Link href="#" variant="body2">
                ¿Olvidaste tu contraseña?
              </Link>
            </Grid>
          </Grid>
        </Box>

        {/* ---- Panel de Overlay (El Animado) ---- */}
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '50%',
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            transition: 'transform 0.6s ease-in-out', 
            transform: isRegistering ? 'translateX(100%)' : 'translateX(0)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 4,
          }}
        >
          {isRegistering ? (
            // Contenido cuando está a la DERECHA (sobre el login)
            <>
              <Typography variant="h5" component="h1" gutterBottom>
                ¡Bienvenido de Nuevo!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Inicia sesión para continuar con tu aprendizaje.
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ borderColor: 'white', color: 'white' }}
                onClick={() => setIsRegistering(false)}
              >
                Iniciar Sesión
              </Button>
            </>
          ) : (
            // Contenido cuando está a la IZQUIERDA (sobre el registro)
            <>
              <Typography variant="h5" component="h1" gutterBottom>
                ¿Eres Nuevo Aquí?
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Regístrate con nosotros y comienza tu viaje.
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ borderColor: 'white', color: 'white' }}
                onClick={() => setIsRegistering(true)}
              >
                Crear Cuenta
              </Button>
            </>
          )}
        </Box>

      </Paper>
    </Box>
  );
}

export default LoginPage;