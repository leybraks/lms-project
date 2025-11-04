// frontend/src/pages/QuizPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axios';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Breadcrumbs,
  Link,
  // --- ¡NUEVAS IMPORTACIONES PARA EL DISEÑO! ---
  Stack,          // Para organizar los botones
  LinearProgress  // La barra de progreso
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function QuizPage() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- ¡NUEVA LÓGICA DE ESTADO! ---
  // Mantiene el índice de la pregunta actual (empezamos en la 0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); 
  // Sigue guardando todas las respuestas
  const [selectedAnswers, setSelectedAnswers] = useState({}); 

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- useEffect (Sin cambios) ---
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizUrl = `/api/quizzes/module/${moduleId}/`;
        const response = await axiosInstance.get(quizUrl);
        setQuiz(response.data);
      } catch (err) {
        // ... (manejo de errores sin cambios)
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [moduleId, courseId, navigate]);

  // --- Handlers (Actualizados) ---
  const handleAnswerChange = (questionId, choiceId) => {
    setSelectedAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: choiceId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    console.log("Enviando respuestas:", selectedAnswers);
    // --- PRÓXIMO PASO: LÓGICA DE ENVÍO ---
    // (Aquí llamaremos a la API de calificación)
    alert("¡Examen enviado! (Aún no hemos implementado la calificación).");
    setIsSubmitting(false);
    navigate(`/courses/${courseId}`); // Vuelve al curso
  };
  
  // --- RENDERIZADO DE ESTADOS (Sin cambios) ---
  if (loading) { /* ... */ }
  if (error) { /* ... */ }
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    // ... (Maneja el caso de examen vacío o error)
    return <Alert severity="error">Este examen no tiene preguntas.</Alert>;
  }

  // ==========================================================
  // --- RENDERIZADO DEL EXAMEN (¡DISEÑO "FOCUS MODE"!) ---
  // ==========================================================
  
  // Variables para la lógica de "Una Pregunta a la Vez"
  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 800, mx: 'auto' }}>
      {/* Breadcrumbs (Sin cambios) */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/">Inicio</Link>
        <Link component={RouterLink} underline="hover" color="inherit" to={`/courses/${courseId}`}>Curso</Link>
        <Typography color="text.primary">{quiz.title}</Typography>
      </Breadcrumbs>

      {/* Cabecera del Examen */}
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {quiz.title}
        </Typography>
        <Divider sx={{ my: 2 }} />

        {/* --- 1. BARRA DE PROGRESO --- */}
        <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Pregunta {currentQuestionIndex + 1} de {totalQuestions}
            </Typography>
            <LinearProgress variant="determinate" value={progressPercentage} />
        </Box>

        {/* --- 2. UNA PREGUNTA A LA VEZ --- */}
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmitQuiz(); }}>
          
          {/* Contenedor de la Pregunta Actual */}
          <Paper 
            key={currentQuestion.id} 
            variant="outlined" 
            sx={{ p: 3, backgroundColor: 'background.default' }}
          >
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, typography: 'h6', display: 'flex', alignItems: 'center' }}>
                <HelpOutlineIcon color="primary" sx={{ mr: 1.5 }} />
                {currentQuestion.text}
              </FormLabel>
              
              <RadioGroup
                aria-label={`pregunta-${currentQuestion.id}`}
                name={`question-${currentQuestion.id}`}
                value={selectedAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              >
                {currentQuestion.choices.map((choice) => (
                  <FormControlLabel 
                    key={choice.id} 
                    value={choice.id.toString()} // Asegurarse de que el valor sea string
                    control={<Radio />} 
                    label={choice.text}
                    sx={{ 
                      border: '1px solid #333', 
                      borderRadius: 1, 
                      m: 0.5, 
                      p: 0.5,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Paper>

          {/* --- 3. BOTONES DE NAVEGACIÓN --- */}
          <Divider sx={{ my: 3 }} />
          
          <Stack direction="row" justifyContent="space-between">
            {/* Botón ATRÁS */}
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              disabled={currentQuestionIndex === 0} // Deshabilitado en la primera pregunta
            >
              Atrás
            </Button>

            {/* Botón SIGUIENTE o ENTREGAR */}
            {isLastQuestion ? (
              // Es la última pregunta: Mostrar botón de Entregar
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<CheckCircleIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Entregar Examen"}
              </Button>
            ) : (
              // No es la última pregunta: Mostrar botón de Siguiente
              <Button
                variant="contained"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
              >
                Siguiente
              </Button>
            )}
          </Stack>

        </Box>
      </Paper>
    </Box>
  );
}

export default QuizPage;