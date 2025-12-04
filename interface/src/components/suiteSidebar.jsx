import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { suitesAPI } from '../services/Api'

export default function SuiteSidebar({ 
  selectedSuiteId: propSelectedSuiteId,
  onSuiteChange,
  onSuitesChange
}) {
  const navigate = useNavigate()
  const [suiteInput, setSuiteInput] = useState('')
  const [suiteDescInput, setSuiteDescInput] = useState('')
  const [selectedSuiteId, setSelectedSuiteId] = useState(propSelectedSuiteId ?? null)
  const [suites, setSuites] = useState([])

  // Carrega suites ao montar o componente
  useEffect(() => {
    loadSuites()
  }, [])

  // Sincroniza o estado interno com a prop quando ela mudar (vinda da URL)
  useEffect(() => {
    setSelectedSuiteId(propSelectedSuiteId ?? null)
  }, [propSelectedSuiteId])

  // Notifica o componente pai quando a suite selecionada mudar
  useEffect(() => {
    if (onSuiteChange) {
      onSuiteChange(selectedSuiteId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSuiteId])

  // Notifica o componente pai quando as suites mudarem
  useEffect(() => {
    if (onSuitesChange) {
      onSuitesChange(suites)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suites])

  const loadSuites = async () => {
    try {
      const suitesData = await suitesAPI.getAll()
      setSuites(suitesData)
    } catch (error) {
      console.error('Erro ao carregar suites:', error)
    }
  }

  const createSuite = async () => {
    if (!suiteInput.trim()) return
    try {
      await suitesAPI.create(suiteInput.trim(), suiteDescInput.trim() || null)
      setSuiteInput('')
      setSuiteDescInput('')
      await loadSuites()
    } catch (error) {
      console.error('Erro ao criar suite:', error)
      alert('Erro ao criar suite.')
    }
  }

  const deleteSuite = async (id) => {
    if (!confirm('Tem certeza que deseja apagar esta suite?')) return
    try {
      await suitesAPI.delete(id)
      await loadSuites()
      if (selectedSuiteId === id) {
        setSelectedSuiteId(null)
        navigate('/home')
      }
    } catch (error) {
      console.error('Erro ao apagar suite:', error)
    }
  }

  const handleSuiteSelect = (suiteId) => {
    setSelectedSuiteId(suiteId)
    if (suiteId === null) {
      navigate('/home')
    } else {
      navigate(`/suite/${suiteId}`)
    }
  }

  return (
    <aside className="sidebar">
      <h2>Suites de Teste</h2>
      <div className="input-group">
        <input
          id="suite_search_input"
          type="text"
          value={suiteInput}
          onChange={(e) => setSuiteInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && suiteInput.trim() && createSuite()}
          placeholder="Nome da suite..."
        />
        <button
          id="suite_create_button"
          className={suiteInput.trim() ? 'active' : ''}
          disabled={!suiteInput.trim()}
          onClick={createSuite}
        >
        </button>
      </div>
      <ul>
        <li
          className={selectedSuiteId === null ? 'active' : ''}
          onClick={() => handleSuiteSelect(null)}
        >
          Mostrar Todos os Cenários
        </li>
        {suites.map(suite => (
          <li
            key={suite.id}
            className={selectedSuiteId === suite.id ? 'active' : ''}
            onClick={() => handleSuiteSelect(suite.id)}
          >
            <span className="suite-desc">{suite.title}</span>
            <button
              className="trash-btn"
              onClick={(e) => {
                e.stopPropagation()
                deleteSuite(suite.id)
              }}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}