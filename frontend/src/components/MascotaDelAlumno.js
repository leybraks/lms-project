import React, { useState, useEffect, useContext } from 'react';
import { WebSocketContext } from '../context/WebSocketContext'; // <-- EJEMPLO
import { AuthContext } from '../context/AuthContext'; // <-- EJEMPLO

function MascotaDelAlumno() {
    // Necesitamos el WebSocket
    const { websocket, lastMessage } = useContext(WebSocketContext);
    // Necesitamos saber quiénes somos
    const { user } = useContext(AuthContext); 
    
    // El XP de la mascota (podría venir de 'user.experience_points')
    const [xp, setXp] = useState(user.experience_points);
    const [animationText, setAnimationText] = useState(null);

    // 1. Escuchar CUALQUIER mensaje del WebSocket
    useEffect(() => {
        if (!lastMessage) return;

        // El 'lastMessage' ya debería estar parseado (JSON.parse)
        // Esto coincide con tu 'consumers.py'
        if (lastMessage.type === 'xp_notification') {
            
            const { user_id, username, points, total_xp } = lastMessage;

            // Mostramos una alerta a todos (ej. "¡Ana ganó 10 puntos!")
            console.log(`¡${username} ganó ${points} puntos!`);
            
            // PERO... solo actualizamos la mascota y la animación
            // si el mensaje de XP es PARA MÍ
            if (user_id === user.id) {
                setXp(total_xp);
                setAnimationText(`+${points} XP!`);
                setTimeout(() => {
                    setAnimationText(null);
                }, 2500);
            }
        }
    }, [lastMessage, user.id]); // Reacciona a cada nuevo mensaje

    return (
        <div className="mascota-container">
            {/* Un div simple para la animación de texto */}
            {animationText && <div className="xp-animation">{animationText}</div>}
            
            <img src="/path/a/tu/mascota.png" alt="Mascota" />
            <div className="xp-bar">XP: {xp}</div>
        </div>
    );
}

export default MascotaDelAlumno;