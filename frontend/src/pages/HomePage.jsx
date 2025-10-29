// frontend/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

// --- ¡Nuevas importaciones de MUI! ---
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid'; // Para la cuadrícula
import Card from '@mui/material/Card'; // La tarjeta
import CardContent from '@mui/material/CardContent'; // Contenido de la tarjeta
import CardActionArea from '@mui/material/CardActionArea'; // Para hacerla clickeable

function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await api.getCourses(); 
        setCourses(response.data); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false); 
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 4 }}>
        <Typography color="error">Error al cargar cursos: {error}</Typography>
      </Box>
    );
  }

  // --- HTML MODIFICADO ---
  return (
    // 'Box' es como un 'div', 'sx' es para estilos
    <Box sx={{ padding: 4, flexGrow: 1 }}> 
      <Typography variant="h4" gutterBottom component="h1">
        Cursos Disponibles
      </Typography>
      
      {/* 'Grid container' es el 'row' de Bootstrap */}
      {/* 'spacing={3}' añade espacio entre las tarjetas */}
      <Grid container spacing={3}>
        
        {/* Mapeamos los cursos igual que antes */}
        {courses.map((course) => (
          
          // 'Grid item' es la columna
          // 'xs={12}' = 1 columna en móvil
          // 'sm={6}' = 2 columnas en tablet
          // 'md={4}' = 3 columnas en desktop
          <Grid item key={course.id} xs={12} sm={6} md={4}>
            
            {/* Esta es la tarjeta clickeable */}
            <CardActionArea component="a" href={`/courses/${course.id}`}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  
                  <Typography gutterBottom variant="h5" component="h2">
                    {course.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {course.description}
                  </Typography>

                </CardContent>
              </Card>
            </CardActionArea>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default HomePage;