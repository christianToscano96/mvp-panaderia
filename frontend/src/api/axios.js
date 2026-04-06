import axios from 'axios';

const API_URL = '/api';

/**
 * Cliente Axios configurado para Panadería API
 * - Adjunta token automáticamente
 * - Maneja 401 (redirige a login)
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Interceptor de request: agregar token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de response: manejar errores
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Error 401:	token inválido o expirado
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      //Solo redirect si no es la ruta de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;