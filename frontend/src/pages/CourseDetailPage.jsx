// frontend/src/pages/CourseDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // <-- Hook para leer la URL
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
// Importa componentes de MUI
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Button
} from '@mui/material';

function CourseDetailPage() {
  // Estados: 'course' guardará el objeto del curso (con sus tareas)
  const [course, setCourse] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 1. Obtiene el 'id' de la URL
  // Si la URL es /courses/1, id valdrá "1"
  const { id } = useParams();
  const { user } = useAuth();
  useEffect(() => {
    // 2. Define la función para buscar los datos
    const fetchCourseDetail = async () => {
      try {
        setLoading(true);
        // Llama a la API usando el 'id' de la URL
        const response = await api.getCourseDetail(id); 
        setCourse(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetail();
  }, [id]); // El [id] significa: "vuelve a ejecutar esto si el id de la URL cambia"

  // --- Lógica de Renderizado (igual a HomePage) ---
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ padding: 4 }}><Typography color="error">Error al cargar el curso: {error}</Typography></Box>;
  }

  if (!course) {
    return <Typography>Curso no encontrado.</Typography>;
  }
  const isProfessor = user && 
                      user.role === 'PROFESSOR' && 
                      user.id === course.professor;

  // --- 3. Muestra los detalles del curso y las tareas ---
  return (
    <Box sx={{ padding: 4 }}>
      {/* Detalles del Curso */}
      <Typography variant="h3" gutterBottom>{course.title}</Typography>
      <Paper sx={{ padding: 3, marginBottom: 4 }}>
        <Typography variant="body1">{course.description}</Typography>
      </Paper>

      {/* --- Título de Tareas (Modificado) --- */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Tareas del Curso
        </Typography>
        
        {/* 5. Muestra el botón SOLO si 'isProfessor' es verdadero */}
        {isProfessor && (
          <Button variant="contained" color="primary">
            Añadir Tarea
          </Button>
        )}
      </Box>

      {/* --- Lista de Tareas (Sin cambios) --- */}
      <Paper sx={{ padding: 2 }}>
        <List>
          {course.tasks.length > 0 ? (
            course.tasks.map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem>
                  <ListItemText 
                    primary={task.title} 
                    secondary={`Fecha de entrega: ${new Date(task.due_date).toLocaleDateString()}`}
                  />
                </ListItem>
                {index < course.tasks.length - 1 && <Divider />}
              </React.Fragment>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No hay tareas asignadas para este curso." />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
}

export default CourseDetailPage;