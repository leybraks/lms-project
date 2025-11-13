import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axios'; 
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- ¡CAMBIO 1: Añadir estado para los Tokens! ---
  const [authTokens, setAuthTokens] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      // Leemos ambos tokens
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken) {
        try {
          const response = await axiosInstance.get('/api/users/me/');
          setUser(response.data);
          
          // --- ¡CAMBIO 2: Guardar los tokens en el estado! ---
          setAuthTokens({ access: accessToken, refresh: refreshToken });

        } catch (error) {
          console.error("Token inválido, borrando...", error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false); 
    };
    initAuth();
  }, []);

  // Función de Login (corregida)
  const login = async (credentials) => {
      const response = await axiosInstance.post('/api/auth/login/', credentials);
      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;
      
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // --- ¡CAMBIO 3: Guardar los tokens en el estado! ---
      setAuthTokens({ access: accessToken, refresh: refreshToken });

      const userResponse = await axiosInstance.get('/api/users/me/');
      setUser(userResponse.data); 
      navigate('/'); 
  };
  
  // Función de Logout (corregida)
  const logout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout/', {}); 
    } catch (error) {
      console.error("Error al hacer logout en el backend", error);
    } finally {
      setUser(null);
      
      // --- ¡CAMBIO 4: Limpiar el estado de los tokens! ---
      setAuthTokens(null); 
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };

  // El valor que compartimos con toda la app
  const value = {
    user,
    setUser,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
    
    // --- ¡CAMBIO 5: Compartir los tokens con la App! ---
    authTokens: authTokens 
  };
  
  if (loading) {
    return <div>Cargando...</div>;
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