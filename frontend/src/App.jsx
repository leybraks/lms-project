// frontend/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonPage from './pages/LessonPage';
import QuizPage from './pages/QuizPage'; // <-- 1. ¡IMPORTA LA NUEVA PÁGINA!
import PrivateRoute from './components/PrivateRoute'; 
import MainLayout from './components/MainLayout'; 
import InboxPage from './pages/InboxPage';
import CourseCatalogPage from './pages/CourseCatalogPage';
import GradebookPage from './pages/GradebookPage';

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
              <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonPage />} /> 
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/courses" element={<CourseCatalogPage />} />
              <Route path="/courses/:courseId/grades" element={<GradebookPage />} />
              {/* 2. ¡AÑADE LA NUEVA RUTA DEL EXAMEN! */}
              <Route 
                path="/courses/:courseId/modules/:moduleId/quiz" 
                element={<QuizPage />} 
              />
              
          </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;