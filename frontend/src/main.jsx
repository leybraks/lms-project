// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // Tu AuthProvider
// 1. Importa nuestro nuevo proveedor de Tema
import { ToggleColorModeProvider } from './context/ThemeContext.jsx'; 
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
// 2. Ya NO importamos el 'theme.js' antiguo

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 3. Envuelve TODO con el proveedor de Tema */}
      <ToggleColorModeProvider>
        {/* AuthProvider va DENTRO del de Tema */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToggleColorModeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);