import axios from 'axios';

const api = maxios.create({
  const api = axios.create({
  baseURL: 'https://tu-api.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    
    if (token && config.headers) {
      // Adjuntamos el token automáticamente a todas las peticiones
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- INTERCEPTOR DE RESPUESTA (Response) ---
// Se ejecuta CUANDO el servidor responde
api.interceptors.response.use(
  (response) => response,
 async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos intentado re-reintentar aún
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        // Llamamos a un endpoint especial para renovar el token
        const res = await axios.post('https://tu-api.com/api/refresh', { token: refreshToken });
        
        const { accessToken } = res.data;
        localStorage.setItem('auth_token', accessToken);

        // Reintentamos la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresh token también falló, al login de cabeza
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
export default api;
