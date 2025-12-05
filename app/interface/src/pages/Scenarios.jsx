import { useState, useEffect } from 'react'
import { scenariosAPI, systemsAPI } from '../services/api'
import ScenarioModal from '../components/scenarioModal'
import { suitesAPI } from '../services/api'

export default function Scenarios() {
  const [scenarios, setScenarios] = useState([])
  const [systems, setSystems] = useState([])
  const [suites, setSuites] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filtros
  const [scenarioFilter, setScenarioFilter] = useState('')
  const [selectedSystems, setSelectedSystems] = useState([])
  
  // Modal
  const [showScenarioModal, setShowScenarioModal] = useState(false)
  const [editingScenario, setEditingScenario] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [scenariosData, systemsData, suitesData] = await Promise.all([
        scenariosAPI.getAll(),
        systemsAPI.getAll(),
        suitesAPI.getAll()
      ])
      setScenarios(scenariosData)
      setSystems(systemsData)
      setSuites(suitesData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSystemToggle = (systemId) => {
    setSelectedSystems(prev => {
      const isSelected = prev.includes(systemId)
      return isSelected 
        ? prev.filter(id => id !== systemId)
        : [...prev, systemId]
    })
  }

  const addSystemFilter = (systemId) => {
    if (!selectedSystems.includes(systemId)) {
      setSelectedSystems(prev => [...prev, systemId])
    }
  }

  const removeSystemFilter = (systemId) => {
    setSelectedSystems(prev => prev.filter(id => id !== systemId))
  }

  const clearFilters = () => {
    setScenarioFilter('')
    setSelectedSystems([])
  }

  const openScenarioModal = (scenario = null) => {
    setEditingScenario(scenario)
    setShowScenarioModal(true)
  }

  const closeScenarioModal = () => {
    setShowScenarioModal(false)
    setEditingScenario(null)
  }

  const deleteScenario = async (id) => {
    if (!confirm('Tem certeza que deseja apagar este cenário?')) return
    try {
      await scenariosAPI.delete(id)
      await loadData()
    } catch (error) {
      console.error('Erro ao apagar cenário:', error)
    }
  }

  // Filtrar cenários
  const filteredScenarios = scenarios.filter(scenario => {
    // Filtro por ID/sequencial
    if (scenarioFilter.trim()) {
      const filter = scenarioFilter.trim().toLowerCase()
      const matchId = scenario.id.toString().includes(filter)
      const matchTitle = scenario.title.toLowerCase().includes(filter)
      if (!matchId && !matchTitle) return false
    }
    
    // Filtro por sistemas
    if (selectedSystems.length > 0) {
      const scenarioSystemIds = scenario.systems ? scenario.systems.map(s => s.id) : []
      const hasAllSystems = selectedSystems.every(sysId => scenarioSystemIds.includes(sysId))
      if (!hasAllSystems) return false
    }
    
    return true
  })

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #ddd'
      }}>
        <h2 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Cenários</h2>
        <button
          onClick={() => openScenarioModal()}
          style={{ 
            padding: '10px 16px',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-blue)',
            color: 'var(--color-blue)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--color-blue)'
            e.target.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent'
            e.target.style.color = 'var(--color-blue)'
          }}
        >
          + Novo Cenário
        </button>
      </div>

      {/* Filtros */}
      <div style={{ 
        padding: '16px', 
        border: '1px solid #ddd',
        borderRadius: '6px',
        marginBottom: '24px',
        backgroundColor: 'white'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '12px' 
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-blue)' }}>Filtros</span>
          {(scenarioFilter || selectedSystems.length > 0) && (
            <button
              onClick={clearFilters}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: 'transparent',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              Limpar
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Linha 1: ID ou Título */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '12px',
              color: '#666'
            }}>
              ID ou Título
            </label>
            <input
              type="text"
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
              placeholder="Buscar..."
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Linha 2: Sistemas */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '12px',
              color: '#666'
            }}>
              Sistemas
            </label>
            
            {/* Sistemas selecionados com scroll horizontal */}
            <div style={{ 
              display: 'flex', 
              gap: '6px',
              padding: '8px',
              minHeight: '36px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              backgroundColor: '#fafafa',
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap'
            }}>
              {selectedSystems.length === 0 ? (
                <span style={{ color: '#999', fontSize: '13px' }}>
                  Nenhum selecionado
                </span>
              ) : (
                selectedSystems.map(systemId => {
                  const system = systems.find(s => s.id === systemId)
                  return system ? (
                    <span
                      key={systemId}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        backgroundColor: 'var(--color-blue)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        flexShrink: 0
                      }}
                    >
                      {system.description}
                      <button
                        onClick={() => removeSystemFilter(systemId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          padding: '0 2px',
                          fontSize: '14px',
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ) : null
                })
              )}
            </div>

            {/* Lista de sistemas disponíveis */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '4px',
              marginTop: '6px'
            }}>
              {systems.filter(s => !selectedSystems.includes(s.id)).map(system => (
                <button
                  key={system.id}
                  onClick={() => addSystemFilter(system.id)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: 'transparent',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  + {system.description}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '12px' 
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-blue)' }}>
            Resultados
          </span>
          <span style={{ 
            padding: '2px 8px', 
            backgroundColor: 'var(--color-blue)', 
            color: 'white', 
            borderRadius: '10px', 
            fontSize: '11px'
          }}>
            {filteredScenarios.length}
          </span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Carregando...
          </div>
        ) : filteredScenarios.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            border: '1px solid #ddd',
            borderRadius: '6px',
            color: '#999'
          }}>
            Nenhum cenário encontrado.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredScenarios.map(scenario => {
              const suite = suites.find(s => s.id === scenario.suite_id)
              return (
                <div 
                  key={scenario.id} 
                  style={{ 
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onClick={() => openScenarioModal(scenario)}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#ddd'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--color-blue)',
                        fontWeight: '600'
                      }}>
                        #{scenario.id}
                      </span>
                      <span style={{ fontWeight: '500', fontSize: '14px', color: 'var(--color-blue)' }}>
                        {scenario.title}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {suite && (
                        <span style={{ 
                          padding: '2px 6px', 
                          border: '1px solid #ddd',
                          borderRadius: '3px', 
                          fontSize: '11px',
                          color: '#666'
                        }}>
                          {suite.title}
                        </span>
                      )}
                      {scenario.systems && scenario.systems.map(system => (
                        <span 
                          key={system.id}
                          style={{ 
                            padding: '2px 6px', 
                            border: '1px solid var(--color-blue)',
                            borderRadius: '3px', 
                            fontSize: '11px',
                            color: 'var(--color-blue)'
                          }}
                        >
                          {system.description}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteScenario(scenario.id)
                    }}
                    style={{ 
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#999',
                      fontSize: '16px',
                      padding: '4px 8px',
                      marginLeft: '12px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#e53935'}
                    onMouseLeave={(e) => e.target.style.color = '#999'}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Cenário */}
      <ScenarioModal
        show={showScenarioModal}
        onClose={closeScenarioModal}
        scenario={editingScenario}
        suites={suites}
        onSave={loadData}
      />
    </div>
  )
}
