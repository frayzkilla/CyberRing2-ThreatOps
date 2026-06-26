import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { getStoredUser, clearUser, registerUser, loginUser, changePassword as changePasswordApi } from '../api'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const login = useCallback(async (username: string, password: string) => {
    const u = await loginUser(username, password)
    setUser(u)
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const u = await registerUser(username, password)
    setUser(u)
  }, [])

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    await changePasswordApi(oldPassword, newPassword)
  }, [])

  const logout = useCallback(() => {
    clearUser()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
