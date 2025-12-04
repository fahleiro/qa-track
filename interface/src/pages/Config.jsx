import { useState, useEffect } from 'react'
import { scenarioStatusAPI, runStatusAPI, resultStatusAPI, systemsAPI } from '../services/api'
import SystemModal from '../components/systemModal'

export default function Config() {
  const [activeTab, setActiveTab] = useState('scenario')
  const [scenarioStatuses, setScenarioStatuses] = useState([])
  const [resultStatuses, setResultStatuses] = useState([])
  const [runStatuses, setRunStatuses] = useState([])
  const [systems, setSystems] = useState([])
  const [statusInput, setStatusInput] = useState('')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [systemInput, setSystemInput] = useState('')
  
  const [showSystemModal, setShowSystemModal] = useState(false)
  const [selectedSystemId, setSelectedSystemId] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [scenarioData, resultData, runData, systemsData] = await Promise.all([
        scenarioStatusAPI.getAll(),
        resultStatusAPI.getAll(),
        runStatusAPI.getAll(),
        systemsAPI.getAll()
      ])
      setScenarioStatuses(scenarioData)
      setResultStatuses(resultData)
      setRunStatuses(runData)
      setSystems(systemsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const createStatus = async () => {
    if (!statusInput.trim()) return
    try {
      if (activeTab === 'scenario') {
        await scenarioStatusAPI.create(statusInput.trim(), descriptionInput.trim() || null)
      } else if (activeTab === 'result') {
        await resultStatusAPI.create(statusInput.trim(), descriptionInput.trim() || null)
      } else {
        await runStatusAPI.create(statusInput.trim(), descriptionInput.trim() || null)
      }
      setStatusInput('')
      setDescriptionInput('')
      await loadData()
    } catch (error) {
      if (error.message.includes('409') || error.message.includes('já existe')) {
        alert('Este status já existe!')
      } else {
        alert('Erro ao criar status.')
      }
      console.error('Erro ao criar status:', error)
    }
  }

  const createSystem = async () => {
    if (!systemInput.trim()) return
    try {
      await systemsAPI.create(systemInput.trim())
      setSystemInput('')
      await loadData()
    } catch (error) {
      if (error.message.includes('409') || error.message.includes('já existe')) {
        alert('Este sistema já existe!')
      } else {
        alert('Erro ao criar sistema.')
      }
      console.error('Erro ao criar sistema:', error)
    }
  }

  const deleteStatus = async (id) => {
    if (!confirm('Tem certeza que deseja apagar este status?')) return
    try {
      if (activeTab === 'scenario') {
        await scenarioStatusAPI.delete(id)
      } else if (activeTab === 'result') {
        await resultStatusAPI.delete(id)
      } else {
        await runStatusAPI.delete(id)
      }
      await loadData()
    } catch (error) {
      alert('Erro ao apagar status.')
      console.error('Erro ao apagar status:', error)
    }
  }

  const deleteSystem = async (id) => {
    if (!confirm('Tem certeza que deseja apagar este sistema?')) return
    try {
      await systemsAPI.delete(id)
      await loadData()
    } catch (error) {
      alert('Erro ao apagar sistema.')
      console.error('Erro ao apagar sistema:', error)
    }
  }

  const toggleDefault = async (id, currentDefault) => {
    try {
      if (activeTab === 'scenario') {
        await scenarioStatusAPI.update(id, { is_default: !currentDefault })
      } else if (activeTab === 'result') {
        await resultStatusAPI.update(id, { is_default: !currentDefault })
      } else {
        await runStatusAPI.update(id, { is_default: !currentDefault })
      }
      await loadData()
    } catch (error) {
      alert('Erro ao atualizar status.')
      console.error('Erro ao atualizar status:', error)
    }
  }

  const openSystemModal = (systemId) => {
    setSelectedSystemId(systemId)
    setShowSystemModal(true)
  }

  const closeSystemModal = () => {
    setShowSystemModal(false)
    setSelectedSystemId(null)
  }

  const currentStatuses = activeTab === 'scenario' 
    ? scenarioStatuses 
    : activeTab === 'result' 
      ? resultStatuses 
      : runStatuses

  const statusTypeLabel = activeTab === 'scenario' 
    ? 'Cenários' 
    : activeTab === 'result' 
      ? 'Resultados' 
      : 'Execuções'

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: 'white'
  }

  const tabStyle = (isActive) => ({
    padding: '10px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    borderBottom: isActive ? '2px solid var(--color-blue)' : '2px solid transparent',
    color: isActive ? 'var(--color-blue)' : '#666',
    transition: 'all 0.2s'
  })

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #ddd'
      }}>
        <h2 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Configurações</h2>
      </div>
      
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '24px', 
        borderBottom: '1px solid #ddd',
        overflowX: 'auto'
      }}>
        <button onClick={() => setActiveTab('scenario')} style={tabStyle(activeTab === 'scenario')}>
          Status Cenários
        </button>
        <button onClick={() => setActiveTab('result')} style={tabStyle(activeTab === 'result')}>
          Status Resultados
        </button>
        <button onClick={() => setActiveTab('run')} style={tabStyle(activeTab === 'run')}>
          Status Execuções
        </button>
        <button onClick={() => setActiveTab('system')} style={tabStyle(activeTab === 'system')}>
          Sistemas
        </button>
      </div>

      {/* Conteúdo para Status */}
      {(activeTab === 'scenario' || activeTab === 'result' || activeTab === 'run') && (
        <>
          {/* Formulário de adicionar */}
          <div style={{ 
            padding: '16px', 
            border: '1px solid #ddd',
            borderRadius: '6px',
            marginBottom: '24px',
            backgroundColor: 'white'
          }}>
            <span style={{ 
              fontSize: '12px', 
              color: '#666',
              fontWeight: '500',
              display: 'block',
              marginBottom: '12px'
            }}>
              Novo Status - {statusTypeLabel}
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && statusInput.trim() && createStatus()}
                placeholder="Nome do status"
                style={inputStyle}
              />
              <textarea
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <button
                disabled={!statusInput.trim()}
                onClick={createStatus}
                style={{
                  padding: '8px 16px',
                  backgroundColor: statusInput.trim() ? 'var(--color-blue)' : '#ccc',
                  border: 'none',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: statusInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                  alignSelf: 'flex-start'
                }}
              >
                + Adicionar
              </button>
            </div>
          </div>
          
          {/* Lista */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '12px' 
          }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-blue)' }}>
              {statusTypeLabel}
            </span>
            <span style={{ 
              padding: '2px 8px', 
              backgroundColor: 'var(--color-blue)', 
              color: 'white', 
              borderRadius: '10px', 
              fontSize: '11px'
            }}>
              {currentStatuses.length}
            </span>
          </div>
          
          {currentStatuses.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              border: '1px solid #ddd',
              borderRadius: '6px',
              color: '#999'
            }}>
              Nenhum status cadastrado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentStatuses.map(status => (
                <div 
                  key={status.id} 
                  style={{ 
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: status.is_default ? '1px solid var(--color-blue)' : '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: status.description ? '4px' : 0 }}>
                      <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--color-blue)',
                        fontWeight: '600'
                      }}>
                        #{status.id}
                      </span>
                      <span style={{ fontWeight: '500', fontSize: '14px', color: 'var(--color-blue)' }}>
                        {status.title}
                      </span>
                      {status.is_default && (
                        <span style={{ 
                          padding: '2px 6px', 
                          backgroundColor: 'var(--color-blue)', 
                          color: 'white', 
                          borderRadius: '3px', 
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          PADRÃO
                        </span>
                      )}
                    </div>
                    {status.description && (
                      <div style={{ fontSize: '12px', color: '#666', marginLeft: '36px' }}>
                        {status.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      onClick={() => toggleDefault(status.id, status.is_default)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: status.is_default ? 'var(--color-blue)' : 'white',
                        color: status.is_default ? 'white' : '#666',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title={status.is_default ? 'Remover padrão' : 'Definir como padrão'}
                    >
                      {status.is_default ? '★' : '☆'}
                    </button>
                    <button
                      onClick={() => deleteStatus(status.id)}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#999',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#e53935'}
                      onMouseLeave={(e) => e.target.style.color = '#999'}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Conteúdo para Sistemas */}
      {activeTab === 'system' && (
        <>
          {/* Formulário de adicionar */}
          <div style={{ 
            padding: '16px', 
            border: '1px solid #ddd',
            borderRadius: '6px',
            marginBottom: '24px',
            backgroundColor: 'white'
          }}>
            <span style={{ 
              fontSize: '12px', 
              color: '#666',
              fontWeight: '500',
              display: 'block',
              marginBottom: '12px'
            }}>
              Novo Sistema
            </span>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={systemInput}
                onChange={(e) => setSystemInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && systemInput.trim() && createSystem()}
                placeholder="Nome do sistema"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                disabled={!systemInput.trim()}
                onClick={createSystem}
                style={{
                  padding: '8px 16px',
                  backgroundColor: systemInput.trim() ? 'var(--color-blue)' : '#ccc',
                  border: 'none',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: systemInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
              >
                + Adicionar
              </button>
            </div>
          </div>
          
          {/* Lista */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '12px' 
          }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-blue)' }}>
              Sistemas
            </span>
            <span style={{ 
              padding: '2px 8px', 
              backgroundColor: 'var(--color-blue)', 
              color: 'white', 
              borderRadius: '10px', 
              fontSize: '11px'
            }}>
              {systems.length}
            </span>
          </div>
          
          {systems.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              border: '1px solid #ddd',
              borderRadius: '6px',
              color: '#999'
            }}>
              Nenhum sistema cadastrado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {systems.map(system => (
                <div 
                  key={system.id} 
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
                  onClick={() => openSystemModal(system.id)}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#ddd'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      color: 'var(--color-blue)',
                      fontWeight: '600'
                    }}>
                      #{system.id}
                    </span>
                    <span style={{ fontWeight: '500', fontSize: '14px', color: 'var(--color-blue)' }}>
                      {system.description}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      Ver detalhes
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSystem(system.id)
                      }}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#999',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#e53935'}
                      onMouseLeave={(e) => e.target.style.color = '#999'}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Sistema */}
      <SystemModal
        show={showSystemModal}
        onClose={closeSystemModal}
        systemId={selectedSystemId}
        onSave={loadData}
      />
    </div>
  )
}
