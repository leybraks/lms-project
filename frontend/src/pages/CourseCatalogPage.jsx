import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";

// --- NUEVOS Componentes MUI para UX ---
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
  TextField,
  InputAdornment,
  Container, // Usaremos Container para centrar
  Tabs,       // <-- Pestañas
  Tab,        // <-- Pestaña
  Paper,      // <-- Contenedor de controles
  Select,     // <-- Menú para Ordenar
  MenuItem,   // <-- Opción del Menú
  FormControl,
  InputLabel,
  Button,     // <-- Botón de Filtros
  Drawer,     // <-- Panel de Filtros
  IconButton, // <-- Botón para cerrar Drawer
  List,
  ListItem,
  ListItemText,
  Checkbox,   // <-- Checkbox de Filtro
  Rating,     // <-- Filtro de Estrellas
  LinearProgress, // <-- Progreso del Curso
  FormGroup,
  FormControlLabel
} from '@mui/material';

// --- NUEVOS Iconos ---
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList'; // <-- Icono de Filtros
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School'; // Icono para Hero

// === VARIANTES DE ANIMACIÓN (Sin cambios) ===
// === VARIANTES DE ANIMACIÓN (¡Con "Bounce"!) ===
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      // Damos un poco más de tiempo entre elementos
      // para que el rebote de cada uno sea más notorio.
      staggerChildren: 0.1 
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 50 // Empezamos un poco más abajo (50) para que el "salto" sea más visible
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      // ¡AQUÍ ESTÁ LA MAGIA!
      type: "spring", // Usamos una física de resorte
      bounce: 0.4,    // Nivel de rebote (0 = nada, 1 = mucho)
      duration: 0.8   // Duración de la animación
    }
  }
};

// --- Función de Scrollbar (Sin cambios) ---
const getScrollbarStyles = (theme) => ({
  scrollbarWidth: 'thin',
  scrollbarColor: `${theme.palette.primary.main} ${theme.palette.background.paper}`,
  '&::-webkit-scrollbar': { width: '8px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent', borderRadius: '10px' },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: '10px',
    border: `2px solid ${theme.palette.background.default}`,
    backgroundClip: 'content-box',
  },
  '&::-webkit-scrollbar-thumb:hover': { backgroundColor: theme.palette.primary.dark }
});

// === NUEVO: Componente Tarjeta de Curso (Mejorado) ===
// Ahora acepta una prop 'progress' para mostrar la barra de progreso
const CourseCard = ({ course, progress }) => {
  const theme = useTheme();
  
  return (
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
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              width: '100%', 
              borderRadius: 4,
            }}
            variant="outlined"
          >
            <CardMedia
              component="img"
              height="180"
              image={course.main_image_url || `https://source.unsplash.com/random/600x400?code,${course.id}`}
              alt={course.title}
            />
            
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
              <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {course.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ minHeight: '40px' }}>
                {/* Truncamos la descripción para que no ocupe mucho */}
                {course.description.substring(0, 100)}{course.description.length > 100 ? '...' : ''}
              </Typography>
            </CardContent>
            
            {/* --- NUEVO: Barra de Progreso --- */}
            {/* Solo se muestra si pasamos la prop 'progress' (para "Mis Cursos") */}
            {progress !== undefined && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Progreso: {progress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                />
              </Box>
            )}
            
            {/* Pie de la tarjeta */}
            <Box sx={{ p: 2, pt: 1, width: '100%' }}>
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
};

