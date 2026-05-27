/**
 * ============================================================
 *  ARQUIVO: interface/src/auth/AuthContext.jsx
 * ============================================================
 *  Context API que mantém estado de autenticação na árvore React:
 *  user atual, status de carregamento e ações login/logout.
 *
 *  Notas:
 *   - Provider envolve <App /> no App.jsx.
 *   - Consumido via `useAuth()` em ProtectedRoute, Header, Login.
 *   - Token JWT vive no localStorage (gerenciado por services/api.js,
 *     storage key `qa_track_jwt`). Este contexto guarda apenas
 *     dados do usuário (não-sensíveis).
 * ============================================================
 */

import { createContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authAPI.hasToken()) { setLoading(false); return }
        authAPI.me()
            .then(setUser)
            .catch(() => authAPI.clearToken())
            .finally(() => setLoading(false))
    }, [])

    const login = useCallback(async (username, password) => {
        const data = await authAPI.login(username, password)
        setUser(data.user)
        return data.user
    }, [])

    const logout = useCallback(async () => {
        await authAPI.logout()
        setUser(null)
    }, [])

    const refreshUser = useCallback(async () => {
        const u = await authAPI.me()
        setUser(u)
        return u
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}
