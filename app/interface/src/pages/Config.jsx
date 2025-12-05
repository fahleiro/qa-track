import { useState, useEffect } from 'react'
import { systemsAPI, featuresAPI, statusAPI } from '../services/api'

export default function Config() {
  const [tab, setTab] = useState('systems')
  const [systems, setSystems] = useState([])
  const [features, setFeatures] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Inputs
  const [systemInput, setSystemInput] = useState('')
  const [featureInput, setFeatureInput] = useState('')
  const [featureSystemId, setFeatureSystemId] = useState('')
  const [statusInput, setStatusInput] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sys, feat, st] = await Promise.all([
        systemsAPI.getAll(),
        featuresAPI.getAll(),
        statusAPI.getAll()
      ])
      setSystems(sys)
      setFeatures(feat)
      setStatuses(st)
    } catch (err) {
      console.error('Erro ao carregar:', err)
    } finally {
      setLoading(false)
    }
  }

  // === SISTEMAS ===
  const createSystem = async () => {
    if (!systemInput.trim()) return
    try {
      await systemsAPI.create(systemInput.trim())
      setSystemInput('')
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const deleteSystem = async (id) => {
    if (!confirm('Excluir este sistema?')) return
    try {
      await systemsAPI.delete(id)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  // === FEATURES ===
  const createFeature = async () => {
    if (!featureInput.trim() || !featureSystemId) return
    try {
      await featuresAPI.create(featureInput.trim(), parseInt(featureSystemId))
      setFeatureInput('')
      setFeatureSystemId('')
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const deleteFeature = async (id) => {
    if (!confirm('Excluir esta feature?')) return
    try {
      await featuresAPI.delete(id)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  // === STATUS ===
  const createStatus = async () => {
    if (!statusInput.trim()) return
    try {
      await statusAPI.create(statusInput.trim())
      setStatusInput('')
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const deleteStatus = async (id) => {
    if (!confirm('Excluir este status?')) return
    try {
      await statusAPI.delete(id)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') action()
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Configuração</h1>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${tab === 'systems' ? 'active' : ''}`}
          onClick={() => setTab('systems')}
        >
          Sistemas
        </button>
        <button 
          className={`tab ${tab === 'features' ? 'active' : ''}`}
          onClick={() => setTab('features')}
        >
          Features
        </button>
        <button 
          className={`tab ${tab === 'status' ? 'active' : ''}`}
          onClick={() => setTab('status')}
        >
          Status
        </button>
      </div>

      {loading ? (
        <div className="empty">
          <div className="empty-text">Carregando...</div>
        </div>
      ) : (
        <>
          {/* === SISTEMAS === */}
          {tab === 'systems' && (
            <div className="section">
              <div className="inline-add">
                <input
                  type="text"
                  className="form-input"
                  value={systemInput}
                  onChange={(e) => setSystemInput(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, createSystem)}
                  placeholder="Nome do sistema"
                />
                <button 
                  className="btn btn-primary"
                  onClick={createSystem}
                  disabled={!systemInput.trim()}
                >
                  Adicionar
                </button>
              </div>

              <div className="section-header">
                <span className="section-title">Sistemas</span>
                <span className="section-count">{systems.length}</span>
              </div>

              {systems.length === 0 ? (
                <div className="empty">
                  <div className="empty-text">Nenhum sistema cadastrado</div>
                </div>
              ) : (
                <div className="list">
                  {systems.map(sys => (
                    <div key={sys.id} className="list-item">
                      <div className="list-item-content">
                        <div className="list-item-title">
                          <span className="tag tag-id">#{sys.id}</span>
                          {' '}{sys.title}
                        </div>
                      </div>
                      <div className="list-item-actions">
                        <button 
                          className="btn btn-ghost btn-icon"
                          onClick={() => deleteSystem(sys.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === FEATURES === */}
          {tab === 'features' && (
            <div className="section">
              <div className="inline-add" style={{ flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: '1 1 200px' }}
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, createFeature)}
                  placeholder="Nome da feature"
                />
                <select
                  className="form-input"
                  style={{ flex: '0 0 180px' }}
                  value={featureSystemId}
                  onChange={(e) => setFeatureSystemId(e.target.value)}
                >
                  <option value="">Selecione o sistema</option>
                  {systems.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <button 
                  className="btn btn-primary"
                  onClick={createFeature}
                  disabled={!featureInput.trim() || !featureSystemId}
                >
                  Adicionar
                </button>
              </div>

              <div className="section-header">
                <span className="section-title">Features</span>
                <span className="section-count">{features.length}</span>
              </div>

              {features.length === 0 ? (
                <div className="empty">
                  <div className="empty-text">Nenhuma feature cadastrada</div>
                </div>
              ) : (
                <div className="list">
                  {features.map(feat => (
                    <div key={feat.id} className="list-item">
                      <div className="list-item-content">
                        <div className="list-item-title">
                          <span className="tag tag-id">#{feat.id}</span>
                          {' '}{feat.title}
                        </div>
                        <div className="list-item-meta">
                          <span className="tag tag-system">{feat.system_title}</span>
                        </div>
                      </div>
                      <div className="list-item-actions">
                        <button 
                          className="btn btn-ghost btn-icon"
                          onClick={() => deleteFeature(feat.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === STATUS === */}
          {tab === 'status' && (
            <div className="section">
              <div className="inline-add">
                <input
                  type="text"
                  className="form-input"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, createStatus)}
                  placeholder="Nome do status"
                />
                <button 
                  className="btn btn-primary"
                  onClick={createStatus}
                  disabled={!statusInput.trim()}
                >
                  Adicionar
                </button>
              </div>

              <div className="section-header">
                <span className="section-title">Status de Cenários</span>
                <span className="section-count">{statuses.length}</span>
              </div>

              {statuses.length === 0 ? (
                <div className="empty">
                  <div className="empty-text">Nenhum status cadastrado</div>
                </div>
              ) : (
                <div className="list">
                  {statuses.map(st => (
                    <div key={st.id} className="list-item">
                      <div className="list-item-content">
                        <div className="list-item-title">
                          <span className="tag tag-id">#{st.id}</span>
                          {' '}{st.title}
                        </div>
                      </div>
                      <div className="list-item-actions">
                        <button 
                          className="btn btn-ghost btn-icon"
                          onClick={() => deleteStatus(st.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
