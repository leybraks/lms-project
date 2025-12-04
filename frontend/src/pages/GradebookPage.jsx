import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { 
    Box, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Avatar, Chip, Button, IconButton, Dialog, DialogTitle, DialogContent, 
    TextField, DialogActions, Link, CircularProgress, Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';

function GradebookPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    
    // Estados
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estado del Modal de Calificación
    const [openGradeModal, setOpenGradeModal] = useState(false);
    const [currentSub, setCurrentSub] = useState(null);
    const [score, setScore] = useState('');
    const [comments, setComments] = useState('');

    // 1. Cargar la lista de tareas del curso
    useEffect(() => {
        axiosInstance.get(`/api/courses/${courseId}/gradebook/`) // Usamos la vista existente que lista items del curso
            .then(res => {
                // Filtramos solo las que son tareas (type='assignment' si tu backend lo devuelve así, 
                // o asumimos que lo que devuelve son tareas según tu GradebookView actual)
                setAssignments(res.data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [courseId]);

    // 2. Cargar entregas cuando selecciono una tarea
    useEffect(() => {
        if (!selectedAssignment) return;
        
        axiosInstance.get(`/api/assignments/${selectedAssignment}/submissions/`)
            .then(res => setSubmissions(res.data))
            .catch(err => console.error(err));
    }, [selectedAssignment]);

    const handleOpenGrade = (sub) => {
        setCurrentSub(sub);
        setScore(sub.grade ? sub.grade.score : '');
        setComments(sub.grade ? sub.grade.comments : '');
        setOpenGradeModal(true);
    };

    const submitGrade = async () => {
        try {
            await axiosInstance.post(`/api/submissions/${currentSub.id}/grade/`, {
                score,
                comments
            });
            // Actualizar lista local
            setSubmissions(prev => prev.map(s => {
                if (s.id === currentSub.id) {
                    return { ...s, status: 'GRADED', grade: { score, comments } };
                }
                return s;
            }));
            setOpenGradeModal(false);
        } catch (error) {
            alert("Error al guardar la nota");
        }
    };

    if (loading) return <Box p={5} textAlign="center"><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 4, width: '100%' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/courses/${courseId}`)} sx={{ mb: 2 }}>
                Volver al Curso
            </Button>
            
            <Typography variant="h4" fontWeight="bold" gutterBottom>Libro de Calificaciones</Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>Selecciona una tarea para ver y calificar las entregas de tus alumnos.</Typography>

            {/* SELECTOR DE TAREA */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <FormControl fullWidth>
                    <InputLabel>Seleccionar Tarea a Calificar</InputLabel>
                    <Select
                        value={selectedAssignment}
                        label="Seleccionar Tarea a Calificar"
                        onChange={(e) => setSelectedAssignment(e.target.value)}
                    >
                        {assignments.map((assign) => (
                            <MenuItem key={assign.id} value={assign.id}>
                                {assign.title} (Vence: {assign.due_date ? new Date(assign.due_date).toLocaleDateString() : 'Sin fecha'})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* TABLA DE ENTREGAS */}
            {selectedAssignment && (
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell>Alumno</TableCell>
                                <TableCell>Entrega</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell align="center">Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {submissions.length > 0 ? (
                                submissions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar src={sub.user_image}>{sub.user_username ? sub.user_username[0] : '?'}</Avatar>
                                                <Typography fontWeight="bold">{sub.user_username}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {sub.file_submission ? (
                                                <Button 
                                                    startIcon={<DownloadIcon />} 
                                                    href={sub.file_submission} 
                                                    target="_blank"
                                                    size="small"
                                                >
                                                    Ver Archivo
                                                </Button>
                                            ) : (
                                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                    "{sub.content?.substring(0, 30)}..."
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>{new Date(sub.submitted_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            {sub.status === 'GRADED' ? (
                                                <Chip label={`Nota: ${sub.grade?.score}`} color="success" size="small" icon={<CheckCircleIcon />} />
                                            ) : (
                                                <Chip label="Pendiente" color="warning" size="small" icon={<PendingIcon />} />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button 
                                                variant="contained" 
                                                size="small" 
                                                startIcon={<RateReviewIcon />}
                                                onClick={() => handleOpenGrade(sub)}
                                            >
                                                Calificar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        <Typography color="text.secondary">No hay entregas para esta tarea aún.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* MODAL DE CALIFICACIÓN */}
            <Dialog open={openGradeModal} onClose={() => setOpenGradeModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Calificar Entrega</DialogTitle>
                <DialogContent dividers>
                    {currentSub && (
                        <>
                            <Typography variant="subtitle2" gutterBottom>Alumno: {currentSub.user_username}</Typography>
                            
                            {/* Mostrar contenido completo de la entrega */}
                            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
                                {currentSub.content && (
                                    <Typography variant="body2" paragraph>
                                        <strong>Texto:</strong> {currentSub.content}
                                    </Typography>
                                )}
                                {currentSub.file_submission && (
                                    <Link href={currentSub.file_submission} target="_blank" underline="hover">
                                        📄 Descargar Archivo Adjunto
                                    </Link>
                                )}
                            </Paper>

                            <TextField
                                autoFocus
                                label="Nota (0-20)"
                                type="number"
                                fullWidth
                                margin="normal"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                            />
                            <TextField
                                label="Comentarios / Feedback"
                                multiline
                                rows={3}
                                fullWidth
                                margin="normal"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenGradeModal(false)}>Cancelar</Button>
                    <Button onClick={submitGrade} variant="contained" color="primary">Guardar Nota</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default GradebookPage;