/**
 * ============================================================
 *  ARQUIVO: interface/src/pages/Login.jsx
 * ============================================================
 *  Tela de login. POST /api/auth/login → salva JWT, redireciona
 *  para a rota original (ou /). Default admin/admin documentado
 *  no card para facilitar primeiros acessos.
 * ============================================================
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from || '/'

    const [username, setUsername] = useState('admin')
    const [password, setPassword] = useState('admin')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await login(username, password)
            navigate(from, { replace: true })
        } catch (err) {
            setError(err.message || 'Falha no login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleSubmit}>
                <h1 className="login-title">QA Track</h1>
                <p className="login-sub">entrar</p>

                <div className="form-group">
                    <label className="form-label">Usuário</label>
                    <input
                        className="form-input"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Senha</label>
                    <input
                        className="form-input"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="login-error">{error}</div>}

                <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
                    {loading ? 'Entrando…' : 'Entrar'}
                </button>

                <p className="login-hint">Default: <code>admin</code> / <code>admin</code></p>
            </form>
        </div>
    )
}
