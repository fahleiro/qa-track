import { useState, useEffect } from 'react'
import { kanbanAPI, systemsAPI, featuresAPI } from '../services/api'

const RUN_BADGE_CLASS = {
  planned: 'run-badge-planned',
  running: 'run-badge-running',
  closed:  'run-badge-closed'
}

export default function Kanban() {
  const [statuses, setStatuses] = useState([])
  const [cards, setCards] = useState([])
  const [systems, setSystems] = useState([])
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)

  // Drag & Drop
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  // Modal novo card
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', system_id: '', feature_id: '' })
  const [filteredFeatures, setFilteredFeatures] = useState([])
  const [creating, setCreating] = useState(false)

  // Feedback
  const [alert, setAlert] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [sts, cds, sys, feat] = await Promise.all([
        kanbanAPI.getStatuses(),
        kanbanAPI.getCards(),
        systemsAPI.getAll(),
        featuresAPI.getAll()
      ])
      setStatuses(sts)
      setCards(cds)
      setSystems(sys)
      setFeatures(feat)
    } catch (err) {
      console.error('Erro ao carregar Kanban:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSystemChange = (system_id) => {
    const filtered = system_id
      ? features.filter(f => f.system_id === parseInt(system_id))
      : []
    setFilteredFeatures(filtered)
    setForm(prev => ({ ...prev, system_id, feature_id: '' }))
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  const handleCreate = async () => {
    if (!form.title.trim() || !form.system_id || !form.feature_id) return
    setCreating(true)
    try {
      const result = await kanbanAPI.createCard({
        title: form.title.trim(),
        description: form.description.trim() || null,
        system_id: parseInt(form.system_id),
        feature_id: parseInt(form.feature_id)
      })
      setModal(false)
      setForm({ title: '', description: '', system_id: '', feature_id: '' })
      setFilteredFeatures([])
      if (result.runCreated) {
        showToast(`Run #${result.runInfo.id} criada com ${result.runInfo.scenarioCount} cenário(s).`)
      } else {
        showToast('Card criado. Nenhum cenário vinculado encontrado para este sistema + feature.')
      }
      loadData()
    } catch (err) {
      setAlert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDragStart = (e, card) => {
    setDragging(card)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDragging(null)
    setDragOver(null)
  }

  const handleDrop = async (e, targetStatusId) => {
    e.preventDefault()
    setDragOver(null)
    if (!dragging || dragging.card_status?.id === targetStatusId) {
      setDragging(null)
      return
    }
    try {
      await kanbanAPI.moveCard(dragging.id, { card_status_id: targetStatusId })
      loadData()
    } catch (err) {
      setAlert(err.message)
    }
    setDragging(null)
  }

  const getRunBadgeClass = (statusTitle) =>
    RUN_BADGE_CLASS[statusTitle?.toLowerCase()] || 'run-badge-planned'

  if (loading) return <div className="empty"><div className="empty-text">Carregando...</div></div>

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Kanban</h1>
        <button className="btn btn-primary" onClick={() => setModal(true)}>Novo</button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="kanban-toast">{toast}</div>
      )}

      {/* Timeline */}
      <div className="kanban-timeline">
        {statuses.map((status, i) => (
          <div key={status.id} className="kanban-step-wrapper">
            <div className="kanban-step">
              <div className="kanban-step-dot">{i + 1}</div>
              <div className="kanban-step-label">{status.title}</div>
            </div>
            {i < statuses.length - 1 && <div className="kanban-step-connector" />}
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="kanban-board">
        {statuses.map(status => {
          const statusCards = cards.filter(c => c.card_status?.id === status.id)
          const isOver = dragOver === status.id

          return (
            <div
              key={status.id}
              className={`kanban-column${isOver ? ' kanban-column-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(status.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, status.id)}
            >
              <div className="kanban-column-header">
                <span className="kanban-column-title">{status.title}</span>
                <span className="kanban-column-count">{statusCards.length}</span>
              </div>

              <div className="kanban-cards">
                {statusCards.length === 0 && (
                  <div className="kanban-empty-col">Vazio</div>
                )}
                {statusCards.map(card => (
                  <div
                    key={card.id}
                    className={`kanban-card${dragging?.id === card.id ? ' kanban-card-dragging' : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, card)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="kanban-card-title">{card.title}</div>
                    <div className="kanban-card-meta">
                      {card.system && <span className="tag">{card.system.title}</span>}
                      {card.feature && <span className="tag">{card.feature.title}</span>}
                    </div>
                    {card.run ? (
                      <div className={`run-badge ${getRunBadgeClass(card.run.status_title)}`}>
                        Run #{card.run.id} · {card.run.scenario_count} cenários · {card.run.status_title}
                      </div>
                    ) : (
                      <div className="run-badge-none">Sem cenários vinculados</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Novo Card */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Novo Card</h2>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input
                  className="form-input"
                  placeholder="Título do card"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Detalhes</label>
                <textarea
                  className="form-input"
                  placeholder="Descreva o escopo do card..."
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sistema *</label>
                  <select
                    className="form-input"
                    value={form.system_id}
                    onChange={e => handleSystemChange(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {systems.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Feature *</label>
                  <select
                    className="form-input"
                    value={form.feature_id}
                    onChange={e => setForm(prev => ({ ...prev, feature_id: e.target.value }))}
                    disabled={!form.system_id}
                  >
                    <option value="">Selecione</option>
                    {filteredFeatures.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={creating || !form.title.trim() || !form.system_id || !form.feature_id}
              >
                {creating ? 'Criando...' : 'Criar Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      {alert && (
        <div className="modal-overlay" onClick={() => setAlert(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Atenção</h2>
            </div>
            <div className="modal-body">{alert}</div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setAlert(null)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