// === NUEVO: Panel de Pestañas (Helper) ===
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// === PÁGINA PRINCIPAL ===
function CourseCatalogPage() {
  const theme = useTheme(); 
  
  // --- Estados de Datos (Sin cambios) ---
  const [myCourses, setMyCourses] = useState([]);
  const [exploreCourses, setExploreCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NUEVOS ESTADOS DE UX ---
  const [activeTab, setActiveTab] = useState(0); // 0 = Mis Cursos, 1 = Explorar
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular"); // 'popular', 'newest', 'rating'
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  
  // Estados para los filtros (visuales por ahora)
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterDifficulty, setFilterDifficulty] = useState([]);
  const [filterRating, setFilterRating] = useState(0);

  // --- Lógica de Carga (Sin cambios) ---
// frontend/src/pages/CourseCatalogPage.jsx

  // --- Lógica de Carga (¡ACTUALIZADA!) ---
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
        
        // --- ¡NUEVA LÓGICA DE PROGRESO! ---
        
        // 1. Crear un Mapa de Progreso desde las inscripciones
        //    (Esto es mucho más rápido que buscar en el array cada vez)
        //    Ej: progressMap = { 1: { completed: 5, total: 10 }, 3: { completed: 1, total: 8 } }
        const progressMap = {};
        for (const enrollment of enrollments) {
          progressMap[enrollment.course.id] = {
            completed: enrollment.lessons_completed_count,
            total: enrollment.total_lessons_count
          };
        }

        // 2. Crear un Set de IDs (como ya lo tenías)
        const enrolledCourseIds = new Set(enrollments.map(e => e.course.id));
        
        // 3. Construir "Mis Cursos" USANDO el Mapa de Progreso
        const myCoursesFullData = allCourses
          .filter(course => enrolledCourseIds.has(course.id))
          .map(course => {
            const progressData = progressMap[course.id];
            let progressPercent = 0;
            
            // Calcular el porcentaje (evitando división por cero)
            if (progressData && progressData.total > 0) {
              progressPercent = Math.round((progressData.completed / progressData.total) * 100);
            }
            
            return {
              ...course,
              progress: progressPercent // <-- ¡DATO REAL!
            };
          });
          
        const availableCourses = allCourses.filter(course => !enrolledCourseIds.has(course.id));
        
        setMyCourses(myCoursesFullData);
        setExploreCourses(availableCourses);

        // Si el usuario no tiene cursos, llévalo a "Explorar"
        if (myCoursesFullData.length === 0) {
          setActiveTab(1);
        }

      } catch (err) {
        console.error("Error al cargar los cursos:", err);
        setError("No se pudieron cargar los cursos.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []); // El array vacío [] asegura que se ejecute solo una vez
  
  // --- Lógica de Filtro (Mejorada con useMemo) ---
  // Esto recalcula los cursos a mostrar SOLO si las dependencias cambian
  const coursesToDisplay = useMemo(() => {
    const source = activeTab === 0 ? myCourses : exploreCourses;
    
    // Por ahora, solo filtramos por búsqueda (searchTerm)
    // En el futuro, aquí se aplicaría la lógica de filterCategories, filterDifficulty, etc.
    return source.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // La lógica de 'sortBy' también se aplicaría aquí
    // .sort(...)

  }, [activeTab, myCourses, exploreCourses, searchTerm, sortBy, filterCategories, filterDifficulty]);


  // --- Handlers de UI ---
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm(""); // Resetea la búsqueda al cambiar de pestaña
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  // === RENDERING DE ESTADOS (Sin cambios) ===
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Alert severity="error">{error}</Alert></Box>;
  }

  // === RENDERIZADO PRINCIPAL (Rediseñado) ===
  return (
    <Box 
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ 
        height: '100%', 
        overflowY: 'auto', 
        boxSizing: 'border-box',
        ...getScrollbarStyles(theme)
      }}
    >
      
      {/* --- 1. SECCIÓN HERO (Más simple) --- */}
      {/* --- 1. SECCIÓN HERO (Corregida para estar contenida) --- */}
      <Box sx={{ 
        mb: 4, 
        mt: 4,
        // Vaciamos el Box exterior. 
        // Solo da el margen inferior para separar el hero del contenido.
      }}>
        
        {/* === CAMBIO === */}
        {/* Movimos todos los estilos al Container. */}
        {/* El Container SÍ respeta el 'maxWidth' y se centra. */}
        <Container 
          maxWidth="xl" 
          sx={{ 
            // --- ESTILOS MOVIDOS AQUÍ ---
            p: {xs: 4, md: 6}, // <--- Este es tu PADDING INTERNO
            borderRadius: { xs: 2, md: 4 }, // Tus bordes redondeados
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`, 
            color: 'primary.contrastText' 
            // --- FIN DE ESTILOS MOVIDOS ---
          }}
        >
          <motion.div variants={itemVariants}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <SchoolIcon sx={{ fontSize: {xs: '2.5rem', md: '3rem'} }} />
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: {xs: '2.5rem', md: '3rem'} }}>
                Catálogo de Cursos
              </Typography>
            </Box>
            <Typography variant="h6" component="p" sx={{ opacity: 0.9, fontSize: {xs: '1rem', md: '1.25rem'} }}>
              Tu viaje de aprendizaje empieza aquí.
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* --- 2. CONTENIDO PRINCIPAL (con Pestañas y Controles) --- */}
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        
        {/* --- PESTAÑAS (Tabs) --- */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="pestañas de cursos">
            <Tab label="Mis Cursos" id="course-tab-0" disabled={myCourses.length === 0} />
            <Tab label="Explorar Cursos" id="course-tab-1" />
          </Tabs>
        </Box>

        {/* --- BARRA DE CONTROL (Búsqueda, Orden, Filtros) --- */}
        <Paper 
          component={motion.div}
          variants={itemVariants}
          elevation={0}
          variant="outlined"
          sx={{ 
            p: 2, 
            mt: 3, 
            mb: 3, 
            display: 'flex', 
            flexWrap: 'wrap', // Permite que se apilen en móvil
            gap: 2, 
            alignItems: 'center',
            borderRadius: 3
          }}
        >
          {/* 1. Búsqueda */}
          <TextField 
            size="small"
            variant="outlined"
            placeholder={activeTab === 0 ? "Buscar en mis cursos..." : "Buscar todos los cursos..."}
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, minWidth: '250px' }} // Crece para ocupar espacio
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {/* 2. Ordenar Por */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="sort-by-label">Ordenar por</InputLabel>
            <Select
              labelId="sort-by-label"
              id="sort-by-select"
              value={sortBy}
              label="Ordenar por"
              onChange={handleSortChange}
            >
              <MenuItem value="popular">Más Populares</MenuItem>
              <MenuItem value="newest">Más Nuevos</MenuItem>
              <MenuItem value="rating">Mejor Valorados</MenuItem>
            </Select>
          </FormControl>
          {/* 3. Botón de Filtros */}
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FilterListIcon />}
            onClick={() => setIsFilterDrawerOpen(true)}
          >
            Filtros
          </Button>
        </Paper>

        {/* --- 3. CONTENIDO DE PESTAÑAS --- */}
        
        {/* --- Panel "Mis Cursos" --- */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
            {coursesToDisplay.length > 0 ? (
              coursesToDisplay.map((course) => (
                // Pasamos la prop 'progress'
                <CourseCard key={course.id} course={course} progress={course.progress} />
              ))
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  {searchTerm ? 'No se encontraron cursos con ese nombre.' : 'No estás inscrito en ningún curso.'}
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* --- Panel "Explorar Cursos" --- */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
            {coursesToDisplay.length > 0 ? (
              coursesToDisplay.map((course) => (
                // No pasamos 'progress'
                <CourseCard key={course.id} course={course} />
              ))
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  {searchTerm ? 'No se encontraron cursos con ese nombre.' : 'No hay cursos disponibles para explorar en este momento.'}
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

      </Container>
      
      {/* --- NUEVO: Panel de Filtros (Drawer) --- */}
      {/* Este es el panel que se abre al pulsar el botón "Filtros" */}
      <Drawer
        anchor="right"
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Filtros</Typography>
            <IconButton onClick={() => setIsFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          
          {/* Grupo de Filtro: Categoría (Mock) */}
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Categoría</Typography>
            <FormGroup>
              <FormControlLabel control={<Checkbox size="small" />} label="Programación" />
              <FormControlLabel control={<Checkbox size="small" />} label="Diseño UX/UI" />
              <FormControlLabel control={<Checkbox size="small" />} label="Marketing Digital" />
              <FormControlLabel control={<Checkbox size="small" />} label="Negocios" />
            </FormGroup>
          </Box>
          <Divider />

          {/* Grupo de Filtro: Dificultad (Mock) */}
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Dificultad</Typography>
            <FormGroup>
              <FormControlLabel control={<Checkbox size="small" />} label="Principiante" />
              <FormControlLabel control={<Checkbox size="small" />} label="Intermedio" />
              <FormControlLabel control={<Checkbox size="small" />} label="Avanzado" />
            </FormGroup>
          </Box>
          <Divider />
          
          {/* Grupo de Filtro: Valoración (Mock) */}
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Valoración (o más)</Typography>
            <Rating
              value={filterRating}
              onChange={(event, newValue) => {
                setFilterRating(newValue || 0);
              }}
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Button variant="contained" fullWidth sx={{ mb: 1 }}>Aplicar Filtros</Button>
          <Button variant="text" fullWidth>Limpiar todo</Button>

        </Box>
      </Drawer>
      
    </Box>
  );
}

export default CourseCatalogPage;