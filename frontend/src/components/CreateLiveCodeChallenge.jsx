import React, { useState } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';

// Props: 'lessonId' y 'onChallengeCreated' (para cerrar el modal)
const CreateLiveCodeChallenge = ({ lessonId, onChallengeCreated }) => {
  const { authTokens } = useAuth(); // Para la autenticación
  
  // Estados simples para los campos del formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [starterCode, setStarterCode] = useState("");
  const [solution, setSolution] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Estado de éxito

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Llama a la API que creamos (con 'lessonId')
      const response = await axiosInstance.post(
        `/api/lesson/${lessonId}/create_live_challenge/`,
        {
          title: title,
          description: description,
          starter_code: starterCode,
          solution: solution // La IA necesita esto
        },
        { 
          headers: { 
            'Authorization': `Bearer ${authTokens.access}` 
          } 
        }
      );
      
      setSuccess("¡Desafío de código en vivo creado con éxito!");
      
      // Llama a la función del padre (para cerrar el modal)
      if (onChallengeCreated) onChallengeCreated(response.data);
      
      // Limpia el formulario
      setTitle("");
      setDescription("");
      setStarterCode("");
      setSolution("");

    } catch (err) {
      console.error("Error al crear el desafío:", err);
      setError(err.response?.data?.error || "Ocurrió un error. Asegúrate de que la 'Solución' no esté vacía.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ p: 3 }} // Añade padding dentro del modal
    >
      <Typography variant="h4" sx={{ mb: 3 }}>Crear Desafío de Código en Vivo</Typography>
      
      <Paper variant="outlined" sx={{ p: 3, bgcolor: 'action.hover' }}>
        <TextField
          fullWidth label="Título del Desafío" value={title}
          onChange={(e) => setTitle(e.target.value)}
          required sx={{ mb: 2 }}
        />
        <TextField
          fullWidth multiline rows={4} label="Descripción del Problema"
          value={description} onChange={(e) => setDescription(e.target.value)}
          required sx={{ mb: 2 }}
        />
        <TextField
          fullWidth multiline rows={4} label="Código Inicial (Opcional)"
          value={starterCode} onChange={(e) => setStarterCode(e.target.value)}
          sx={{ mb: 2, '& .MuiInputBase-input': { fontFamily: 'monospace' } }}
        />
        <TextField
          fullWidth multiline rows={4} label="Solución Correcta (¡Importante para la IA!)"
          value={solution} onChange={(e) => setSolution(e.target.value)}
          required sx={{ mb: 2, '& .MuiInputBase-input': { fontFamily: 'monospace' } }}
        />
        
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
          {isSaving ? <CircularProgress size={24} color="inherit" /> : "Guardar Desafío en Vivo"}
        </Button>
      </Paper>
    </Box>
  );
};

export default CreateLiveCodeChallenge;