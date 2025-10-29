// frontend/src/theme.js
import { createTheme } from '@mui/material/styles';

// Este es el "panel de control" de todo tu diseño.
export const theme = createTheme({
  palette: {
    mode: 'dark', // Mantenemos el modo oscuro
    
    // Define tu color primario (para botones, links, etc.)
    primary: {
      main: '#3f51b5', // Un azul índigo clásico
    },
    
    // Define tu color secundario
    secondary: {
      main: '#f50057', // Un rosa para acentos
    },
    
    // --- Esta es la parte clave ---
    // Define los colores de fondo
    background: {
      default: '#121212', // El fondo principal de la página (un negro suave)
      paper: '#1e1e1e', // El fondo de los componentes (Tarjetas, Menú, AppBar)
    },
    
    // Opcional: Ajustar el texto
    text: {
      primary: '#e0e0e0', // Un gris claro en lugar de blanco puro
      secondary: '#b0b0b0', // Para texto más suave
    },
  },
  
  // Opcional: Sobrescribir estilos de componentes
  components: {
    // Ejemplo: hacer que todas las 'Cards' tengan un borde
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #333', // Un borde sutil
        },
      },
    },
    // Ejemplo: hacer que el AppBar sea más oscuro
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e', // Mismo color que el 'paper'
          borderBottom: '1px solid #333',
        },
      },
    },
  },
});