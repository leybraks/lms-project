// src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PrivateRoute from './components/PrivateRoute'; // <-- 1. Importa la ruta
import MainLayout from './components/MainLayout';
import CourseDetailPage from './pages/CourseDetailPage';

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* RUTA PROTEGIDA (USANDO PrivateRoute) */}
      <Route element={<PrivateRoute />}>
          {/* CORRECCIÓN 3: Cambiar '<Layout />' por '<MainLayout />' */}
          <Route element={<MainLayout />}> 
              <Route path="/" element={<HomePage />} />
              <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          </Route>
      </Route>
      
      {/* Captura rutas no definidas */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;