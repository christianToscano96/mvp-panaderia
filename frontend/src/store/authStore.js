import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/axios'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: true,
      error: null,

      // Inicializar - verificar token al iniciar
      init: async () => {
        const token = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')

        if (!token || !savedUser) {
          set({ loading: false, user: null, token: null })
          return
        }

        try {
          // Verificar que el token sigue siendo válido
          const res = await api.get('/auth/me')
          set({ user: res.data.user, token, loading: false })
        } catch (err) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          set({ user: null, token: null, loading: false })
        }
      },

      // Login
      login: async (email, password) => {
        set({ error: null, loading: true })
        try {
          const res = await api.post('/auth/login', { email, password })
          const { token, user } = res.data
          
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          
          set({ user, token, loading: false, error: null })
          return user
        } catch (err) {
          const message = err.response?.data?.message || 'Error al iniciar sesión'
          set({ error: message, loading: false })
          throw new Error(message)
        }
      },

      // Logout
      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, token: null, loading: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)