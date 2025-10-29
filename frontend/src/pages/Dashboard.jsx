import React, { useEffect, useState } from 'react';
// De nuevo, importamos nuestra instancia
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Esta función se ejecutará al cargar la página
        const fetchUserData = async () => {
            try {
                // 2. Hacemos un GET a la ruta protegida del usuario
                // (dj-rest-auth usa '/api/auth/user/' por defecto)
                const response = await axiosInstance.get('/api/auth/user/');
                
                // 3. ¡FUNCIONÓ! El interceptor añadió el token automáticamente
                setUser(response.data);
                setLoading(false);

            } catch (error) {
                // 4. ¡FALLÓ! (El token es inválido, expiró, etc.)
                console.error("Error al cargar datos del usuario:", error);
                
                // 5. Si falla, limpiamos el token viejo y lo mandamos al login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                navigate('/login');
            }
        };

        fetchUserData();
    }, [navigate]); // El array vacío [] significa "ejecutar solo una vez"

    if (loading) {
        return <p>Cargando...</p>;
    }

    return (
        <div>
            {/* Si 'user' tiene datos, los mostramos */}
            {user && (
                <>
                    <h1>Bienvenido, {user.username}</h1>
                    <p>Tu email es: {user.email}</p>
                </>
            )}
        </div>
    );
}

export default Dashboard;