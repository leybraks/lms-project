import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Link,
  TextField, // <-- NUEVO para Búsqueda
  InputAdornment // <-- NUEVO para Búsqueda
} from '@mui/material';

// --- Iconos ---
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SearchIcon from '@mui/icons-material/Search'; // <-- NUEVO para Búsqueda

// === VARIANTES DE ANIMACIÓN (Sin cambios) ===
const containerVariants = { /* ... */ };
const itemVariants = { /* ... */ };

// --- Función de Scrollbar (Sin cambios) ---
const getScrollbarStyles = (theme) => ({ /* ... */ });


function CourseCatalogPage() {
  const navigate = useNavigate();
  const theme = useTheme(); 
  
  // --- Estados Reales ---
  const [myCourses, setMyCourses] = useState([]);
  const [exploreCourses, setExploreCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NUEVOS ESTADOS para Búsqueda ---
  const [searchMyCourses, setSearchMyCourses] = useState("");
  const [searchExplore, setSearchExplore] = useState("");

  // --- Lógica de Carga (Sin cambios) ---
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [coursesResponse, enrollmentsResponse] = await Promise.all([
          axiosInstance.get('/api/courses/all/'),
          axiosInstance.get('/api/enrollments/my_enrollments/')
        ]);
        
        const allCourses = coursesResponse.data;
        const enrollments = enrollmentsResponse.data;
        
        const enrolledCourseIds = new Set(enrollments.map(e => e.course.id));
        
        const myCoursesFullData = allCourses.filter(course => enrolledCourseIds.has(course.id));
        const availableCourses = allCourses.filter(course => !enrolledCourseIds.has(course.id));
        
        setMyCourses(myCoursesFullData);
        setExploreCourses(availableCourses);

      } catch (err) {
        console.error("Error al cargar los cursos:", err);
        setError("No se pudieron cargar los cursos.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);
  
  // --- Lógica de Filtro ---
  const filteredMyCourses = myCourses.filter(course =>
    course.title.toLowerCase().includes(searchMyCourses.toLowerCase())
  );
  
  const filteredExploreCourses = exploreCourses.filter(course =>
    course.title.toLowerCase().includes(searchExplore.toLowerCase())
  );

  // --- RENDERING DE ESTADOS (Sin cambios) ---
  if (loading) { /* ... */ }
  if (error) { /* ... */ }

  // --- ¡¡¡COMPONENTE CourseCard ARREGLADO (con variant="outlined")!!! ---
  const CourseCard = ({ course }) => (
    <Grid item xs={12} sm={6} md={4} key={course.id}>
      <motion.div variants={itemVariants} style={{ height: '100%' }}>
        <CardActionArea 
          component={RouterLink} 
          to={`/courses/${course.id}`}
          sx={{ 
            height: '100%', 
            borderRadius: 4, 
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            display: 'flex',
            '&:hover': { 
              transform: 'translateY(-6px)',
              boxShadow: theme.shadows[10],
            }
          }}
        >
          {/* --- ¡¡¡AQUÍ ESTÁ EL ARREGLO!!! --- */}
          {/* variant="outlined" añade un borde que soluciona el bug fantasma */}
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              width: '100%', 
              borderRadius: 4,
            }}
            variant="outlined" // <-- ¡ARREGLO DEFINITIVO!
          >
            <CardMedia
              component="img"
              height="180"
              image={course.main_image_url || `https://source.unsplash.com/random/600x400?code,${course.id}`}
              alt={course.title}
            />
            
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {course.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {course.description}
              </Typography>
            </CardContent>
            
            <Box sx={{ p: 2, pt: 0, width: '100%' }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {course.professor && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Avatar 
                      sx={{ width: 28, height: 28, fontSize: '0.8rem' }}
                      src={`https://placehold.co/50/FF5733/FFFFFF?text=${course.professor.username[0]}`}
                    />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {course.professor.username}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', flexShrink: 0, ml: 1 }}>
                  <AutoStoriesIcon fontSize="small" />
                  <Typography variant="caption">{course.modules_count} Módulos</Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        </CardActionArea>
      </motion.div>
    </Grid>
  );

  // --- RENDERIZADO PRINCIPAL (Con filtros de búsqueda) ---
  return (
    <Box 
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ 
        height: '100%', 
        overflowY: 'auto', 
        p: 3, 
        boxSizing: 'border-box',
        ...getScrollbarStyles(theme)
      }}
    >
      
      {/* --- SECCIÓN HERO (Banner morado) --- */}
      <Box sx={{ mb: 5, p: {xs: 3, md: 5}, borderRadius: 4, background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`, color: 'primary.contrastText' }}>
        <motion.div variants={itemVariants}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, fontSize: {xs: '2.5rem', md: '3rem'} }}>
            Catálogo de Cursos
          </Typography>
          <Typography variant="h6" component="p" sx={{ opacity: 0.9, fontSize: {xs: '1rem', md: '1.25rem'} }}>
            Encuentra tu próxima gran habilidad. Explora nuestros cursos e inscríbete hoy.
          </Typography>
        </motion.div>
      </Box>

      {/* --- SECCIÓN 1: MIS CURSOS --- */}
      {myCourses.length > 0 && (
        <Box component="section" sx={{ mb: 5 }}>
          <motion.div variants={itemVariants}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Typography 
                variant="h4" 
                component="h2"
                gutterBottom
                sx={{ fontWeight: 700, mb: 0 }}
              >
                Mis Cursos
              </Typography>
              {/* --- NUEVO: Filtro para "Mis Cursos" --- */}
              <TextField 
                size="small"
                variant="outlined"
                placeholder="Buscar en mis cursos..."
                value={searchMyCourses}
                onChange={(e) => setSearchMyCourses(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </motion.div>
          
          <Grid 
            container 
            spacing={3}
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredMyCourses.length > 0 ? (
              filteredMyCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  {searchMyCourses ? 'No se encontraron cursos con ese nombre.' : 'No estás inscrito en ningún curso.'}
                </Alert>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* --- SECCIÓN 2: EXPLORA CURSOS --- */}
      <Box component="section">
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom
              sx={{ fontWeight: 700, mb: 0 }}
            >
              {myCourses.length > 0 ? "Explora Otros Cursos" : "Explora Nuestros Cursos"}
            </Typography>
            {/* --- NUEVO: Filtro para "Explorar Cursos" --- */}
            <TextField 
                size="small"
                variant="outlined"
                placeholder="Buscar en todos los cursos..."
                value={searchExplore}
                onChange={(e) => setSearchExplore(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
          </Box>
        </motion.div>

        <Grid 
          container 
          spacing={3}
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredExploreCourses.length > 0 ? (
            filteredExploreCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))
          ) : (
            <Grid item xs={12}>
              <motion.div variants={itemVariants}>
                <Alert severity="info">
                  {searchExplore ? 'No se encontraron cursos con ese nombre.' : (
                    myCourses.length > 0 ? 
                    "¡Genial! Ya estás inscrito en todos nuestros cursos disponibles." : 
                    "No hay cursos disponibles para explorar en este momento."
                  )}
                </Alert>
              </motion.div>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}

export default CourseCatalogPage;