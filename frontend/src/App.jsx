// frontend/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonPage from './pages/LessonPage'; // <-- 1. ASEGÚRATE DE IMPORTAR LA PÁGINA
import PrivateRoute from './components/PrivateRoute'; 
import MainLayout from './components/MainLayout'; 

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rutas Protegidas */}
      <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}> 
              <Route path="/" element={<HomePage />} />
              <Route path="/courses/:courseId" element={<CourseDetailPage />} />
              
              {/* 2. ASEGÚRATE DE QUE ESTA RUTA EXISTA */}
              <Route 
                path="/courses/:courseId/lessons/:lessonId" 
                element={<LessonPage />} 
              />
              
          </Route>
      </Route>
      
      {/* 3. La ruta "Catch-all" que te redirige */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;