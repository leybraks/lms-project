// frontend/src/theme.js

import { createTheme } from '@mui/material/styles';

// Definición del color púrpura moderno para dark mode
const PURPLE_ACCENT = '#BB86FC';
const TEAL_ACCENT = '#03DAC6';

export const theme = createTheme({
  palette: {
    mode: 'dark', 
    
    // 1. Color Primario: Cambiado a púrpura para contraste moderno
    primary: {
      main: PURPLE_ACCENT, 
    },
    
    // 2. Color Secundario: Verde azulado, excelente acento en dark mode
    secondary: {
      main: TEAL_ACCENT, 
    },
    
    // 3. Colores de Fondo: Negros profundos para el look de dashboard
    background: {
      default: '#121212', 
      paper: '#1e1e1e', // Para Cards, Drawer y AppBar
    },
    
    // 4. Texto: Gris claro y gris suave
    text: {
      primary: '#e0e0e0',
      secondary: '#b0b0b0', 
    },
    
    // Opcional: Ajuste de colores de acción (botones, hover)
    action: {
        active: PURPLE_ACCENT, // Color activo
        hover: 'rgba(187, 134, 252, 0.08)', // Hover sutil en la barra lateral
    }
  },
  
  // 5. Sobrescribir estilos de componentes (Máximo Contraste y Esquinas Redondeadas)
  components: {
    // Tarjetas de Curso (MuiCard)
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #333',
          borderRadius: 8, // Bordes redondeados sutiles
        },
      },
    },
    
    // Barra Superior (MuiAppBar)
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e', 
          borderBottom: '1px solid #333',
          boxShadow: 'none', // Quitamos la sombra para un look plano
        },
      },
    },

    // Componentes de Lista/Menú (MuiListItemButton)
    MuiListItemButton: {
        styleOverrides: {
            root: {
                borderRadius: 6, // Bordes redondeados para los ítems del menú
                marginBottom: 4,
                '&.Mui-selected': {
                    backgroundColor: 'rgba(187, 134, 252, 0.15)', // Fondo claro de Primary al seleccionar
                },
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Hover suave
                },
            },
        },
    },
    
    // Botones de Enfoque (Para un look más limpio)
    MuiButton: {
        defaultProps: {
            disableElevation: true, // Quitamos la sombra por defecto
        },
        styleOverrides: {
            root: {
                textTransform: 'none',
                borderRadius: 8, // Bordes redondeados
            }
        }
    }
  },
});