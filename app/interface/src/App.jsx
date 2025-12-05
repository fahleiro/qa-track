import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Scenarios from './pages/Scenarios'
import Config from './pages/Config'
import './styles/App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<Scenarios />} />
            <Route path="/config" element={<Config />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function Header() {
  const location = useLocation()
  
  return (
    <header className="header">
      <div className="header-brand">QA Track</div>
      <nav className="header-nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
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
