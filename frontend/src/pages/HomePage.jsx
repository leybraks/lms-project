// frontend/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios'; 
import { useNavigate } from 'react-router-dom';

// Importación de Framer Motion para animaciones
import { motion } from 'framer-motion';

import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Divider,
  Skeleton // <-- ¡Importación Correcta!
} from '@mui/material';

// Iconos
import SchoolIcon from '@mui/icons-material/School';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

// --- DEFINICIÓN DE ANIMACIONES ---

// Animación del contenedor (efecto cascada)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Espera 0.1 segundos entre la aparición de cada tarjeta
    },
  },
};

// Animación de cada ítem (la tarjeta)
const itemVariants = {
  hidden: { opacity: 0, y: 20 }, // Empieza invisible y 20px abajo
  show: { opacity: 1, y: 0 },    // Termina visible en su posición
};


function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/courses/'); 
        setCourses(response.data); 
      } catch (err) {
        console.error("Error al cargar cursos:", err);
        if (err.response && err.response.status === 404) {
             setError("La URL de la API de cursos no se encontró (404).");
        } else if (err.response && err.response.status === 401) {
             localStorage.removeItem('accessToken');
             localStorage.removeItem('refreshToken');
             navigate('/login');
        } else {
             setError("No se pudieron cargar los cursos.");
        }
      } finally {
        setLoading(false); 
      }
    };
    fetchCourses();
  }, [navigate]); 

  // --- RENDERING DE ESTADOS ---

  if (loading) {
    // Esqueleto de Contenido (Skeleton)
    return (
      <Box sx={{ padding: 4, flexGrow: 1 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 4 }}>
          Explorar Cursos
        </Typography>
        <Grid container spacing={4}>
          {[...Array(6)].map((_, index) => ( // Renderiza 6 esqueletos
            <Grid key={index} grid={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Error: {error}</Alert>
      </Box>
    );
  }
  
  if (courses.length === 0) {
      return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="text.secondary">
                  No hay cursos disponibles en este momento. 😞
              </Typography>
          </Box>
      );
  }

  // --- ESTRUCTURA PRINCIPAL Y DISEÑO DE TARJETAS MODERNAS CON ANIMACIÓN ---
  return (
    <Box sx={{ padding: 4, flexGrow: 1 }}> 
      
      {/* HEADER DE LA PÁGINA */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="large" />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Explorar Cursos
        </Typography>
      </Box>
      <Divider sx={{ mb: 4 }}/>
      
      {/* CONTENEDOR DE CURSOS (GRID con Framer Motion) */}
      <Grid 
        container 
        spacing={4}
        // Aplica las animaciones al contenedor principal de la cuadrícula
        component={motion.div}
        variants={containerVariants}
        initial="hidden" // Estado inicial antes de cargar
        animate="show"  // Estado final después de cargar (activa el stagger)
      >
        
        {courses.map((course) => (
          
          <Grid 
            key={course.id} 
            grid={{ xs: 12, sm: 6, md: 4 }}// Usamos 'item' y las props de breakpoints
            // Aplica la animación individual a cada tarjeta
            component={motion.div} 
            variants={itemVariants} 
          >
            
            {/* INICIO DEL DISEÑO DE TARJETA ESTILO DASHBOARD */}
            <Card 
                variant="outlined" 
                sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, border-color 0.2s',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: 'primary.main',
                    }
                }}
            >
                <CardContent sx={{ flexGrow: 1 }}>
                    <AutoStoriesIcon color="primary" sx={{ mb: 1.5 }} fontSize="medium" />
                    
                    {/* TÍTULO */}
                    <Typography 
                        variant="h6" 
                        component="h2" 
                        gutterBottom
                        sx={{ fontWeight: 500 }}
                    >
                        {course.title}
                    </Typography>
                    
                    {/* DESCRIPCIÓN */}
                    <Typography variant="body2" color="text.secondary">
                        {course.description.length > 100 ? 
                            course.description.substring(0, 100) + '...' : 
                            course.description
                        }
                    </Typography>
                </CardContent>
                
                {/* ACCIONES (BOTÓN ABAJO) */}
                <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                    <Button
                        size="small"
                        color="primary"
                        variant="text"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(`/courses/${course.id}`)}
                    >
                        Ver Detalles
                    </Button>
                </CardActions>
            </Card>
            {/* FIN DEL DISEÑO DE TARJETA ESTILO DASHBOARD */}
          
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default HomePage;