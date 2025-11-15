import React, { useState } from 'react';
import axiosInstance from '../api/axios'; 
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// --- Sub-componente: Editor de Opciones ---
const ChoiceEditor = ({ questionIndex, choiceIndex, choice, handleChoiceChange, handleCorrectChange, removeChoice, canRemove }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {/* Radio button para marcar la correcta */}
      <Radio
        checked={choice.is_correct}
        onChange={() => handleCorrectChange(questionIndex, choiceIndex)}
      />
      {/* Campo de texto para la opción */}
      <TextField
        fullWidth
        size="small"
        label={`Opción ${choiceIndex + 1}`}
        value={choice.text}
        onChange={(e) => handleChoiceChange(e, questionIndex, choiceIndex)}
        required
      />
      <IconButton 
        color="error" 
        onClick={() => removeChoice(questionIndex, choiceIndex)}
        disabled={!canRemove} // Deshabilitado si es una de las 2 mínimas
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

// --- Sub-componente: Editor de Preguntas ---
const QuestionEditor = ({ questionIndex, question, handlers, canRemove }) => {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Pregunta {questionIndex + 1}</Typography>
        <IconButton 
          color="error" 
          onClick={() => handlers.removeQuestion(questionIndex)}
          disabled={!canRemove} // Deshabilitado si es la última pregunta
        >
          <DeleteIcon />
        </IconButton>
      </Box>
      <TextField
        fullWidth
        label="Texto de la Pregunta"
        value={question.text}
        onChange={(e) => handlers.handleQuestionChange(e, questionIndex)}
        required
        sx={{ mb: 2 }}
      />
      <Typography variant="body2" sx={{ mb: 1 }}>Opciones (marca la correcta):</Typography>
      
      {/* Usamos RadioGroup para asegurar que solo una sea 'is_correct' */}
      <RadioGroup>
        {question.choices.map((choice, cIndex) => (
          <ChoiceEditor
            key={cIndex}
            questionIndex={questionIndex}
            choiceIndex={cIndex}
            choice={choice}
            handleChoiceChange={handlers.handleChoiceChange}
            handleCorrectChange={handlers.handleCorrectChange}
            removeChoice={handlers.removeChoice}
            canRemove={question.choices.length > 2} // UX: No dejar borrar si solo quedan 2
          />
        ))}
      </RadioGroup>
      <Button 
        size="small" 
        startIcon={<AddIcon />} 
        onClick={() => handlers.addChoice(questionIndex)}
        sx={{mt: 1}}
      >
        Añadir Opción
      </Button>
    </Paper>
  );
};


// --- Componente Principal del Formulario ---
const CreateLiveQuiz = ({ lessonId, onQuizCreated }) => {
  const { authTokens } = useAuth(); // Para la autenticación

  // Estado que representa el JSON que enviaremos a la API
  const [quizData, setQuizData] = useState({
    title: "",
    questions: [
      { 
        text: "", 
        choices: [
          { text: "", is_correct: true },
          { text: "", is_correct: false }
        ] 
      }
    ]
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- Handlers de Estado (Funciones para modificar el 'quizData') ---

  const handleTitleChange = (e) => {
    setQuizData({ ...quizData, title: e.target.value });
  };

  const handleQuestionChange = (e, qIndex) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].text = e.target.value;
    setQuizData({ ...quizData, questions: newQuestions });
  };
  
  const handleChoiceChange = (e, qIndex, cIndex) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].choices[cIndex].text = e.target.value;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleCorrectChange = (qIndex, cIndex) => {
    const newQuestions = [...quizData.questions];
    // Pone todas en 'false'
    newQuestions[qIndex].choices = newQuestions[qIndex].choices.map(c => ({ ...c, is_correct: false }));
    // Pone la seleccionada en 'true'
    newQuestions[qIndex].choices[cIndex].is_correct = true;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        { text: "", choices: [{ text: "", is_correct: true }, { text: "", is_correct: false }] }
      ]
    });
  };

  const removeQuestion = (qIndex) => {
    // UX: No permitir borrar la última pregunta
    if (quizData.questions.length <= 1) return; 
    const newQuestions = quizData.questions.filter((_, index) => index !== qIndex);
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const addChoice = (qIndex) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].choices.push({ text: "", is_correct: false });
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const removeChoice = (qIndex, cIndex) => {
    // UX: Requerir al menos 2 opciones
    if (quizData.questions[qIndex].choices.length <= 2) return; 
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].choices = newQuestions[qIndex].choices.filter((_, index) => index !== cIndex);
    setQuizData({ ...quizData, questions: newQuestions });
  };

  // --- Handler de Envío (Llamada a la API) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Llama a la API que creamos (con 'lessonId')
      const response = await axiosInstance.post(
        `/api/lesson/${lessonId}/create_live_quiz/`, 
        quizData, // El objeto de estado es el JSON
        {
          headers: {
            'Authorization': `Bearer ${authTokens.access}`
          }
        }
      );
      
      setSuccess(`¡Quiz "${response.data.title}" creado con éxito!`);
      // Limpia el formulario
      setQuizData({ title: "", questions: [{ text: "", choices: [{ text: "", is_correct: true }, { text: "", is_correct: false }] }] });
      
      // Llama a la función del padre (para cerrar el modal)
      if (onQuizCreated) onQuizCreated(response.data); 

    } catch (err) {
      console.error("Error al crear el quiz:", err);
      setError(err.response?.data?.error || "Ocurrió un error desconocido. Revisa que todas las preguntas y opciones tengan texto.");
    } finally {
      setIsSaving(false);
    }
  };

  // Objeto de handlers para pasar a los sub-componentes
  const handlers = {
    handleQuestionChange,
    handleChoiceChange,
    handleCorrectChange,
    removeQuestion,
    addChoice,
    removeChoice
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ p: 3 }} // Añade padding dentro del modal
    >
      <Typography variant="h4" sx={{ mb: 3 }}>Crear Nuevo Quiz en Vivo</Typography>
      
      <TextField
        fullWidth
        label="Título del Quiz"
        value={quizData.title}
        onChange={handleTitleChange}
        required
        sx={{ mb: 3 }}
      />
      
      {quizData.questions.map((question, qIndex) => (
        <QuestionEditor
          key={qIndex}
          questionIndex={qIndex}
          question={question}
          handlers={handlers}
          canRemove={quizData.questions.length > 1} // UX: No dejar borrar la última
        />
      ))}
      
      <Button 
        variant="outlined" 
        startIcon={<AddIcon />} 
        onClick={addQuestion}
        sx={{ mt: 1, mb: 3 }}
      >
        Añadir Pregunta
      </Button>
      
      <Divider sx={{ mb: 3 }} />

      {/* Feedback de Alertas */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Button 
        type="submit" 
        variant="contained" 
        size="large" 
        disabled={isSaving}
        fullWidth
      >
        {isSaving ? <CircularProgress size={24} color="inherit" /> : "Guardar Quiz en Vivo"}
      </Button>
    </Box>
  );
};

export default CreateLiveQuiz;