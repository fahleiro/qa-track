import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { scenariosAPI } from '../services/Api'
import ScenarioModal from '../components/scenarioModal'
import SuiteSidebar from '../components/suiteSidebar'

export default function Home() {
  const { suiteId, scenarioId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [suites, setSuites] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [selectedSuiteId, setSelectedSuiteId] = useState(null)
  
  // Modal de cenário
  const [showScenarioModal, setShowScenarioModal] = useState(false)
  const [editingScenario, setEditingScenario] = useState(null)

  useEffect(() => {
    loadScenarios()
  }, [])

  // Sincroniza o selectedSuiteId com o parâmetro da URL
  useEffect(() => {
    if (suiteId) {
      const parsedId = parseInt(suiteId, 10)
      if (!isNaN(parsedId)) {
        setSelectedSuiteId(parsedId)
      }
    } else {
      setSelectedSuiteId(null)
    }
  }, [suiteId])

  // Sincroniza o modal com o scenarioId da URL
  useEffect(() => {
    if (scenarioId) {
      const parsedId = parseInt(scenarioId, 10)
      if (!isNaN(parsedId) && scenarios.length > 0) {
        const scenario = scenarios.find(s => s.id === parsedId)
        if (scenario) {
          setEditingScenario(scenario)
          setShowScenarioModal(true)
        } else {
          // Cenário não encontrado, volta para a rota anterior
          if (selectedSuiteId) {
            navigate(`/suite/${selectedSuiteId}`)
          } else {
            navigate('/home')
          }
        }
      }
    } else {
      // Se não há scenarioId na URL e não estamos navegando para um cenário, fecha o modal
      if (!location.pathname.includes('/scenario/')) {
        setShowScenarioModal(false)
        setEditingScenario(null)
      }
    }
  }, [scenarioId, scenarios, location.pathname, selectedSuiteId, navigate])

  const loadScenarios = async () => {
    try {
      const scenariosData = await scenariosAPI.getAll()
      setScenarios(scenariosData)
    } catch (error) {
      console.error('Erro ao carregar cenários:', error)
    }
  }

  const handleSuiteChange = (suiteId) => {
    setSelectedSuiteId(suiteId)
  }

  const handleSuitesChange = (suitesData) => {
    setSuites(suitesData)
  }

  const openScenarioModal = (scenario = null) => {
    if (scenario) {
      // Navega para a rota do cenário
      if (selectedSuiteId) {
        navigate(`/suite/${selectedSuiteId}/scenario/${scenario.id}`)
      } else {
        navigate(`/scenario/${scenario.id}`)
      }
    } else {
      // Novo cenário - não altera a URL
      setEditingScenario(null)
      setShowScenarioModal(true)
    }
  }

  const closeScenarioModal = () => {
    setShowScenarioModal(false)
    setEditingScenario(null)
    // Volta para a rota anterior apenas se houver scenarioId na URL
    if (scenarioId) {
      if (selectedSuiteId) {
        navigate(`/suite/${selectedSuiteId}`)
      } else {
        navigate('/home')
      }
    }
  }

  const deleteScenario = async (id) => {
    if (!confirm('Tem certeza que deseja apagar este cenário?')) return
    try {
      await scenariosAPI.delete(id)
      await loadScenarios()
      // Se o cenário deletado estava aberto, fecha o modal e volta
      if (editingScenario?.id === id) {
        closeScenarioModal()
      }
    } catch (error) {
      console.error('Erro ao apagar cenário:', error)
    }
  }

  const filteredScenarios = selectedSuiteId === null 
    ? scenarios 
    : scenarios.filter(scenario => scenario.suite_id === selectedSuiteId)

  return (
    <div className="main-container">
      {/* Sidebar - Suites */}
      <SuiteSidebar
        selectedSuiteId={selectedSuiteId}
        onSuiteChange={handleSuiteChange}
        onSuitesChange={handleSuitesChange}
      />

      {/* Content - Cenários */}
      <main className="content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>Cenários de Teste</h2>
          <button
            className="btn-save"
            onClick={() => openScenarioModal()}
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            ➕ Novo Cenário
          </button>
        </div>
        <ul>
          {filteredScenarios.map(scenario => {
            const suite = suites.find(s => s.id === scenario.suite_id)
            return (
              <li key={scenario.id} className={scenario.suite_id ? 'has-suite' : 'no-suite'}>
                <div className="test-desc" onClick={() => openScenarioModal(scenario)}>
                  <div className="test-content">
                    <span className="test-title">{scenario.title}</span>
                    {scenario.suite_id && selectedSuiteId === null && suite && (
                      <span className="test-suite-tag">📁 {suite.title}</span>
                    )}
                    {!scenario.suite_id && selectedSuiteId === null && (
                      <span className="test-suite-tag no-suite-tag">🔓 Sem suite</span>
                    )}
                  </div>
                  <span className="test-action-hint">Clique para editar</span>
                </div>
                <button
                  className="trash-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteScenario(scenario.id)
                  }}
                >
                  🗑️
                </button>
              </li>
            )
          })}
        </ul>
      </main>

      {/* Modal de Criar/Editar Cenário */}
      <ScenarioModal
        show={showScenarioModal}
        onClose={closeScenarioModal}
        scenario={editingScenario}
        suites={suites}
        defaultSuiteId={selectedSuiteId}
        onSave={loadScenarios}
      />
    </div>
  )
}
