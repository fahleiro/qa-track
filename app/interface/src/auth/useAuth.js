/**
 * Hook utilitário para consumir o AuthContext.
 * Lança erro se usado fora do Provider para detectar bugs cedo.
 */

import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
    return ctx
}
