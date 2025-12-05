import { useState, useEffect } from 'react'
import { scenariosAPI, systemsAPI, featuresAPI, statusAPI } from '../services/api'

export default function Scenarios() {
  const [scenarios, setScenarios] = useState([])
  const [systems, setSystems] = useState([])
  const [features, setFeatures] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [search, setSearch] = useState('')
  const [filterSystem, setFilterSystem] = useState('')
  const [filterFeature, setFilterFeature] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  // Menu de opcoes
  const [menuOpen, setMenuOpen] = useState(null)
  
  // Modal
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewMode, setViewMode] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalPrerequisites, setOriginalPrerequisites] = useState([])
  const [originalExpectations, setOriginalExpectations] = useState([])
  const [originalForm, setOriginalForm] = useState(null)
  const [form, setForm] = useState({
    title: '',
    feature_id: '',
    status_id: '',
    system_ids: [],
    prerequisites: [''],
    expectations: ['']
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, sys, feat, st] = await Promise.all([
        scenariosAPI.getAll(),
        systemsAPI.getAll(),
        featuresAPI.getAll(),
        statusAPI.getAll()
      ])
      setScenarios(s)
      setSystems(sys)
      setFeatures(feat)
      setStatuses(st)
    } catch (err) {
      console.error('Erro ao carregar:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar cenários
  const filtered = scenarios.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.id.toString().includes(search)) {
      return false
    }
    if (filterSystem && (!s.systems || !s.systems.some(sys => sys.id === parseInt(filterSystem)))) {
      return false
    }
    if (filterFeature && s.feature_id !== parseInt(filterFeature)) {
      return false
    }
    if (filterStatus && s.status_id !== parseInt(filterStatus)) {
      return false
    }
    return true
  })

  // Features filtradas por sistema selecionado no filtro
  const filteredFeatures = filterSystem 
    ? features.filter(f => f.system_id === parseInt(filterSystem))
    : features

  // Menu handlers
  const handleCardClick = (e, scenarioId) => {
    e.stopPropagation()
    setMenuOpen(menuOpen === scenarioId ? null : scenarioId)
  }

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null)
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [menuOpen])

  // Modal handlers
  const openCreate = () => {
    setEditing(null)
    setViewMode(false)
    setHasChanges(false)
    setOriginalPrerequisites([])
    setOriginalExpectations([])
    setOriginalForm(null)
    setForm({
      title: '',
      feature_id: '',
      status_id: '',
      system_ids: [],
      prerequisites: [''],
      expectations: ['']
    })
    setModal(true)
  }

  const openView = (scenario) => {
    setMenuOpen(null)
    setEditing(scenario)
    setViewMode(true)
    setHasChanges(false)
    setOriginalPrerequisites(scenario.prerequisites || [])
    setOriginalExpectations(scenario.expectations || [])
    const formData = {
      title: scenario.title,
      feature_id: scenario.feature_id || '',
      status_id: scenario.status_id || '',
      system_ids: scenario.systems?.map(s => s.id) || [],
      prerequisites: scenario.prerequisites?.length > 0 
        ? scenario.prerequisites.map(p => p.description) 
        : [''],
      expectations: scenario.expectations?.length > 0 
        ? scenario.expectations.map(e => e.description) 
        : ['']
    }
    setForm(formData)
    setOriginalForm(formData)
    setModal(true)
  }

  const openEdit = (scenario) => {
    setMenuOpen(null)
    setEditing(scenario)
    setViewMode(false)
    setHasChanges(false)
    setOriginalPrerequisites(scenario.prerequisites || [])
    setOriginalExpectations(scenario.expectations || [])
    const formData = {
      title: scenario.title,
      feature_id: scenario.feature_id || '',
      status_id: scenario.status_id || '',
      system_ids: scenario.systems?.map(s => s.id) || [],
      prerequisites: scenario.prerequisites?.length > 0 
        ? scenario.prerequisites.map(p => p.description) 
        : [''],
      expectations: scenario.expectations?.length > 0 
        ? scenario.expectations.map(e => e.description) 
        : ['']
    }
    setForm(formData)
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
    setViewMode(false)
    setHasChanges(false)
    setOriginalPrerequisites([])
    setOriginalExpectations([])
    setOriginalForm(null)
  }

  // Detectar alteracoes
  const checkChanges = (newForm) => {
    if (!originalForm) return false
    return JSON.stringify(newForm) !== JSON.stringify(originalForm)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    
    const prereqs = form.prerequisites.filter(p => p.trim())
    const expects = form.expectations.filter(e => e.trim())
    
    if (prereqs.length === 0 || expects.length === 0) {
      alert('Preencha ao menos um pré-requisito e um resultado esperado')
      return
    }

    try {
      if (editing) {
        // Atualizar dados básicos do cenário
        await scenariosAPI.update(editing.id, {
          title: form.title.trim(),
          feature_id: form.feature_id || null,
          status_id: form.status_id || null,
          system_ids: form.system_ids
        })

        // Atualizar pré-requisitos
        // Deletar os removidos
        for (const original of originalPrerequisites) {
          await scenariosAPI.deletePre(original.id)
        }
        // Adicionar os novos
        for (const pre of prereqs) {
          await scenariosAPI.addPre(editing.id, pre)
        }

        // Atualizar resultados esperados
        // Deletar os removidos
        for (const original of originalExpectations) {
          await scenariosAPI.deleteExpect(original.id)
        }
        // Adicionar os novos
        for (const exp of expects) {
          await scenariosAPI.addExpect(editing.id, exp)
        }
      } else {
        await scenariosAPI.create({
          title: form.title.trim(),
          feature_id: form.feature_id || null,
          status_id: form.status_id || null,
          system_ids: form.system_ids,
          prerequisites: prereqs,
          expectations: expects
        })
      }
      closeModal()
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Excluir este cenário?')) return
    try {
      await scenariosAPI.delete(id)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const addField = (field) => {
    const newForm = { ...form, [field]: [...form[field], ''] }
    setForm(newForm)
    setHasChanges(checkChanges(newForm))
  }

  const updateField = (field, index, value) => {
    const newForm = {
      ...form,
      [field]: form[field].map((v, i) => i === index ? value : v)
    }
    setForm(newForm)
    setHasChanges(checkChanges(newForm))
  }

  const removeField = (field, index) => {
    if (form[field].length <= 1) return
    const newForm = {
      ...form,
      [field]: form[field].filter((_, i) => i !== index)
    }
    setForm(newForm)
    setHasChanges(checkChanges(newForm))
  }

  const toggleSystem = (systemId) => {
    const newForm = {
      ...form,
      system_ids: form.system_ids.includes(systemId)
        ? form.system_ids.filter(id => id !== systemId)
        : [...form.system_ids, systemId]
    }
    setForm(newForm)
    setHasChanges(checkChanges(newForm))
  }

  const updateFormField = (field, value) => {
    const newForm = { ...form, [field]: value }
    setForm(newForm)
    setHasChanges(checkChanges(newForm))
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Cenários</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Novo</button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar por ID ou título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="filters">
        <select 
          className="filter-select"
          value={filterSystem}
          onChange={(e) => {
            setFilterSystem(e.target.value)
            setFilterFeature('')
          }}
        >
          <option value="">Todos os sistemas</option>
          {systems.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={filterFeature}
          onChange={(e) => setFilterFeature(e.target.value)}
        >
          <option value="">Todas as features</option>
          {filteredFeatures.map(f => (
            <option key={f.id} value={f.id}>{f.title}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {statuses.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>

        {(search || filterSystem || filterFeature || filterStatus) && (
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearch('')
              setFilterSystem('')
              setFilterFeature('')
              setFilterStatus('')
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* Results */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Resultados</span>
          <span className="section-count">{filtered.length}</span>
        </div>

        {loading ? (
          <div className="empty">
            <div className="empty-text">Carregando...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-text">Nenhum cenário encontrado</div>
          </div>
        ) : (
          <div className="list">
            {filtered.map(scenario => (
              <div key={scenario.id} className="list-item-wrapper">
                <div className="list-item" onClick={(e) => handleCardClick(e, scenario.id)}>
                  <div className="list-item-content">
                    <div className="list-item-title">
                      <span className="tag tag-id">#{scenario.id}</span>
                      {' '}{scenario.title}
                    </div>
                    <div className="list-item-details">
                      {scenario.status && (
                        <div className="detail-row">
                          <span className="detail-label">Status:</span>
                          <span className="tag tag-status">{scenario.status.title}</span>
                        </div>
                      )}
                      {scenario.feature && (
                        <div className="detail-row">
                          <span className="detail-label">Feature:</span>
                          <span className="tag tag-feature">{scenario.feature.title}</span>
                        </div>
                      )}
                      {scenario.systems?.length > 0 && (
                        <div className="detail-row">
                          <span className="detail-label">Sistemas:</span>
                          <div className="detail-tags">
                            {scenario.systems.map(sys => (
                              <span key={sys.id} className="tag tag-system">{sys.title}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <button 
                      className="btn btn-ghost btn-icon"
                      onClick={(e) => handleDelete(scenario.id, e)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                {menuOpen === scenario.id && (
                  <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                    <button className="action-menu-item" onClick={() => openView(scenario)}>
                      Visualizar
                    </button>
                    <button className="action-menu-item" onClick={() => openEdit(scenario)}>
                      Editar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {viewMode ? 'Visualizar Cenário' : (editing ? 'Editar Cenário' : 'Novo Cenário')}
              </h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título {!viewMode && '*'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.title}
                  onChange={(e) => updateFormField('title', e.target.value)}
                  placeholder="Título do cenário"
                  disabled={viewMode}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Feature</label>
                  <select
                    className="form-input"
                    value={form.feature_id}
                    onChange={(e) => updateFormField('feature_id', e.target.value)}
                    disabled={viewMode}
                  >
                    <option value="">Selecione...</option>
                    {features.map(f => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={form.status_id}
                    onChange={(e) => updateFormField('status_id', e.target.value)}
                    disabled={viewMode}
                  >
                    <option value="">Selecione...</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sistemas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {systems.map(sys => (
                    <button
                      key={sys.id}
                      type="button"
                      className={`btn btn-sm ${form.system_ids.includes(sys.id) ? 'btn-primary' : ''}`}
                      onClick={() => !viewMode && toggleSystem(sys.id)}
                      disabled={viewMode}
                    >
                      {sys.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pré-requisitos {!viewMode && '*'}</label>
                <div className="dynamic-list">
                  {form.prerequisites.map((pre, i) => (
                    <div key={i} className="dynamic-item">
                      <input
                        type="text"
                        className="form-input"
                        value={pre}
                        onChange={(e) => updateField('prerequisites', i, e.target.value)}
                        placeholder={`Pré-requisito ${i + 1}`}
                        disabled={viewMode}
                      />
                      {!viewMode && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => removeField('prerequisites', i)}
                          disabled={form.prerequisites.length <= 1}
                        >
                          −
                        </button>
                      )}
                    </div>
                  ))}
                  {!viewMode && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => addField('prerequisites')}
                    >
                      + Adicionar
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resultados Esperados {!viewMode && '*'}</label>
                <div className="dynamic-list">
                  {form.expectations.map((exp, i) => (
                    <div key={i} className="dynamic-item">
                      <input
                        type="text"
                        className="form-input"
                        value={exp}
                        onChange={(e) => updateField('expectations', i, e.target.value)}
                        placeholder={`Resultado ${i + 1}`}
                        disabled={viewMode}
                      />
                      {!viewMode && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => removeField('expectations', i)}
                          disabled={form.expectations.length <= 1}
                        >
                          −
                        </button>
                      )}
                    </div>
                  ))}
                  {!viewMode && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => addField('expectations')}
                    >
                      + Adicionar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {!viewMode && (
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleSave}>
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

