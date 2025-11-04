// frontend/src/context/ThemeContext.jsx

import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline, useMediaQuery } from '@mui/material'; // <-- Importa useMediaQuery

// --- Definición de tus dos paletas (ajustadas para Image 1) ---

const lightPalette = {
  mode: 'light',
  primary: {
    main: '#6750A4', 
  },
  secondary: {
    main: '#448AFF',
  },
  background: {
    default: '#F4F7FE', 
    paper: '#FFFFFF', 
  },
  text: {
    primary: '#1C1B1F',
    secondary: '#6E717E',
  },
};

const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#A06EFE', // Un púrpura/violeta más brillante para dark mode (como en la Image 1)
  },
  secondary: {
    main: '#03DAC6', // Color de acento
  },
  background: {
    default: '#1A1C20', // Fondo de página (gris muy oscuro, casi negro) de la Image 1
    paper: '#272A2E', // Fondo de tarjetas y barra lateral (gris oscuro) de la Image 1
  },
  text: {
    primary: '#FFFFFF', // Texto blanco
    secondary: '#B0B0B0', // Texto gris suave
  },
};

// --- Definición de Componentes (compartido por ambos temas) ---
const sharedComponents = {
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none', // Sin sombra en AppBar
          borderBottom: 'none', // Sin borde en AppBar
          backgroundColor: 'transparent', // AppBar transparente, el layout se encargará del color
        },
      },
      defaultProps: {
        elevation: 0,
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          backgroundColor: 'background.paper', // Usa el color paper del tema
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Bordes más redondeados
          margin: '4px 12px', // Más margen
          '&.Mui-selected': { 
            backgroundColor: 'rgba(160, 110, 254, 0.15)', // Fondo claro del primary en dark mode
            color: 'primary.main',
            '& .MuiListItemIcon-root': {
              color: 'primary.main',
            },
            // Sombra para el elemento seleccionado (opcional, como un resplandor)
            boxShadow: '0 0 8px rgba(160, 110, 254, 0.2)' 
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)', // Hover sutil en dark mode
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Bordes redondeados como en Image 1
          textTransform: 'none',
          fontWeight: 600,
        },
      },
      defaultProps: {
        disableElevation: true,
      }
    },
    MuiPaper: { // Global Paper styling for cards
      styleOverrides: {
        root: {
          borderRadius: 20, // Más redondeado para todas las tarjetas
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)', // Sombra más pronunciada para "flotar"
        },
      },
    },
    MuiOutlinedInput: { // Estilo para campos de texto con borde
      styleOverrides: {
        root: {
          borderRadius: 12, // Bordes redondeados para inputs
        },
      },
    },
    MuiInputBase: { // Base para todos los inputs
      styleOverrides: {
        input: {
          '&::placeholder': { // Estilo del placeholder
            color: 'text.secondary',
            opacity: 1,
          },
        },
      },
    },
    MuiLinearProgress: { // Para la barra de progreso
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.1)' // Fondo de la barra en dark mode
        },
        bar: {
          borderRadius: 8,
          backgroundColor: 'primary.main',
        }
      }
    }
  },
};

const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export function ToggleColorModeProvider({ children }) {
  // Detecta la preferencia del sistema
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(prefersDarkMode ? 'dark' : 'light'); // <-- Usa la preferencia del sistema

  useEffect(() => {
    setMode(prefersDarkMode ? 'dark' : 'light');
  }, [prefersDarkMode]); // <-- Actualiza si la preferencia del sistema cambia

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(() => {
    const palette = mode === 'light' ? lightPalette : darkPalette;
    
    return createTheme({
      ...sharedComponents,
      palette: palette,
      typography: { // Tipografía personalizada (similar a la Image 1)
        fontFamily: 'Poppins, sans-serif', // Una fuente moderna y legible
        h1: { fontSize: '2.5rem', fontWeight: 700 },
        h2: { fontSize: '2rem', fontWeight: 700 },
        h3: { fontSize: '1.75rem', fontWeight: 600 },
        h4: { fontSize: '1.5rem', fontWeight: 600 },
        h5: { fontSize: '1.25rem', fontWeight: 600 },
        h6: { fontSize: '1rem', fontWeight: 600 },
        body1: { fontSize: '0.95rem', fontWeight: 400 },
        body2: { fontSize: '0.85rem', fontWeight: 400 },
        button: { fontSize: '0.9rem', fontWeight: 600 },
      },
    });
  }, [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline /> 
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);