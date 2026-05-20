import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Scenarios from './pages/Scenarios'
import Config from './pages/Config'
import Kanban from './pages/Kanban'
import Runs from './pages/Runs'
import './styles/App.css'

function AppContent() {
  const location = useLocation()
  const isKanban = location.pathname === '/kanban'

  return (
    <div className="app">
      <Header />
      <main className={isKanban ? 'main main-wide' : 'main'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scenario" element={<Scenarios />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/run" element={<Runs />} />
          <Route path="/config" element={<Config />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

function Header() {
  const location = useLocation()

  return (
    <header className="header">
      <Link to="/" className="header-brand">QA Track</Link>
      <nav className="header-nav">
        <Link to="/kanban" className={location.pathname === '/kanban' ? 'active' : ''}>
          Kanban
        </Link>
        <Link to="/run" className={location.pathname === '/run' ? 'active' : ''}>
          Runs
        </Link>
        <Link to="/scenario" className={location.pathname === '/scenario' ? 'active' : ''}>
          Cenários
        </Link>
        <Link to="/config" className={location.pathname === '/config' ? 'active' : ''}>
          Configuração
        </Link>
      </nav>
    </header>
  )
}

export default App
