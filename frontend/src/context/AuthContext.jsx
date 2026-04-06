import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, getMe } from '../api/auth';

const AuthContext = createContext(null);

/**
 * AuthProvider
 * Maneja estado global de autenticación
 * 
 * @example
 * // En App.jsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // En cualquier componente
 * const { user, login, logout } = useAuth();
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Inicializar: verificar si hay token guardado
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verificar que el token sigue siendo válido
          const { data } = await getMe();
          setUser(data.user);
        } catch (err) {
          // Token inválido, limpiar
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login
   */
  const login = async (email, password) => {
    setError(null);
    try {
      const { token, user: userData } = await loginApi(email, password);
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Logout
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  /**
   * Actualizar datos del usuario
   */
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isCajero: user?.role === 'cajero',
    isPanadero: user?.role === 'panadero'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar auth
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export default AuthContext;