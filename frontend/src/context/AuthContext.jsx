import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

/**
 * AuthProvider - Inicializa Zustand store al montar
 */
export function AuthProvider({ children }) {
  const { init, loading } = useAuthStore()

  useEffect(() => {
    init()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return children
}

/**
 * Hook para usar auth (compatible con código anterior)
 */
export function useAuth() {
  const { user, loading, error, login, logout, token } = useAuthStore()
  
  return {
    user,
    loading,
    error,
    login,
    logout,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isCajero: user?.role === 'cajero',
    isPanadero: user?.role === 'panadero',
  }
}