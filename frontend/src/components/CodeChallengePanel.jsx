import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button,
  Tabs,
  Tab,
  TextField,
  Paper
} from '@mui/material';

// Importa el SyntaxHighlighter que ya usas en LessonPage
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; 
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; 

// Importa el estilo de scrollbar (opcional, pero recomendado)
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

const CodeChallengePanel = ({ theme, lessonId, onNotify, onXpEarned }) => {
  const { authTokens } = useAuth();
  
  // --- ¡ESTADOS CORREGIDOS! ---
  const [challenges, setChallenges] = useState([]); // Lista de todos los desafíos
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0); // Qué desafío estamos viendo
  
  const [code, setCode] = useState(""); // El código que escribe el alumno
  const [feedback, setFeedback] = useState(null); // La respuesta de la IA
  
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // --- ¡LÓGICA DE CARGA DE DATOS RESTAURADA! ---
  useEffect(() => {
    if (!lessonId) return;
    
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        // Llama a la API que creamos para obtener los desafíos de la lección
        const response = await axiosInstance.get(`/api/lesson/${lessonId}/challenges/`);
        setChallenges(response.data);
        
        // Si hay desafíos, carga el código inicial del primero
        if (response.data.length > 0) {
          setCode(response.data[0].starter_code || "");
          setFeedback(null); // Limpia el feedback anterior
        }
      } catch (err) {
        console.error("Error al cargar desafíos de IA:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, [lessonId]); // Se carga cuando la lección cambia

  // --- Obtener el desafío activo ---
  const activeChallenge = challenges[currentChallengeIndex];

  // --- Handlers ---
  const handleTabChange = (event, newIndex) => {
    setCurrentChallengeIndex(newIndex);
    const newChallenge = challenges[newIndex];
    if (newChallenge) {
      setCode(newChallenge.starter_code || ""); // Carga el código inicial
    }
    setFeedback(null); // Limpia el feedback
  };

  // Enviar solución a la IA
  const handleSubmitCode = async () => {
    // ¡Comprobación corregida!
    if (!activeChallenge || !authTokens) return;
    
    setIsEvaluating(true);
    setFeedback(null);
    
    try {
      // Llama a la API 'submit' que ya creamos
      const response = await axiosInstance.post(
        `/api/challenge/${activeChallenge.id}/submit/`,
        { code: code },
        { headers: { 'Authorization': `Bearer ${authTokens.access}` } }
      );
      
      const result = response.data;
      setFeedback(result);
      
      if (result.is_correct) {
        onNotify(`¡Correcto! Has ganado ${result.points_awarded} XP`, 'success');
        onXpEarned(result.new_total_xp);
      } else {
        onNotify(result.feedback || "Sigue intentando...", 'warning');
      }
      
    } catch (err) {
      console.error("Error al evaluar el código:", err);
      onNotify(err.response?.data?.error || "Error al conectar con la IA", 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  // --- Renderizado ---

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  }

  if (challenges.length === 0) {
    return (
      <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        No hay desafíos de práctica para esta lección.
      </Typography>
    );
  }

  // ¡Comprobación de seguridad!
  if (!activeChallenge) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Pestañas de Desafíos (si hay más de 1) */}
      {challenges.length > 1 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1, flexShrink: 0 }}>
          <Tabs 
            value={currentChallengeIndex} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
          >
            {challenges.map((challenge, index) => (
              <Tab key={challenge.id} label={challenge.title || `Desafío ${index + 1}`} />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Contenedor con scroll */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, ...getScrollbarStyles(theme) }}>
        
        {/* Descripción del Desafío */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{activeChallenge.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{whiteSpace: 'pre-wrap'}}>
            {activeChallenge.description}
          </Typography>
        </Box>
        
        {/* Editor de Código (simple) */}
        <TextField
          fullWidth
          multiline
          rows={8}
          variant="filled"
          label="Escribe tu solución aquí..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isEvaluating}
          sx={{ mb: 2, '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.9rem' } }}
        />
        
        <Button 
          variant="contained" 
          onClick={handleSubmitCode}
          disabled={isEvaluating}
          fullWidth
        >
          {isEvaluating ? <CircularProgress size={24} /> : "Evaluar mi Solución"}
        </Button>

        {/* --- Sección de Feedback de la IA --- */}
        {feedback && (
          <Paper sx={{ mt: 3, p: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Revisión de la IA
            </Typography>
            <Alert severity={feedback.is_correct ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {feedback.feedback}
              {feedback.is_correct && ` ¡Ganaste ${feedback.points_awarded} XP!`}
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
              Código revisado (con comentarios):
            </Typography>
            <SyntaxHighlighter 
              language="python"
              style={atomDark} 
              customStyle={{ margin: 0, padding: '16px', borderRadius: '4px' }}
              wrapLongLines={true}
            >
              {String(feedback.code_review).trim()}
            </SyntaxHighlighter>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default CodeChallengePanel;