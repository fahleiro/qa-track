import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
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
            <Route path="/" element={<Home />} />
            <Route path="/scenario" element={<Scenarios />} />
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
      <Link to="/" className="header-brand">QA Track</Link>
      <nav className="header-nav">
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
