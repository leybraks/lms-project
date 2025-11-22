import axios from 'axios';

// 1. Detección Inteligente de URL
// Vite expone las variables de entorno en import.meta.env
// Si VITE_API_URL existe (Producción), úsala. Si no (Local), usa localhost.
const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

console.log("🌐 Conectando a:", baseURL); // Para depuración

const axiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 10000, // 10 segundos de espera máximo
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// 2. Interceptor (Tu lógica de Tokens estaba perfecta, mantenla)
axiosInstance.interceptors.request.use(
    (config) => {
        // Excepciones para endpoints públicos
        if (config.url.includes('/auth/login/') || config.url.includes('/auth/registration/')) {
            return config;
        }

        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;