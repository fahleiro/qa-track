/**
 * ============================================================
 *  ARQUIVO: interface/src/App.jsx
 * ============================================================
 *  Root da aplicação React.
 *    - AuthProvider envolve toda a árvore (sessão JWT no localStorage).
 *    - Rota pública:    /login
 *    - Rotas protegidas: tudo o resto (via <ProtectedRoute />).
 *
 *  v0.2.0: introduz autenticação por JWT e a página /device-farm.
 *  As páginas legadas (cenários, runs, kanban, config) continuam
 *  funcionando — agora exigindo login.
 * ============================================================
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import Header from './components/Header'
import Login from './pages/Login'
import Home from './pages/Home'
import Scenarios from './pages/Scenarios'
import Runs from './pages/Runs'
import Kanban from './pages/Kanban'
import Config from './pages/Config'
import DeviceFarm from './pages/DeviceFarm'
import DeviceDetail from './pages/DeviceDetail'
import './styles/App.css'

function ProtectedShell() {
  const location = useLocation()
  const isKanban = location.pathname === '/kanban'
  return (
    <div className="app">
      <Header />
      <main className={isKanban ? 'main main-wide' : 'main'}>
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/scenario"          element={<Scenarios />} />
          <Route path="/kanban"            element={<Kanban />} />
          <Route path="/run"               element={<Runs />} />
          <Route path="/device-farm"       element={<DeviceFarm />} />
          <Route path="/device-farm/:udid" element={<DeviceDetail />} />
          <Route path="/config"            element={<Config />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="*" element={<ProtectedShell />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
