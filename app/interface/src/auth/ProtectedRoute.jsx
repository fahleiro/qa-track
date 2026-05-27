/**
 * ============================================================
 *  ARQUIVO: interface/src/auth/ProtectedRoute.jsx
 * ============================================================
 *  Wrapper de rotas (via <Outlet />) que exige usuário autenticado.
 *  Se carregando, mostra estado neutro. Se sem usuário, redireciona
 *  para /login preservando o caminho original (`from`) no state
 *  para retomar após login.
 * ============================================================
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div className="empty"><div className="empty-text">Carregando…</div></div>
    }
    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />
    }
    return <Outlet />
}
