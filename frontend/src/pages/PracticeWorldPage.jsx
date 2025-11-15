import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button, 
  Paper, 
  Modal, 
  IconButton,
  Tooltip
} from '@mui/material';
import CodeChallengePanel from '../components/CodeChallengePanel';
import ExtensionIcon from '@mui/icons-material/Extension'; // Desafío
import LockIcon from '@mui/icons-material/Lock'; // Bloqueado
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Completado
import AutoStoriesIcon from '@mui/icons-material/AutoStories'; // Lección

// --- Estilos para el Modal ---
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', md: '80%' },
  maxWidth: 1100,
  height: { xs: '80%', md: '90%' },
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 0,
  display: 'flex',
  flexDirection: 'column'
};

// --- FUNCIÓN PARA APLANAR LOS DATOS ---
// (Convierte la estructura Módulo->Lección->Desafío en una sola lista)
const flattenPathData = (modules) => {
  const path = [];
  modules.forEach(module => {
    // Añade el Módulo como un hito "grande"
    path.push({ type: 'module', id: `m-${module.id}`, title: module.title });

    module.lessons.forEach(lesson => {
      // (Opcional) Añadir la lección como un hito
      // path.push({ type: 'lesson', id: `l-${lesson.id}`, title: lesson.title });

      lesson.code_challenges.forEach(challenge => {
        // Añade cada desafío como un "nivel" clicable
        path.push({ 
          type: 'challenge', 
          id: challenge.id, 
          title: challenge.title, 
          // Pasamos el desafío completo al modal
          challengeData: challenge 
        });
      });
    });
  });
  return path;
};


const PracticeWorldPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 'pathData' es la lista aplanada de hitos (Módulos y Desafíos)
  const pathData = useMemo(() => flattenPathData(modules), [modules]);

  // --- LÓGICA DE CARGA ---
 // --- LÓGICA DE CARGA (CORREGIDA) ---
  useEffect(() => {
    const fetchPracticeWorld = async (cId) => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/course/${cId}/practice_world/`);
        
        // --- ¡INICIA LA CORRECCIÓN! ---
        // Comprueba que los datos existen antes de establecerlos
        if (response.data && Array.isArray(response.data.modules)) {
          setModules(response.data.modules);
        } else {
          setModules([]); // Asegura que sea un array
        }
        
        if (response.data && response.data.course) {
          setCourseTitle(response.data.course.title);
        } else {
          setCourseTitle("Curso"); // Título por defecto
        }
        // --- FIN DE LA CORRECCIÓN ---

      } catch (err) {
        setError("Error al cargar el Mundo de Práctica");
        setModules([]); // Asegura que sea un array en caso de error
      } finally {
        setLoading(false);
      }
    };

    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/enrollments/my_enrollments/`);
        
        // --- ¡AÑADE ESTA CORRECCIÓN! ---
        if (response.data && Array.isArray(response.data)) {
          setEnrolledCourses(response.data.map(enrollment => enrollment.course));
        } else {
          setEnrolledCourses([]);
        }
        
      } catch (err) {
        setError("Error al cargar tus cursos inscritos");
        setEnrolledCourses([]); // Asegura que sea un array en caso de error
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchPracticeWorld(courseId);
    } else {
      fetchEnrolledCourses();
    }
    
  }, [courseId, user]); // Dependencias: courseId y user  

  // --- Funciones del Modal ---
  const handleChallengeClick = (challenge) => {
    setSelectedChallenge(challenge);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);
  
  // (Lógica de completado - AÚN NO IMPLEMENTADA)
  const isChallengeCompleted = (challengeId) => false; 

  // --- Renderizado ---
  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  // --- VISTA 1: Selector de Curso ---
  if (!courseId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Mundo de Práctica</Typography>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Selecciona un curso para empezar a practicar:</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {enrolledCourses.length > 0 ? (
            enrolledCourses.map(course => (
              <Paper 
                key={course.id} 
                sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }}}
                onClick={() => navigate(`/course/${course.id}/practice`)}
              >
                <Typography variant="h6">{course.title}</Typography>
              </Paper>
            ))
          ) : (
            <Alert severity="info">No estás inscrito en ningún curso.</Alert>
          )}
        </Box>
      </Box>
    );
  }

  // --- VISTA 2: El "Mundo de Práctica" (Camino en S) ---
  return (
    <Box sx={{ p: 3, overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Mundo de Práctica: {courseTitle} {/* <-- Título Arreglado */}
      </Typography>
      
      {pathData.length === 0 && (
        <Alert severity="info">
          Este curso no tiene desafíos de práctica todavía.
        </Alert>
      )}

      {/* --- EL CAMINO (Estilo "S") --- */}
      <Box 
        sx={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: 600, // Ancho del camino
          margin: '40px auto',
          minHeight: `${pathData.length * 120}px`, // Altura dinámica
        }}
      >
        {/* 1. La línea central del camino */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '20px', 
            bottom: '20px', 
            left: '50%', 
            width: '6px', 
            bgcolor: 'grey.300', 
            transform: 'translateX(-50%)',
            borderRadius: '3px'
          }} 
        />
        
        {/* 2. Los nodos (Módulos y Desafíos) */}
        {pathData.map((node, index) => {
          const yPos = index * 120; // Espaciado vertical
          const isLeft = index % 2 === 0; // Alternar lado (izquierda/derecha)
          
          // Estilo base para todos los nodos
          const nodeStyles = {
            position: 'absolute',
            top: `${yPos}px`,
            width: '45%', // Ancho del nodo
            zIndex: 2,
            ...(isLeft ? { left: '0%' } : { right: '0%' }),
            textAlign: isLeft ? 'right' : 'left',
          };

          // Línea conectora horizontal (del nodo a la línea central)
          const connectorStyles = {
            position: 'absolute',
            top: `${yPos + 30}px`, // Alinear con el centro
            width: '5%',
            height: '4px',
            bgcolor: 'grey.300',
            zIndex: 1,
            ...(isLeft ? { left: '45%' } : { right: '45%' })
          };

          let nodeContent;

          if (node.type === 'module') {
            nodeContent = (
              <Paper elevation={3} sx={{ p: 1, bgcolor: 'secondary.main', color: 'white', display: 'inline-block' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{node.title}</Typography>
              </Paper>
            );
          } else if (node.type === 'challenge') {
            const completed = isChallengeCompleted(node.id);
            nodeContent = (
              <Button
                variant={completed ? "outlined" : "contained"}
                color={completed ? "success" : "primary"}
                startIcon={completed ? <CheckCircleIcon /> : <ExtensionIcon />}
                onClick={() => handleChallengeClick(node.challengeData)}
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  width: '100%', 
                  height: '60px', 
                  boxShadow: 3,
                  textTransform: 'none'
                }}
              >
                {node.title}
              </Button>
            );
          } else {
            // (Si decides mostrar 'lesson' también)
            nodeContent = null;
          }

          return (
            <React.Fragment key={node.id}>
              {nodeContent && <Box sx={connectorStyles} />}
              {nodeContent && <Box sx={nodeStyles}>{nodeContent}</Box>}
            </React.Fragment>
          );
        })}
      </Box>

      {/* --- El Modal de Práctica (sin cambios) --- */}
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <IconButton 
            onClick={handleCloseModal} 
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
          >
            <CloseIcon />
          </IconButton>
          
          {selectedChallenge && (
            <CodeChallengePanel
              key={selectedChallenge.id}
              challenge={selectedChallenge}
              onNotify={(msg, sev) => console.log(msg, sev)}
              onXpEarned={(xp) => console.log('XP ganado:', xp)}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default PracticeWorldPage;