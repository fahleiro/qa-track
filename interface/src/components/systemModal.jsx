import { useState, useEffect } from 'react'
import { systemsAPI } from '../services/api'

export default function SystemModal({ 
  show, 
  onClose, 
  systemId = null,
  onSave 
}) {
  const [system, setSystem] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (show && systemId) {
      loadSystem()
    } else if (!show) {
      setSystem(null)
    }
  }, [show, systemId])

  const loadSystem = async () => {
    setIsLoading(true)
    try {
      const data = await systemsAPI.getById(systemId)
      setSystem(data)
    } catch (error) {
      console.error('Erro ao carregar sistema:', error)
      alert('Erro ao carregar dados do sistema.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSystem(null)
    onClose()
  }

  if (!show) return null

  return (
    <div className="modal" onClick={(e) => e.target.className === 'modal' && handleClose()}>
      <div className="modal-content" style={{ maxWidth: '700px' }}>
        <span className="close-btn" onClick={handleClose}>&times;</span>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Carregando...</p>
          </div>
        ) : system ? (
          <>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🖥️</span>
              Sistema #{system.id}
            </h3>
            
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              backgroundColor: 'var(--panel-bg-color)', 
              borderRadius: '8px' 
            }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                fontSize: '13px',
                color: 'var(--clr-midnight-a30)'
              }}>
                Descrição
              </label>
              <p style={{ 
                margin: 0, 
                fontSize: '16px', 
                fontWeight: '500' 
              }}>
                {system.description}
              </p>
            </div>

            <div style={{ marginTop: '24px' }}>
              <h4 style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}>
                📋 Cenários Relacionados
                <span style={{ 
                  padding: '2px 8px', 
                  backgroundColor: 'var(--clr-primary)', 
                  color: 'white', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {system.scenarios?.length || 0}
                </span>
              </h4>
              
              {system.scenarios && system.scenarios.length > 0 ? (
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {system.scenarios.map(scenario => (
                    <li 
                      key={scenario.id} 
                      style={{ 
                        padding: '12px 16px',
                        marginBottom: '8px',
                        backgroundColor: 'var(--panel-bg-color)',
                        borderRadius: '8px',
                        border: '2px solid var(--input-border-color)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--clr-midnight-a30)',
                          fontWeight: '600'
                        }}>
                          #{scenario.id}
                        </span>
                        <span style={{ fontWeight: '600' }}>{scenario.title}</span>
                      </div>
                      {scenario.prerequisites && scenario.prerequisites.length > 0 && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: 'var(--clr-midnight-a30)',
                          marginTop: '8px'
                        }}>
                          <strong>Pré-condições:</strong> {scenario.prerequisites.map(p => p.description).join('; ').substring(0, 100)}{scenario.prerequisites.map(p => p.description).join('; ').length > 100 ? '...' : ''}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ 
                  padding: '24px', 
                  textAlign: 'center', 
                  color: 'var(--clr-midnight-a30)',
                  backgroundColor: 'var(--panel-bg-color)',
                  borderRadius: '8px'
                }}>
                  Nenhum cenário vinculado a este sistema.
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Sistema não encontrado.</p>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button 
            className="btn-cancel" 
            onClick={handleClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

