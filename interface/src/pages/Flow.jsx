import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { flowsAPI, scenariosAPI } from '../services/api'

export default function Flow() {
  const { flowId } = useParams()
  const navigate = useNavigate()
  
  const [flows, setFlows] = useState([])
  const [selectedFlowId, setSelectedFlowId] = useState(null)
  const [currentFlow, setCurrentFlow] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [newFlowTitle, setNewFlowTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  const [allScenarios, setAllScenarios] = useState([])
  const [flowScenarios, setFlowScenarios] = useState([])
  const [scenarioToAdd, setScenarioToAdd] = useState('')
  
  const [selectedScenario, setSelectedScenario] = useState(null)

  useEffect(() => {
    loadFlows()
    loadScenarios()
  }, [])

  useEffect(() => {
    if (flowId) {
      const parsedId = parseInt(flowId, 10)
      if (!isNaN(parsedId)) {
        setSelectedFlowId(parsedId)
        loadFlowDetails(parsedId)
      }
    } else {
      setSelectedFlowId(null)
      setCurrentFlow(null)
      setFlowScenarios([])
    }
  }, [flowId])

  const loadFlows = async () => {
    try {
      const data = await flowsAPI.getAll()
      setFlows(data)
    } catch (error) {
      console.error('Erro ao carregar flows:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadScenarios = async () => {
    try {
      const data = await scenariosAPI.getAll()
      setAllScenarios(data)
    } catch (error) {
      console.error('Erro ao carregar cenários:', error)
    }
  }

  const loadFlowDetails = async (id) => {
    try {
      const data = await flowsAPI.getById(id)
      setCurrentFlow(data)
      setFlowScenarios(data.scenarios || [])
    } catch (error) {
      console.error('Erro ao carregar detalhes do flow:', error)
    }
  }

  const createFlow = async () => {
    if (!newFlowTitle.trim()) return
    try {
      const newFlow = await flowsAPI.create(newFlowTitle.trim())
      setNewFlowTitle('')
      setIsCreating(false)
      await loadFlows()
      navigate(`/flow/${newFlow.id}`)
    } catch (error) {
      console.error('Erro ao criar flow:', error)
      alert('Erro ao criar flow.')
    }
  }

  const deleteFlow = async (id) => {
    if (!confirm('Tem certeza que deseja apagar este flow?')) return
    try {
      await flowsAPI.delete(id)
      await loadFlows()
      if (selectedFlowId === id) {
        navigate('/flow')
      }
    } catch (error) {
      console.error('Erro ao apagar flow:', error)
    }
  }

  const handleFlowSelect = (id) => {
    navigate(`/flow/${id}`)
  }

  const addScenarioToFlow = async () => {
    if (!scenarioToAdd || !selectedFlowId) return
    
    try {
      await flowsAPI.addScenario(selectedFlowId, parseInt(scenarioToAdd))
      setScenarioToAdd('')
      await loadFlowDetails(selectedFlowId)
    } catch (error) {
      console.error('Erro ao adicionar cenário:', error)
      alert(error.message || 'Erro ao adicionar cenário')
    }
  }

  const removeScenarioFromFlow = async (scenarioId) => {
    if (!selectedFlowId) return
    
    try {
      await flowsAPI.removeScenario(selectedFlowId, scenarioId)
      await loadFlowDetails(selectedFlowId)
    } catch (error) {
      console.error('Erro ao remover cenário:', error)
    }
  }

  const moveScenario = async (scenarioId, direction) => {
    if (!selectedFlowId) return
    
    try {
      await flowsAPI.moveScenario(selectedFlowId, scenarioId, direction)
      await loadFlowDetails(selectedFlowId)
    } catch (error) {
      console.error('Erro ao mover cenário:', error)
    }
  }

  const availableScenarios = allScenarios.filter(
    s => !flowScenarios.some(fs => fs.scenario_id === s.id)
  )

  const inputStyle = {
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: 'white'
  }

  const btnStyle = {
    padding: '8px 16px',
    backgroundColor: 'var(--color-blue)',
    border: 'none',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ color: '#666' }}>Carregando...</p>
      </div>
    )
  }

  if (flows.length === 0 && !isCreating) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: '#999', marginBottom: '16px' }}>Nenhum flow criado</p>
        <button
          onClick={() => setIsCreating(true)}
          style={{
            ...btnStyle,
            backgroundColor: 'transparent',
            border: '1px solid var(--color-blue)',
            color: 'var(--color-blue)'
          }}
        >
          + Criar primeiro Flow
        </button>
        {isCreating && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <input
              type="text"
              value={newFlowTitle}
              onChange={(e) => setNewFlowTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createFlow()}
              placeholder="Nome do flow..."
              style={{ ...inputStyle, width: '250px' }}
              autoFocus
            />
            <button onClick={createFlow} disabled={!newFlowTitle.trim()} style={btnStyle}>Criar</button>
            <button 
              onClick={() => { setIsCreating(false); setNewFlowTitle('') }}
              style={{ ...btnStyle, backgroundColor: 'transparent', border: '1px solid #ddd', color: '#666' }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!selectedFlowId) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #ddd'
        }}>
          <h2 style={{ margin: 0 }}>Flows</h2>
          <button
            onClick={() => setIsCreating(true)}
            style={{
              ...btnStyle,
              backgroundColor: 'transparent',
              border: '1px solid var(--color-blue)',
              color: 'var(--color-blue)'
            }}
          >
            + Novo Flow
          </button>
        </div>

        {isCreating && (
          <div style={{ 
            padding: '16px', 
            border: '1px solid #ddd',
            borderRadius: '6px',
            marginBottom: '24px',
            backgroundColor: 'white',
            display: 'flex',
            gap: '10px'
          }}>
            <input
              type="text"
              value={newFlowTitle}
              onChange={(e) => setNewFlowTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createFlow()}
              placeholder="Nome do flow..."
              style={{ ...inputStyle, flex: 1 }}
              autoFocus
            />
            <button onClick={createFlow} disabled={!newFlowTitle.trim()} style={btnStyle}>Criar</button>
            <button 
              onClick={() => { setIsCreating(false); setNewFlowTitle('') }}
              style={{ ...btnStyle, backgroundColor: 'transparent', border: '1px solid #ddd', color: '#666' }}
            >
              Cancelar
            </button>
          </div>
        )}

        <select 
          value="" 
          onChange={(e) => handleFlowSelect(parseInt(e.target.value))}
          style={{ ...inputStyle, width: '100%' }}
        >
          <option value="" disabled>Selecione um flow...</option>
          {flows.map(flow => (
            <option key={flow.id} value={flow.id}>{flow.title}</option>
          ))}
        </select>
      </div>
    )
  }

  // Visualizador de flow
  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #ddd'
      }}>
        <h2 style={{ margin: 0 }}>{currentFlow?.title || 'Carregando...'}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={selectedFlowId || ''} 
            onChange={(e) => handleFlowSelect(parseInt(e.target.value))}
            style={{ ...inputStyle, minWidth: '180px' }}
          >
            {flows.map(flow => (
              <option key={flow.id} value={flow.id}>{flow.title}</option>
            ))}
          </select>
          <button
            onClick={() => setIsCreating(true)}
            style={{
              ...btnStyle,
              backgroundColor: 'transparent',
              border: '1px solid var(--color-blue)',
              color: 'var(--color-blue)',
              padding: '8px 12px'
            }}
          >
            +
          </button>
          <button
            onClick={() => deleteFlow(selectedFlowId)}
            style={{
              ...btnStyle,
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              color: '#999',
              padding: '8px 12px'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {isCreating && (
        <div style={{ 
          padding: '16px', 
          border: '1px solid #ddd',
          borderRadius: '6px',
          marginBottom: '24px',
          backgroundColor: 'white',
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={newFlowTitle}
            onChange={(e) => setNewFlowTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createFlow()}
            placeholder="Nome do flow..."
            style={{ ...inputStyle, flex: 1 }}
            autoFocus
          />
          <button onClick={createFlow} disabled={!newFlowTitle.trim()} style={btnStyle}>Criar</button>
          <button 
            onClick={() => { setIsCreating(false); setNewFlowTitle('') }}
            style={{ ...btnStyle, backgroundColor: 'transparent', border: '1px solid #ddd', color: '#666' }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Adicionar cenário */}
      <div style={{ 
        padding: '16px', 
        border: '1px solid #ddd',
        borderRadius: '6px',
        marginBottom: '24px',
        backgroundColor: 'white'
      }}>
        <span style={{ fontSize: '12px', color: '#666', fontWeight: '500', display: 'block', marginBottom: '10px' }}>
          Adicionar Cenário
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={scenarioToAdd}
            onChange={(e) => setScenarioToAdd(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="">Selecione um cenário...</option>
            {availableScenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>{scenario.title}</option>
            ))}
          </select>
          <button 
            onClick={addScenarioToFlow}
            disabled={!scenarioToAdd}
            style={{
              ...btnStyle,
              backgroundColor: scenarioToAdd ? 'var(--color-blue)' : '#ccc',
              cursor: scenarioToAdd ? 'pointer' : 'not-allowed'
            }}
          >
            + Adicionar
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '12px' 
      }}>
        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-blue)' }}>
          Cenários do Flow
        </span>
        <span style={{ 
          padding: '2px 8px', 
          backgroundColor: 'var(--color-blue)', 
          color: 'white', 
          borderRadius: '10px', 
          fontSize: '11px'
        }}>
          {flowScenarios.length}
        </span>
      </div>

      {/* START Node */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: flowScenarios.length > 0 ? '0' : '20px'
      }}>
        <div style={{
          padding: '8px 20px',
          backgroundColor: '#10B981',
          color: 'white',
          borderRadius: '16px',
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '1px'
        }}>
          START
        </div>
        {flowScenarios.length > 0 && (
          <div style={{ width: '2px', height: '20px', backgroundColor: '#ddd' }} />
        )}
      </div>

      {/* Cenários */}
      {flowScenarios.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          border: '1px solid #ddd',
          borderRadius: '6px',
          color: '#999'
        }}>
          Adicione cenários ao flow
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {flowScenarios.map((scenario, index) => (
            <div key={scenario.scenario_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
              {/* Card do cenário */}
              <div 
                style={{ 
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onClick={() => setSelectedScenario(scenario)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#ddd'}
              >
                {/* Setas de mover */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveScenario(scenario.scenario_id, 'up')
                    }}
                    disabled={index === 0}
                    style={{
                      background: 'none',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      padding: '2px 6px',
                      fontSize: '10px',
                      color: index === 0 ? '#ccc' : '#666',
                      lineHeight: 1
                    }}
                    title="Mover para cima"
                  >
                    ▲
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveScenario(scenario.scenario_id, 'down')
                    }}
                    disabled={index === flowScenarios.length - 1}
                    style={{
                      background: 'none',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      cursor: index === flowScenarios.length - 1 ? 'not-allowed' : 'pointer',
                      padding: '2px 6px',
                      fontSize: '10px',
                      color: index === flowScenarios.length - 1 ? '#ccc' : '#666',
                      lineHeight: 1
                    }}
                    title="Mover para baixo"
                  >
                    ▼
                  </button>
                </div>

                {/* Position badge */}
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  backgroundColor: 'var(--color-blue)',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '11px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {scenario.position}
                </span>

                {/* Título */}
                <span style={{ 
                  flex: 1, 
                  fontWeight: '500', 
                  fontSize: '14px', 
                  color: 'var(--color-blue)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {scenario.title}
                </span>

                {/* Botão remover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeScenarioFromFlow(scenario.scenario_id)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#999',
                    fontSize: '18px',
                    padding: '0 4px',
                    lineHeight: 1
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#e53935'}
                  onMouseLeave={(e) => e.target.style.color = '#999'}
                >
                  ×
                </button>
              </div>

              {/* Conector (seta) */}
              {index < flowScenarios.length - 1 && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  margin: '4px 0'
                }}>
                  <div style={{ width: '2px', height: '12px', backgroundColor: '#ddd' }} />
                  <div style={{
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '6px solid #ddd'
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalhes */}
      {selectedScenario && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedScenario(null)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid #ddd'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-blue)' }}>
                {selectedScenario.title}
              </span>
              <button
                onClick={() => setSelectedScenario(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '0 4px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#666', fontWeight: '500' }}>
                  Pré-requisitos
                </label>
                <div style={{ 
                  padding: '10px 12px', 
                  backgroundColor: '#fafafa', 
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {selectedScenario.prerequisites && selectedScenario.prerequisites.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {selectedScenario.prerequisites.map((pre, idx) => (
                        <li key={pre.id || idx}>{pre.description}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: '#999' }}>Nenhum pré-requisito</span>
                  )}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#666', fontWeight: '500' }}>
                  Resultados Esperados
                </label>
                <div style={{ 
                  padding: '10px 12px', 
                  backgroundColor: '#fafafa', 
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {selectedScenario.expectations && selectedScenario.expectations.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {selectedScenario.expectations.map((exp, idx) => (
                        <li key={exp.id || idx}>{exp.description}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: '#999' }}>Nenhum resultado esperado</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
