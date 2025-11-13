import React, { useState } from 'react';
import axiosInstance from '../api/axios'; // Importa tu axios
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

// --- COMPONENTE DE OPCIÓN ---
const ChoiceEditor = ({ questionIndex, choiceIndex, choice, handleChoiceChange, handleCorrectChange, removeChoice }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Radio
        checked={choice.is_correct}
        onChange={() => handleCorrectChange(questionIndex, choiceIndex)}
      />
      <TextField
        fullWidth
        size="small"
        label={`Opción ${choiceIndex + 1}`}
        value={choice.text}
        onChange={(e) => handleChoiceChange(e, questionIndex, choiceIndex)}
      />
      <IconButton color="error" onClick={() => removeChoice(questionIndex, choiceIndex)}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

// --- COMPONENTE DE PREGUNTA ---
const QuestionEditor = ({ questionIndex, question, handleQuestionChange, ...choiceHandlers }) => {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Pregunta {questionIndex + 1}</Typography>
        <IconButton color="error" onClick={() => choiceHandlers.removeQuestion(questionIndex)}>
          <DeleteIcon />
        </IconButton>
      </Box>
      <TextField
        fullWidth
        label="Texto de la Pregunta"
        value={question.text}
        onChange={(e) => handleQuestionChange(e, questionIndex)}
        sx={{ mb: 2 }}
      />
      <Typography variant="body2" sx={{ mb: 1 }}>Opciones (marca la correcta):</Typography>
      <RadioGroup>
        {question.choices.map((choice, cIndex) => (
          <ChoiceEditor
            key={cIndex}
            questionIndex={questionIndex}
            choiceIndex={cIndex}
            choice={choice}
            {...choiceHandlers}
          />
        ))}
      </RadioGroup>
      <Button 
        size="small" 
        startIcon={<AddIcon />} 
        onClick={() => choiceHandlers.addChoice(questionIndex)}
        sx={{mt: 1}}
      >
        Añadir Opción
      </Button>
    </Paper>
  );
};

// --- FORMULARIO PRINCIPAL ---
// Este componente necesita el 'courseId' como prop
const CreateLiveQuiz = ({ courseId, onQuizCreated }) => {
  // El "estado" que representa la estructura JSON de la API
  const [quizData, setQuizData] = useState({
    title: "",
    questions: [
      { 
        text: "", 
        choices: [
          { text: "", is_correct: true }, // Empezamos con 2 opciones
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
    // Pone todas las opciones de esta pregunta en 'false'
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
    if (quizData.questions.length <= 1) return; // No dejes borrar la última
    const newQuestions = quizData.questions.filter((_, index) => index !== qIndex);
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const addChoice = (qIndex) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].choices.push({ text: "", is_correct: false });
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const removeChoice = (qIndex, cIndex) => {
    if (quizData.questions[qIndex].choices.length <= 2) return; // Mínimo 2 opciones
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
      // ¡Esta es la API que creamos en 'views.py'!
      const response = await axiosInstance.post(
        `/api/course/${courseId}/create_live_quiz/`, 
        quizData // Le pasamos el estado, que tiene el formato JSON perfecto
      );
      
      setSuccess(`¡Quiz "${response.data.title}" creado con éxito!`);
      // (Opcional) Limpiar el formulario
      setQuizData({ title: "", questions: [{ text: "", choices: [{ text: "", is_correct: true }, { text: "", is_correct: false }] }] });
      // (Opcional) Llama a una función del padre para refrescar la lista
      if (onQuizCreated) onQuizCreated(response.data); 

    } catch (err) {
      console.error("Error al crear el quiz:", err);
      setError(err.response?.data?.error || "Ocurrió un error desconocido.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ maxWidth: 800, margin: 'auto', p: 3 }}
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
          handleQuestionChange={handleQuestionChange}
          handleChoiceChange={handleChoiceChange}
          handleCorrectChange={handleCorrectChange}
          removeQuestion={removeQuestion}
          addChoice={addChoice}
          removeChoice={removeChoice}
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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Button 
        type="submit" 
        variant="contained" 
        size="large" 
        disabled={isSaving}
        fullWidth
      >
        {isSaving ? <CircularProgress size={24} /> : "Guardar Quiz en Vivo"}
      </Button>
    </Box>
  );
};

export default CreateLiveQuiz;