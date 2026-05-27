/**
 * ============================================================
 *  ARQUIVO: interface/src/components/Header.jsx
 * ============================================================
 *  Navbar superior, com link para Device Farm e dropdown do
 *  usuário (logout). Extraído de App.jsx da v0.1.x.
 * ============================================================
 */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const NAV = [
    { to: '/kanban',      label: 'Kanban' },
    { to: '/run',         label: 'Runs' },
    { to: '/scenario',    label: 'Cenários' },
    { to: '/device-farm', label: 'Device Farm' },
    { to: '/config',      label: 'Configuração' },
]

export default function Header() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuth()

    async function handleLogout() {
        await logout()
        navigate('/login', { replace: true })
    }

    return (
        <header className="header">
            <Link to="/" className="header-brand">QA Track</Link>

            <nav className="header-nav">
                {NAV.map(item => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={location.pathname.startsWith(item.to) ? 'active' : ''}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="header-user">
                <span className="header-user-name">{user?.username}</span>
                <button className="btn btn-sm btn-ghost" onClick={handleLogout}>Sair</button>
            </div>
        </header>
    )
}
