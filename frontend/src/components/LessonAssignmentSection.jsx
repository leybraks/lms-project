import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
    Box, Typography, Button, Paper, Divider, TextField, Chip, Alert, CircularProgress 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const LessonAssignmentSection = ({ lesson, courseId }) => {
    const { user } = useAuth();
    
    // Estados locales para la entrega
    const [submissionContent, setSubmissionContent] = useState("");
    const [submissionFile, setSubmissionFile] = useState(null);
    const [mySubmission, setMySubmission] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [loadingSubmission, setLoadingSubmission] = useState(true);

    // Cargar si ya entregué la tarea
    useEffect(() => {
        if (user.role === 'STUDENT' && lesson?.assignment) {
            fetchMySubmission();
        } else {
            setLoadingSubmission(false);
        }
    }, [lesson, user]);

    const fetchMySubmission = async () => {
        try {
            // Buscamos si ya existe una entrega para esta tarea
            const res = await axiosInstance.get('/api/submissions/my_submissions/');
            const found = res.data.find(s => s.assignment === lesson.assignment.id);
            setMySubmission(found);
            if(found) setSubmissionContent(found.content || "");
        } catch (error) {
            console.error("Error cargando entregas", error);
        } finally {
            setLoadingSubmission(false);
        }
    };

    const handleSubmit = async () => {
        if (!lesson.assignment) return;
        
        setSubmitting(true);
        const formData = new FormData();
        formData.append('assignment_id', lesson.assignment.id);
        if (submissionContent) formData.append('content', submissionContent);
        if (submissionFile) formData.append('file_submission', submissionFile);

        try {
            const res = await axiosInstance.post('/api/submissions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMySubmission(res.data);
            alert("¡Tarea entregada con éxito!");
        } catch (error) {
            console.error(error);
            alert("Error al enviar la tarea. Verifica que no haya pasado la fecha límite.");
        } finally {
            setSubmitting(false);
        }
    };

    // Si la lección no tiene tarea asignada, mostramos un mensaje bonito o nada.
    if (!lesson?.assignment) {
        return (
            <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
                Esta lección no requiere entrega de tareas.
            </Alert>
        );
    }

    return (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mt: 2, bgcolor: 'background.paper' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AssignmentIcon color="primary" fontSize="large" />
                <Box>
                    <Typography variant="h6" fontWeight="bold">Tarea: {lesson.assignment.title}</Typography>
                    {lesson.assignment.due_date && (
                        <Chip 
                            icon={<AccessTimeIcon />} 
                            label={`Vence: ${new Date(lesson.assignment.due_date).toLocaleDateString()}`} 
                            color="warning" 
                            size="small" 
                            variant="outlined"
                        />
                    )}
                </Box>
            </Box>
            
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                {lesson.assignment.description}
            </Typography>
            
            <Divider sx={{ my: 3 }} />

            {/* --- VISTA DE ALUMNO --- */}
            {user.role === 'STUDENT' && (
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Tu Entrega
                    </Typography>
                    
                    {loadingSubmission ? (
                        <CircularProgress size={20} />
                    ) : mySubmission && mySubmission.status === 'GRADED' ? (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                            <strong>¡Calificado!</strong><br/>
                            Nota: {mySubmission.grade?.score || 'N/A'} <br/>
                            Comentarios: {mySubmission.grade?.comments || 'Sin comentarios'}
                        </Alert>
                    ) : (
                        <Box>
                            {/* Si ya entregó, mostrar alerta, pero permitir re-entrega si allow_edits es true */}
                            {mySubmission && (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Ya enviaste esta tarea el {new Date(mySubmission.submitted_at).toLocaleDateString()}.
                                    {lesson.assignment.allow_edits && " Puedes editar tu entrega abajo."}
                                </Alert>
                            )}

                            {(!mySubmission || lesson.assignment.allow_edits) && (
                                <>
                                    <TextField
                                        fullWidth multiline rows={4}
                                        placeholder="Escribe tu respuesta aquí..."
                                        variant="outlined" sx={{ mb: 2 }}
                                        value={submissionContent}
                                        onChange={(e) => setSubmissionContent(e.target.value)}
                                        disabled={submitting}
                                    />
                                    
                                    <Button
                                        variant="outlined" component="label" fullWidth sx={{ mb: 2, height: 50, borderStyle: 'dashed' }}
                                        startIcon={<CloudUploadIcon />}
                                        disabled={submitting}
                                    >
                                        {submissionFile ? submissionFile.name : "Adjuntar Archivo (Clic aquí)"}
                                        <input type="file" hidden onChange={(e) => setSubmissionFile(e.target.files[0])} />
                                    </Button>

                                    <Button 
                                        variant="contained" fullWidth size="large"
                                        onClick={handleSubmit}
                                        disabled={submitting || (!submissionContent && !submissionFile)}
                                    >
                                        {submitting ? "Enviando..." : (mySubmission ? "Actualizar Entrega" : "Entregar Tarea")}
                                    </Button>
                                </>
                            )}
                        </Box>
                    )}
                </Box>
            )}

            {/* --- VISTA DE PROFESOR --- */}
            {user.role === 'PROFESSOR' && (
                <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Como profesor, puedes ver y calificar las entregas en el panel de notas.
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={() => window.location.href = `/courses/${courseId}/grades`}
                    >
                        Ir al Libro de Notas
                    </Button>
                </Box>
            )}
        </Paper>
    );
};

export default LessonAssignmentSection;