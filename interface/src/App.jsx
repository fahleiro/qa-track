import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Config from './pages/Config'
import TestRuns from './pages/Run'
import Scenarios from './pages/Scenarios'
import Flow from './pages/Flow'

function App() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.body.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.body.setAttribute('data-theme', newTheme)
  }

  return (
    <BrowserRouter>
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/suite/:suiteId" element={<Home />} />
        <Route path="/scenario/:scenarioId" element={<Home />} />
        <Route path="/suite/:suiteId/scenario/:scenarioId" element={<Home />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="/runs" element={<TestRuns />} />
        <Route path="/flow" element={<Flow />} />
        <Route path="/flow/:flowId" element={<Flow />} />
        <Route path="/config" element={<Config />} />
      </Routes>
    </BrowserRouter>
  )
}

function Header({ theme, toggleTheme }) {
  const location = useLocation()

  return (
    <header className="main-header">
      <h1>qa-test-track</h1>
      <nav className="header-nav">
        <Link to="/home">
          <button 
            className={`nav-btn ${location.pathname === '/' || location.pathname === '/home' || location.pathname.startsWith('/suite/') || (location.pathname.startsWith('/scenario/') && !location.pathname.startsWith('/scenarios')) ? 'active' : ''}`}
          >
            Suites & Cenários
          </button>
        </Link>
        <Link to="/scenarios">
          <button 
            className={`nav-btn ${location.pathname === '/scenarios' ? 'active' : ''}`}
          >
            Cenários
          </button>
        </Link>
        <Link to="/runs">
          <button 
            className={`nav-btn ${location.pathname === '/runs' ? 'active' : ''}`}
          >
            Execuções
          </button>
        </Link>
        <Link to="/flow">
          <button 
            className={`nav-btn ${location.pathname.startsWith('/flow') ? 'active' : ''}`}
          >
            Flow
          </button>
        </Link>
        <Link to="/config">
          <button 
            className={`nav-btn ${location.pathname === '/config' ? 'active' : ''}`}
          >
            Configurações
          </button>
        </Link>
      </nav>
    </header>
  )
}

export default App
