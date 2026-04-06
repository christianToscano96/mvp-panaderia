import api from './axios';

/**
 * Auth API Service
 * Endpoints de autenticación
 */

/**
 * POST /auth/login
 * @param {{ email: string, password: string }}
 * @returns {{ token, user }}
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * GET /auth/me
 * Obtener usuario actual
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * POST /auth/register
 * Registrar nuevo usuario
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export default {
  login,
  getMe,
  register
};