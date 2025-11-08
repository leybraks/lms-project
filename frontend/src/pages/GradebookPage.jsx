// frontend/src/pages/GradebookPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useTheme } from '@mui/material/styles';
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button
} from '@mui/material';

// --- Iconos ---
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';

// === VARIANTES DE ANIMACIÓN ===
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2, 
      staggerChildren: 0.1 
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ease: "easeOut" }
  }
};

// --- Función de Scrollbar ---
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

// --- Función Helper para formatear Fecha ---
const formatDate = (dateString) => {
  if (!dateString) return "Sin fecha";
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

function GradebookPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme(); 
  
  const [gradedItems, setGradedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // (Opcional) Cargar el nombre del curso
  const [courseTitle, setCourseTitle] = useState(""); 

  useEffect(() => {
    const fetchGradebook = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carga los items calificables
        const response = await axiosInstance.get(`/api/courses/${courseId}/grades/`);
        setGradedItems(response.data);
        
        // (Opcional) Carga los detalles del curso solo para el título
        const courseResponse = await axiosInstance.get(`/api/courses/${courseId}/`);
        setCourseTitle(courseResponse.data.title);

      } catch (err) {
        console.error("Error al cargar el libro de calificaciones:", err);
        setError("No se pudieron cargar tus calificaciones.");
      } finally {
        setLoading(false);
      }
    };
    fetchGradebook();
  }, [courseId]);

  // --- RENDERING DE ESTADOS ---
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Alert severity="error">{error}</Alert></Box>;
  }

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <Box 
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ 
        height: '100%', 
        p: 3, 
        boxSizing: 'border-box',
        overflowY: 'auto',
        ...getScrollbarStyles(theme)
      }}
    >
      {/* 1. Breadcrumbs (Animado) */}
      <motion.div variants={itemVariants}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
          <Link component={RouterLink} underline="hover" color="inherit" to="/">
            Dashboard
          </Link>
          <Link component={RouterLink} underline="hover" color="inherit" to={`/courses/${courseId}`}>
            {courseTitle || `Curso ${courseId}`}
          </Link>
          <Typography color="text.primary">Libro de Calificaciones</Typography>
        </Breadcrumbs>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ fontWeight: 700, mb: 3 }}
        >
          Libro de Calificaciones
        </Typography>
      </motion.div>

      {/* 2. Tabla de Calificaciones */}
      <motion.div variants={itemVariants}>
        <Paper 
          sx={{ 
            width: '100%', 
            overflow: 'hidden',
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
            <Table stickyHeader aria-label="tabla de calificaciones">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Nombre del elemento</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha de vencimiento</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Calificación</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Resultados</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gradedItems.map((item) => {
                  const submission = item.submission;
                  const grade = submission?.grade;
                  const isPastDue = item.due_date && new Date() > new Date(item.due_date);
                  
                  let statusLabel = "Sin abrir";
                  let statusColor = "default";
                  if (submission) {
                    statusLabel = submission.status; // "SUBMITTED" o "GRADED"
                    statusColor = submission.status === "GRADED" ? "success" : "info";
                  } else if (isPastDue) {
                    statusLabel = "Vencido";
                    statusColor = "error";
                  }

                  return (
                    <TableRow 
                      hover 
                      key={item.id} 
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssessmentIcon fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(item.due_date)}</TableCell>
                      <TableCell>
                        <Chip label={statusLabel} color={statusColor} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {grade ? `${grade.score} / 20` : "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {/* El botón "Vista" (como en tu captura) */}
                        <Button 
                          variant="contained" 
                          size="small" 
                          disabled={!submission}
                          onClick={() => {
                            // (Opcional) Podríamos navegar a una página de "Ver Entrega"
                            // Por ahora, solo lo deshabilitamos si no hay entrega
                          }}
                        >
                          Vista
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {gradedItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" sx={{p: 3}}>
                        Aún no hay elementos calificables para este curso.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </motion.div>
    </Box>
  );
}

export default GradebookPage;