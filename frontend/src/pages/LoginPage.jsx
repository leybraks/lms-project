// frontend/src/pages/LoginPage.jsx
import axios from 'axios';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';
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
  Grid,
  InputAdornment, 
  IconButton,
} from '@mui/material';

// Iconos
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Lock from '@mui/icons-material/Lock'; 
import EmailIcon from '@mui/icons-material/Email';

// Iconos de Redes Sociales
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';


function LoginPage() {
  // --- Estados (sin cambios) ---
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);

  const { login } = useAuth(); 
  const navigate = useNavigate(); // <-- AÑADIMOS useNavigate

  // --- Handlers (MODIFICADOS) ---

  /**
   * ESTA ES LA FUNCIÓN DE LOGIN MODIFICADA
   */
  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError(null);

    try { 
      // 1. LOGIN DIRECTO A RAILWAY (Sin usar axiosInstance ni AuthContext por ahora)
      const res = await axios.post('https://lms-project-production-39d6.up.railway.app/api/auth/login/', { 
          username: loginUsername, 
          password: loginPassword 
      });
      
      // 2. Guardar los tokens manualmente en el navegador
      localStorage.setItem('accessToken', res.data.access);
      if(res.data.refresh) localStorage.setItem('refreshToken', res.data.refresh);
      
      // 3. Redirigir a la fuerza al Dashboard
      // Usamos window.location para que la página se recargue y el AuthContext lea el token nuevo
      window.location.href = '/'; 

    } catch (err) {
      console.error("Error en el login:", err);
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  /**
   * ESTA ES LA FUNCIÓN DE REGISTRO MODIFICADA
   */
  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(false);

    // 1. Validar contraseñas
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const userData = {
        username: registerUsername,
        email: registerEmail,
        password1: registerPassword,
        password2: registerConfirmPassword
      };

      // --- CAMBIO CLAVE: URL COMPLETA A RAILWAY ---
      await axios.post('https://lms-project-production-39d6.up.railway.app/api/auth/registration/', userData);
      // --------------------------------------------
      
      setRegisterSuccess(true);
      setRegisterError(null);
      
      // Limpiar campos
      setRegisterUsername('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');

      // Volver al login
      setIsRegistering(false); 

    } catch (err) {
      console.error("Error detallado:", err);
      setRegisterSuccess(false); // Aseguramos resetear éxito

      if (err.response) {
          // Si el servidor respondió (ej: error 500 por correo)
          if (err.response.status === 500) {
              setRegisterError("Error del servidor: No se pudo enviar el correo. Intenta de nuevo.");
          } else if (err.response.data) {
              // Errores de validación (usuario ya existe, contraseña corta, etc)
              const data = err.response.data;
              if (data.username) setRegisterError(data.username[0]);
              else if (data.email) setRegisterError(data.email[0]);
              else setRegisterError("Error en los datos de registro.");
          }
      } else {
          setRegisterError("Error de conexión. Revisa tu internet.");
      }
    }
  };

  // --- Contenido del Overlay (sin cambios) ---
  const registerOverlayContent = (
    <>
      <Typography variant="h5" component="h1" gutterBottom sx={{ color: 'black', fontWeight: 'bold' }}>
        ¿Eres Nuevo Aquí?
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: 'black' }}>
        Regístrate con nosotros y comienza tu viaje.
      </Typography>
      <Button 
        variant="outlined" 
        sx={{ 
          borderColor: 'black',
          color: 'black',
          fontWeight: 'bold',
          '&:hover': {
             borderColor: 'black',
             backgroundColor: 'rgba(0, 0, 0, 0.08)'
          }
        }}
        onClick={() => setIsRegistering(true)}
      >
        Crear Cuenta
      </Button>
    </>
  );

  const loginOverlayContent = (
    <>
      <Typography variant="h5" component="h1" gutterBottom sx={{ color: 'black', fontWeight: 'bold' }}>
        ¡Bienvenido de Nuevo!
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: 'black' }}>
        Inicia sesión para continuar con tu aprendizaje.
      </Typography>
      <Button 
        variant="outlined" 
        sx={{ 
          borderColor: 'black',
          color: 'black',
          fontWeight: 'bold',
          '&:hover': {
             borderColor: 'black',
             backgroundColor: 'rgba(0, 0, 0, 0.08)'
          }
        }}
        onClick={() => setIsRegistering(false)}
      >
        Iniciar Sesión
      </Button>
    </>
  );

  // --- Variables de la Animación (sin cambios) ---
  const numberOfCascadeParts = 5; 
  const cascadeDelay = 0.1; 
  const centerPanel = Math.floor(numberOfCascadeParts / 2);

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
    }}>
      
      <Paper 
        elevation={0} 
        square 
        sx={{ 
          height: '100vh', 
          width: '100vw', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          overflow: 'hidden', 
          position: 'relative', 
        }}
      >
        {/* ---- Panel de Registro (Izquierda) ---- */}
        {/* ... (Todo este panel está SIN CAMBIOS) ... */}
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
          <Box sx={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
            
            <Typography component="h1" variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
              Regístrate
            </Typography>
            
            {registerError && <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 0 }}>{registerError}</Alert>}
            {registerSuccess && <Alert severity="success" sx={{ width: '100%', mt: 2, mb: 0 }}>¡Registro exitoso! Por favor, verifica tu email e inicia sesión.</Alert>}
            
            <TextField
              margin="normal"
              required
              fullWidth
              placeholder="Usuario"
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              sx={{ 
                borderRadius: '8px', 
                backgroundColor: '#2b2b2b', 
                '.MuiOutlinedInput-notchedOutline': { border: 'none' }, 
                '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                input: { color: 'white', py: '12px' }, 
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle sx={{ color: 'gray' }} /> 
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              placeholder="Email"
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              sx={{ 
                borderRadius: '8px', 
                backgroundColor: '#2b2b2b', 
                '.MuiOutlinedInput-notchedOutline': { border: 'none' }, 
                '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                input: { color: 'white', py: '12px' }, 
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'gray' }} /> 
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              placeholder="Nueva contraseña"
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              sx={{ 
                borderRadius: '8px', 
                backgroundColor: '#2b2b2b', 
                '.MuiOutlinedInput-notchedOutline': { border: 'none' }, 
                '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                input: { color: 'white', py: '12px' }, 
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'gray' }} /> 
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              placeholder="Repetir contraseña"
              type="password"
              value={registerConfirmPassword}
              onChange={(e) => setRegisterConfirmPassword(e.target.value)}
              sx={{ 
                borderRadius: '8px', 
                backgroundColor: '#2b2b2b', 
                '.MuiOutlinedInput-notchedOutline': { border: 'none' }, 
                '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                input: { color: 'white', py: '12px' }, 
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'gray' }} /> 
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5, 
                backgroundColor: '#ffe500', 
                color: 'black', 
                fontWeight: 'bold', 
                borderRadius: '8px', 
                '&:hover': {
                  backgroundColor: '#ffda00', 
                },
              }}
            >
              REGISTRARSE
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, mb: 2 }}>
              O regístrate con redes sociales
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <IconButton sx={{ backgroundColor: '#2b2b2b', '&:hover': { backgroundColor: '#3a3a3a' } }}>
                <GoogleIcon sx={{ color: 'white' }} />
              </IconButton>
              <IconButton sx={{ backgroundColor: '#2b2b2b', '&:hover': { backgroundColor: '#3a3a3a' } }}>
                <GitHubIcon sx={{ color: 'white' }} />
              </IconButton>
              <IconButton sx={{ backgroundColor: '#2b2b2b', '&:hover': { backgroundColor: '#3a3a3a' } }}>
                <XIcon sx={{ color: 'white' }} />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* ---- Panel de Login (Derecha) ---- */}
        {/* ... (Todo este panel está SIN CAMBIOS) ... */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            p: 4,
            backgroundColor: 'background.paper', 
          }}
        >
          <Box component="form" onSubmit={handleLoginSubmit} sx={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                mb: 4, 
                fontWeight: 'bold' 
              }}
            >
              Iniciar sesión
            </Typography>
            {loginError && <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 0 }}>{loginError}</Alert>}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="loginUsername"
              name="loginUsername"
              autoComplete="username"
              autoFocus
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Usuario"
              sx={{ 
                borderRadius: '8px', 
                backgroundColor: '#2b2b2b', 
                '.MuiOutlinedInput-notchedOutline': { border: 'none' }, 
                '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                input: { color: 'white', py: '12px' }, 
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle sx={{ color: 'gray' }} /> 
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="loginPassword"
              type="password"
              id="loginPassword"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Contraseña"
              sx={{ 
                borderRadius: '8px', 
                backgroundColor: '#2b2b2b',
                '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                input: { color: 'white', py: '12px' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'gray' }} /> 
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 4, 
                mb: 3, 
                py: 1.5, 
                backgroundColor: '#ffe500', 
                color: 'black', 
                fontWeight: 'bold', 
                borderRadius: '8px', 
                '&:hover': {
                  backgroundColor: '#ffda00', 
                },
              }}
            >
              INICIAR
            </Button>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, mb: 2 }}>
              O inicia sesión con redes sociales
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <IconButton sx={{ backgroundColor: '#2b2b2b', '&:hover': { backgroundColor: '#3a3a3a' } }}>
                <FacebookIcon sx={{ color: 'white' }} />
              </IconButton>
              <IconButton sx={{ backgroundColor: '#2b2b2b', '&:hover': { backgroundColor: '#3a3a3a' } }}>
                <TwitterIcon sx={{ color: 'white' }} />
              </IconButton>
              <IconButton sx={{ backgroundColor: '#2b2b2b', '&:hover': { backgroundColor: '#3a3a3a' } }}>
                <GoogleIcon sx={{ color: 'white' }} />
              </IconButton>
              <IconButton sx={{ backgroundColor: '#2b2b2b', '&:hover': { backgroundColor: '#3a3a3a' } }}>
                <LinkedInIcon sx={{ color: 'white' }} />
              </IconButton>
            </Box>

          </Box>
        </Box>

        {/* ---- Paneles de Overlay (SIN CAMBIOS) ---- */}
        {Array.from({ length: numberOfCascadeParts }).map((_, index) => (
          <Box 
            key={index}
            sx={{
              position: 'absolute',
              height: `${100 / numberOfCascadeParts}%`, 
              width: '50%',
              backgroundColor: '#ffe500', 
              transition: 'left 0.7s cubic-bezier(0.86, 0, 0.07, 1)', 
              transitionDelay: `${index * cascadeDelay}s`, 
              left: isRegistering ? '50%' : '0%', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              p: 4,
              top: `${(100 / numberOfCascadeParts) * index}%`, 
              zIndex: 10,
              borderBottom: 'none', 
            }}
          >
            {index === centerPanel && (
              isRegistering ? loginOverlayContent : registerOverlayContent
            )}
          </Box>
        ))}

      </Paper>
    </Box>
  );
}

export default LoginPage;