// frontend/src/services/api.js

import axios from 'axios';

// La URL base de la API sigue siendo la misma
const API_BASE_URL = 'http://127.0.0.1:8000/';

let apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// El interceptor para enviar el token no cambia
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const api = {
  // --- Rutas de Cursos (sin cambios) ---
  getCourses: () => {
    return apiClient.get('api/courses/');
  },
  getCourseDetail: (id) => {
    return apiClient.get(`api/courses/${id}/`);
  },

  // --- RUTAS DE AUTENTICACIÓN (MODIFICADAS) ---
  
  /**
   * @param {object} credentials - { username, password }
   * dj-rest-auth usa /api/auth/login/ y devuelve los tokens
   */
  login: (credentials) => {
    return apiClient.post('api/auth/login/', credentials);
  },

  /**
   * dj-rest-auth usa /api/auth/logout/
   */
  logout: () => {
    return apiClient.post('api/auth/logout/');
  },
  
  /**
   * @param {object} userData - { username, email, password, password2 }
   * dj-rest-auth usa /api/auth/registration/
   */
  register: (userData) => {
    return apiClient.post('api/auth/registration/', userData);
  },

  /**
   * dj-rest-auth usa /api/auth/user/ para obtener datos del usuario
   * (reemplaza nuestro antiguo /api/me/)
   */
  getMe: () => {
    return apiClient.get('api/auth/user/');
  }
};