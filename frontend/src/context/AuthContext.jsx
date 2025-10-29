// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

// 1. Crea el Contexto
const AuthContext = createContext(null);

// 2. Crea el "Proveedor" (el componente que envuelve la app)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Guardará {username, role, ...}
  const [loading, setLoading] = useState(true); // Para saber si estamos verificando el token
  const navigate = useNavigate();

  // 3. Efecto que se ejecuta al cargar la app
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Si hay token, pide los datos del usuario
          const response = await api.getMe();
          setUser(response.data); // Guarda el usuario en el estado
        } catch (error) {
          // Si el token es inválido, bórralo
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false); // Terminamos de cargar
    };
    
    initAuth();
  }, []);

  // 4. Función de Login
  const login = async (credentials) => {
    // Pide el token
    const response = await api.login(credentials);
    localStorage.setItem('accessToken', response.data.access);
    localStorage.setItem('refreshToken', response.data.refresh);
    
    // DESPUÉS de pedir el token, pide los datos del usuario
    const userResponse = await api.getMe();
    setUser(userResponse.data); // Guarda el usuario
    
    navigate('/'); // Redirige al inicio
  };

  // 5. Función de Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  // 6. Expone los valores al resto de la app
  const value = {
    user,
    setUser,
    login,
    logout,
    isAuthenticated: !!user, // !!user es 'true' si 'user' no es null
  };
  
  // No renderiza nada hasta que termine de cargar
  if (loading) {
    return <div>Cargando...</div>; // O un spinner
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 7. Hook personalizado para usar el contexto fácilmente
export function useAuth() {
  return useContext(AuthContext);
}