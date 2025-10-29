// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
// ¡IMPORTANTE! Ya no usamos 'api', usamos nuestro 'axiosInstance'
import axiosInstance from '../api/axios'; 
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Esta función se ejecuta CADA VEZ que recargas la app
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // 1. Validamos el token pidiendo los datos del usuario
          //    La URL de 'dj-rest-auth' para esto es '/api/auth/user/'
          const response = await axiosInstance.get('/api/auth/user/');
          setUser(response.data); // ¡Autenticación exitosa!
        } catch (error) {
          // El token era inválido o expiró
          console.error("Token inválido, borrando...", error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false); 
    };
    initAuth();
  }, []); // El array vacío [] significa que solo se ejecuta al montar

  // Función de Login (corregida)
  const login = async (credentials) => {
      
      // 1. Llama a la URL de LOGIN (POST) y envía las CREDENCIALES
      const response = await axiosInstance.post('/api/auth/login/', credentials);
      
      // 2. Busca 'access' y 'refresh' en la respuesta (¡el nombre SÍ importa!)
      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;
      
      // 3. Guarda los tokens NUEVOS en localStorage
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // 4. Pide los datos del usuario (con el token nuevo)
      const userResponse = await axiosInstance.get('/api/auth/user/');

      // 5. Actualiza el estado global (¡Esto rompe el bucle!)
      setUser(userResponse.data); 
      
      // 6. Redirige al Home (¡Ahora sí funcionará!)
      navigate('/'); 
  };
  // Función de Logout (corregida)
  const logout = async () => {
    try {
      // Opcional: avisar al backend que cerramos sesión
      await axiosInstance.post('/api/auth/logout/', {}); 
    } catch (error) {
      console.error("Error al hacer logout en el backend", error);
    } finally {
      // Limpiamos el estado y el localStorage
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Llevamos al usuario al login
      navigate('/login');
    }
  };

  // El valor que compartimos con toda la app
  const value = {
    user,
    setUser,
    login,
    logout,
    isAuthenticated: !!user, // <-- ¡Este booleano es clave!
    loading,
  };
  
  // No mostramos la app hasta que sepamos si el usuario está logueado o no
  if (loading) {
    return <div>Cargando...</div>; // O un spinner
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook 'useAuth' (sin cambios)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}