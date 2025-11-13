import React, { useState, useEffect, useContext } from 'react';
// Asume que tienes un contexto para tu WebSocket
import { WebSocketContext } from '../context/WebSocketContext'; 
// Asume que tienes un cliente api (axios) configurado
import api from '../api/axios'; 

// --- Estilos simples (opcional) ---
const styles = {
  panel: {
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  },
  section: {
    marginBottom: '24px',
  },
  studentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  select: {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
  },
  button: {
    padding: '10px 15px',
    cursor: 'pointer',
  }
};

/**
 * Panel de control del tutor para la clase en vivo.
 * Necesita recibir el 'courseId' actual.
 */
function TutorControlPanel({ courseId }) {
  // --- WebSocket ---
  // Asumimos que tu contexto te da el socket de la lección
  const { websocket } = useContext(WebSocketContext);

  // --- Estado del Pilar 1 (Puntos Manuales) ---
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // --- Estado del Pilar 2 (Quiz en Vivo) ---
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [quizInProgress, setQuizInProgress] = useState(false); // Podrías manejar esto desde el socket

  // --- Cargar datos al montar (Alumnos y Quizzes) ---
  useEffect(() => {
    if (!courseId) return;

    // 1. Cargar lista de alumnos para el Pilar 1
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const response = await api.get(`/api/course/${courseId}/students/`);
        setStudents(response.data);
      } catch (error) {
        console.error("Error al cargar alumnos:", error);
      }
      setLoadingStudents(false);
    };

    // 2. Cargar lista de quizzes para el Pilar 2
    const fetchQuizzes = async () => {
      setLoadingQuizzes(true);
      try {
        const response = await api.get(`/api/course/${courseId}/quizzes/`);
        setQuizzes(response.data);
      } catch (error) {
        console.error("Error al cargar quizzes:", error);
      }
      setLoadingQuizzes(false);
    };

    fetchStudents();
    fetchQuizzes();
  }, [courseId]); // Se recarga si cambia el curso

  // --- Lógica del Pilar 1: Dar Puntos (vía WebSocket) ---
  const handleAddPoints = (studentId, points) => {
    if (!websocket) {
      console.error("Conexión WebSocket no está activa.");
      return;
    }

    // Esto debe coincidir con tu 'consumers.py' (evento GIVE_XP)
    const payload = {
      message_type: "GIVE_XP",
      target_user_id: studentId,
      points: points
    };

    websocket.send(JSON.stringify(payload));
    console.log(`Comando GIVE_XP enviado a: ${studentId}`);
  };

  // --- Lógica del Pilar 2: Lanzar Quiz (vía WebSocket) ---
  const handleLaunchQuiz = () => {
    if (!websocket || !selectedQuizId) {
      console.error("Selecciona un quiz y asegúrate de estar conectado.");
      return;
    }

    // Esto debe coincidir con tu 'consumers.py' (evento START_QUIZ)
    const payload = {
      message_type: "START_QUIZ",
      quiz_id: selectedQuizId
    };

    websocket.send(JSON.stringify(payload));
    setQuizInProgress(true); // Bloquea la UI del tutor
    console.log("Comando START_QUIZ enviado para el quiz:", selectedQuizId);
  };
  
  // (Aquí podrías añadir un listener al WebSocket para recibir
  // eventos de 'quiz_finished' y poner setQuizInProgress(false))

  return (
    <div style={styles.panel}>
      
      {/* --- PESTAÑA 1: PARTICIPANTES (Pilar 1) --- */}
      <div style={styles.section}>
        <h4>Participantes</h4>
        {loadingStudents ? (
          <p>Cargando alumnos...</p>
        ) : (
          <div className="student-list">
            {students.map(student => (
              <div key={student.id} style={styles.studentRow}>
                <span>{student.first_name} {student.last_name} (<b>{student.experience_points} XP</b>)</span>
                <div>
                  <button style={styles.button} onClick={() => handleAddPoints(student.id, 10)}>+10</button>
                  <button style={styles.button} onClick={() => handleAddPoints(student.id, 50)}>+50</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} /> 

      {/* --- PESTAÑA 2: DESAFÍO EN VIVO (Pilar 2) --- */}
      <div style={styles.section}>
        <h4>Desafío en Vivo</h4>
        
        {loadingQuizzes ? (
          <p>Cargando quizzes...</p>
        ) : !quizInProgress ? (
          <>
            <select 
              style={styles.select}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              value={selectedQuizId || ""}
            >
              <option value="" disabled>Selecciona un quiz...</option>
              {quizzes.map(quiz => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
            <button 
              style={styles.button}
              onClick={handleLaunchQuiz} 
              disabled={!selectedQuizId || !websocket}
            >
              🚀 Lanzar Quiz Ahora
            </button>
          </>
        ) : (
          <div>
            <p>¡Quiz en progreso! Viendo resultados...</p>
            {/* Aquí es donde, en el futuro, podrías
              escuchar los eventos 'quiz_answer_received'
              y mostrar un leaderboard en tiempo real.
            */}
          </div>
        )}
      </div>
    </div>
  );
}

export default TutorControlPanel;