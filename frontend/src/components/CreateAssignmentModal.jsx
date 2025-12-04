import React, { useState } from 'react';
import axiosInstance from '../api/axios';
import { 
    Box, Typography, TextField, Button, FormControlLabel, Switch, CircularProgress 
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';

const CreateAssignmentModal = ({ lessonId, onCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [allowEdits, setAllowEdits] = useState(true);

    const handleSubmit = async () => {
        if (!title || !description) return alert("Título y descripción requeridos");

        setLoading(true);
        try {
            await axiosInstance.post(`/api/lesson/${lessonId}/assignment/`, {
                title,
                description,
                due_date: dueDate || null, // Si está vacío mandamos null
                allow_edits: allowEdits
            });
            onCreated(); // Cerrar modal y notificar
        } catch (error) {
            console.error(error);
            alert("Error al crear la tarea (¿Quizás ya existe una en esta lección?)");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>Crear Tarea</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Los alumnos podrán subir archivos o texto como respuesta.
            </Typography>

            <TextField 
                fullWidth label="Título de la Tarea" variant="outlined" sx={{ mb: 2 }}
                value={title} onChange={(e) => setTitle(e.target.value)}
            />
            
            <TextField 
                fullWidth label="Instrucciones" multiline rows={4} variant="outlined" sx={{ mb: 2 }}
                value={description} onChange={(e) => setDescription(e.target.value)}
            />

            <TextField 
                fullWidth type="datetime-local" label="Fecha Límite (Opcional)" 
                InputLabelProps={{ shrink: true }} sx={{ mb: 2 }}
                value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            />

            <FormControlLabel 
                control={<Switch checked={allowEdits} onChange={(e) => setAllowEdits(e.target.checked)} />} 
                label="Permitir re-envíos (editar entrega)" sx={{ mb: 3, display:'block' }}
            />

            <Button 
                variant="contained" fullWidth size="large" 
                onClick={handleSubmit} disabled={loading}
            >
                {loading ? <CircularProgress size={24} /> : "Publicar Tarea"}
            </Button>
        </Box>
    );
};

export default CreateAssignmentModal;