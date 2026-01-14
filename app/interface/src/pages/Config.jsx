import { useState, useEffect, useRef } from 'react'
import { systemsAPI, featuresAPI, statusAPI, configAPI } from '../services/api'

export default function Config() {
  const [tab, setTab] = useState('systems')
  const [systems, setSystems] = useState([])
  const [features, setFeatures] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Inputs de criacao
  const [systemInput, setSystemInput] = useState('')
  const [featureInput, setFeatureInput] = useState('')
  const [featureSystemId, setFeatureSystemId] = useState('')
  const [statusInput, setStatusInput] = useState('')

  // Menu de opcoes
  const [menuOpen, setMenuOpen] = useState(null)
  const [menuType, setMenuType] = useState('')

  // Modal de edicao
  const [modal, setModal] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editType, setEditType] = useState('')
  const [editForm, setEditForm] = useState({ title: '', system_id: '' })
  const [originalForm, setOriginalForm] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Modal de importacao
  const [importModal, setImportModal] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState(null)
  const fileInputRef = useRef(null)

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

  // === MENU DE OPCOES ===
  const handleCardClick = (e, itemId, type) => {
    e.stopPropagation()
    if (menuOpen === itemId && menuType === type) {
      setMenuOpen(null)
      setMenuType('')
    } else {
      setMenuOpen(itemId)
      setMenuType(type)
    }
  }

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpen(null)
      setMenuType('')
    }
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [menuOpen])

  // === MODAL DE EDICAO ===
  const openView = (item, type) => {
    setMenuOpen(null)
    setMenuType('')
    setEditing(item)
    setEditType(type)
    setViewMode(true)
    setHasChanges(false)
    const formData = {
      title: item.title,
      system_id: item.system_id || ''
    }
    setEditForm(formData)
    setOriginalForm(formData)
    setModal(true)
  }

  const openEdit = (item, type) => {
    setMenuOpen(null)
    setMenuType('')
    setEditing(item)
    setEditType(type)
    setViewMode(false)
    setHasChanges(false)
    const formData = {
      title: item.title,
      system_id: item.system_id || ''
    }
    setEditForm(formData)
    setOriginalForm(formData)
    setModal(true)
  }

  const closeModal = () => {
    if (hasChanges && !viewMode) {
      if (!confirm('Há edições realizadas não salvas. Deseja Cancelar?')) {
        return
      }
    }
    setModal(false)
    setEditing(null)
    setEditType('')
    setViewMode(false)
    setHasChanges(false)
    setOriginalForm(null)
  }

  const checkChanges = (newForm) => {
    if (!originalForm) return false
    return JSON.stringify(newForm) !== JSON.stringify(originalForm)
  }

  const updateEditForm = (field, value) => {
    const newForm = { ...editForm, [field]: value }
    setEditForm(newForm)
    setHasChanges(checkChanges(newForm))
  }

  const handleEditSave = async () => {
    if (!editForm.title.trim()) return

    try {
      if (editType === 'system') {
        await systemsAPI.update(editing.id, { title: editForm.title.trim() })
      } else if (editType === 'feature') {
        await featuresAPI.update(editing.id, {
          title: editForm.title.trim(),
          system_id: parseInt(editForm.system_id)
        })
      } else if (editType === 'status') {
        await statusAPI.update(editing.id, { title: editForm.title.trim() })
      }
      closeModal()
      loadData()
    } catch (err) {
      alert(err.message)
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

  // === EXPORT/IMPORT ===
  const handleExport = async () => {
    try {
      const blob = await configAPI.export()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qa-track-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Erro ao exportar: ' + err.message)
    }
  }

  const openImportModal = () => {
    setImportModal(true)
    setImportResult(null)
    setImportError(null)
  }

  const closeImportModal = () => {
    setImportModal(false)
    setImportResult(null)
    setImportError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.name.endsWith('.json')) {
      setImportError('Apenas arquivos .json são permitidos')
      return
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImportError('Arquivo muito grande. Máximo permitido: 10MB')
      return
    }

    setImportLoading(true)
    setImportError(null)
    setImportResult(null)

    try {
      const text = await file.text()
      let jsonData
      
      try {
        jsonData = JSON.parse(text)
      } catch {
        setImportError('Arquivo JSON inválido')
        setImportLoading(false)
        return
      }

      const result = await configAPI.import(jsonData)
      setImportResult(result)
      loadData() // Recarregar dados após importação
    } catch (err) {
      setImportError(err.message)
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Configuração</h1>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            Exportar Config
          </button>
          <button className="btn btn-secondary" onClick={openImportModal}>
            Importar Config
          </button>
        </div>
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
                    <div key={sys.id} className="list-item-wrapper">
                      <div className="list-item" onClick={(e) => handleCardClick(e, sys.id, 'system')}>
                        <div className="list-item-content">
                          <div className="list-item-title">
                            <span className="tag tag-id">#{sys.id}</span>
                            {' '}{sys.title}
                          </div>
                        </div>
                        <div className="list-item-actions">
                          <button 
                            className="btn btn-ghost btn-icon"
                            onClick={(e) => { e.stopPropagation(); deleteSystem(sys.id) }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      {menuOpen === sys.id && menuType === 'system' && (
                        <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                          <button className="action-menu-item" onClick={() => openView(sys, 'system')}>
                            Visualizar
                          </button>
                          <button className="action-menu-item" onClick={() => openEdit(sys, 'system')}>
                            Editar
                          </button>
                        </div>
                      )}
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
                    <div key={feat.id} className="list-item-wrapper">
                      <div className="list-item" onClick={(e) => handleCardClick(e, feat.id, 'feature')}>
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
                            onClick={(e) => { e.stopPropagation(); deleteFeature(feat.id) }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      {menuOpen === feat.id && menuType === 'feature' && (
                        <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                          <button className="action-menu-item" onClick={() => openView(feat, 'feature')}>
                            Visualizar
                          </button>
                          <button className="action-menu-item" onClick={() => openEdit(feat, 'feature')}>
                            Editar
                          </button>
                        </div>
                      )}
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
                    <div key={st.id} className="list-item-wrapper">
                      <div className="list-item" onClick={(e) => handleCardClick(e, st.id, 'status')}>
                        <div className="list-item-content">
                          <div className="list-item-title">
                            <span className="tag tag-id">#{st.id}</span>
                            {' '}{st.title}
                          </div>
                        </div>
                        <div className="list-item-actions">
                          <button 
                            className="btn btn-ghost btn-icon"
                            onClick={(e) => { e.stopPropagation(); deleteStatus(st.id) }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      {menuOpen === st.id && menuType === 'status' && (
                        <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                          <button className="action-menu-item" onClick={() => openView(st, 'status')}>
                            Visualizar
                          </button>
                          <button className="action-menu-item" onClick={() => openEdit(st, 'status')}>
                            Editar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de Edição */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {viewMode ? 'Visualizar' : 'Editar'}{' '}
                {editType === 'system' && 'Sistema'}
                {editType === 'feature' && 'Feature'}
                {editType === 'status' && 'Status'}
              </h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título {!viewMode && '*'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.title}
                  onChange={(e) => updateEditForm('title', e.target.value)}
                  placeholder={`Nome ${editType === 'system' ? 'do sistema' : editType === 'feature' ? 'da feature' : 'do status'}`}
                  disabled={viewMode}
                />
              </div>

              {editType === 'feature' && (
                <div className="form-group">
                  <label className="form-label">Sistema {!viewMode && '*'}</label>
                  <select
                    className="form-input"
                    value={editForm.system_id}
                    onChange={(e) => updateEditForm('system_id', e.target.value)}
                    disabled={viewMode}
                  >
                    <option value="">Selecione o sistema</option>
                    {systems.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {!viewMode && (
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleEditSave}>
                  Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {importModal && (
        <div className="modal-overlay" onClick={closeImportModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Importar Configuração</h2>
              <button className="modal-close" onClick={closeImportModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Arquivo JSON</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="form-input"
                  onChange={handleFileSelect}
                  disabled={importLoading}
                />
                <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                  Selecione um arquivo JSON exportado anteriormente.
                </small>
              </div>

              {importLoading && (
                <div className="import-status">
                  <div className="empty-text">Importando...</div>
                </div>
              )}

              {importError && (
                <div className="import-status import-error">
                  <strong>Erro:</strong> {importError}
                </div>
              )}

              {importResult && importResult.success && (
                <div className="import-status import-success">
                  <strong>Sucesso!</strong>
                  <p>{importResult.message}</p>
                  {importResult.inserted && (
                    <div className="import-details">
                      <strong>Registros inseridos:</strong>
                      <ul>
                        {Object.entries(importResult.inserted).map(([table, count]) => (
                          <li key={table}>{table}: {count}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeImportModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
