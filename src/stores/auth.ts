import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { create } from 'zustand'

import api from '../apis'

export interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  phone: string
  avatar_url?: string | null
  is_verified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  loading: boolean
  hydrated: boolean
  error: string | null
  isAuthenticated: boolean
  hydrate: () => Promise<void>
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (userData: {
    first_name: string
    last_name: string
    username: string
    email: string
    phone: string
    password: string
    password_confirmation: string
  }) => Promise<void>
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  clearAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  loading: false,
  hydrated: false,
  error: null,
  isAuthenticated: false,

  // AsyncStorage is async, so the app calls hydrate() once at startup
  // (the web templates read localStorage synchronously instead).
  hydrate: async () => {
    const token = await AsyncStorage.getItem('token')
    const refreshToken = await AsyncStorage.getItem('refreshToken')
    set({ token, refreshToken, isAuthenticated: !!token, hydrated: true })
    if (token) {
      await get().fetchCurrentUser()
    }
  },

  clearAuth: async () => {
    await AsyncStorage.multiRemove(['token', 'refreshToken'])
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  },

  login: async (usernameOrEmail: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const res = await api.auth.login({ usernameOrEmail, password })
      const data = res.data.data
      await AsyncStorage.setItem('token', data.token)
      await AsyncStorage.setItem('refreshToken', data.refreshToken)
      set({
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
        isAuthenticated: true,
        loading: false,
      })
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Login failed'
        : 'Login failed'
      set({ error: message, loading: false })
      throw err
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null })
    try {
      await api.auth.register(userData)
      set({ loading: false })
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Registration failed'
        : 'Registration failed'
      set({ error: message, loading: false })
      throw err
    }
  },

  logout: async () => {
    try {
      await api.auth.logout()
    } catch {
      // ignore
    } finally {
      await get().clearAuth()
    }
  },

  fetchCurrentUser: async () => {
    if (!get().token) return
    try {
      const res = await api.user.getCurrentUser()
      set({ user: res.data.data.user })
    } catch {
      await get().clearAuth()
    }
  },
}))
