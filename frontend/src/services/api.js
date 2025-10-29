// frontend/src/services/api.js

import axios from 'axios';

// 1. Define la URL base de tu API de Django
const API_BASE_URL = 'http://127.0.0.1:8000/api/';

// 2. Crea una "instancia" de axios pre-configurada
let apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
apiClient.interceptors.request.use(
  (config) => {
    // Obtiene el token de localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Si el token existe, lo añade a la cabecera 'Authorization'
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// 3. Exporta un objeto con todos tus "endpoints"
// Por ahora, solo tenemos uno:
export const api = {
  getCourses: () => {
    return apiClient.get('courses/');
  },
  getCourseDetail: (id) => {
    return apiClient.get(`courses/${id}/`);
  },
  login: (credentials) => {
    // Nota: SimpleJWT usa 'username', no 'email', por defecto.
    // Usaremos el 'username' del superuser.
    return apiClient.post('token/', credentials);
  },
  getMe: () => {
    return apiClient.get('me/');
  }

};