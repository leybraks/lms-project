import axios from 'axios';

// 1. La URL de tu backend
const API_URL = 'https://lms-project-production-39d6.up.railway.app'; 

console.log("🔌 Conectando forzosamente a:", API_URL);
// 2. Creamos una instancia "personalizada" de Axios
const axiosInstance = axios.create({
    baseURL: API_URL,
});

// 3. ¡LA MAGIA! (El Interceptor de Petición)
// Esto se ejecuta ANTES de que cualquier petición (get, post, put) se envíe.
axiosInstance.interceptors.request.use(
    (config) => {
        // No queremos enviar el token al hacer login o registro
        if (config.url === '/api/auth/login/' || config.url === '/api/auth/registration/') {
            return config;
        }

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

// 7. Exportamos la instancia para usarla en toda nuestra app
export default axiosInstance;