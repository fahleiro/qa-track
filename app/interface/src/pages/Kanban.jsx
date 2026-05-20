import { useState, useEffect } from 'react'
import { kanbanAPI, systemsAPI, featuresAPI } from '../services/api'

const RUN_BADGE_CLASS = {
  planned: 'run-badge-planned',
  running: 'run-badge-running',
  closed:  'run-badge-closed',
}

export default function Kanban() {
  const [statuses, setStatuses] = useState([])
  const [cards, setCards]       = useState([])
  const [systems, setSystems]   = useState([])
  const [features, setFeatures] = useState([])
  const [loading, setLoading]   = useState(true)

  // Drag & Drop
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  // Modal novo card
  const [newModal, setNewModal]           = useState(false)
  const [newForm, setNewForm]             = useState({ title: '', description: '', system_id: '', feature_id: '' })
  const [newFilteredFeats, setNewFilteredFeats] = useState([])
  const [creating, setCreating]           = useState(false)

  // Modal detalhe do card
  const [detailCard, setDetailCard]         = useState(null)
  const [editForm, setEditForm]             = useState({})
  const [editFilteredFeats, setEditFilteredFeats] = useState([])
  const [saving, setSaving]               = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
        featuresAPI.getAll(),
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

  // ── Novo card ────────────────────────────────────────────
  const handleNewSystemChange = (system_id) => {
    setNewFilteredFeats(system_id ? features.filter(f => f.system_id === parseInt(system_id)) : [])
    setNewForm(prev => ({ ...prev, system_id, feature_id: '' }))
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  const handleCreate = async () => {
    if (!newForm.title.trim() || !newForm.system_id || !newForm.feature_id) return
    setCreating(true)
    try {
      const result = await kanbanAPI.createCard({
        title:       newForm.title.trim(),
        description: newForm.description.trim() || null,
        system_id:   parseInt(newForm.system_id),
        feature_id:  parseInt(newForm.feature_id),
      })
      setNewModal(false)
      setNewForm({ title: '', description: '', system_id: '', feature_id: '' })
      setNewFilteredFeats([])
      showToast(
        result.runCreated
          ? `Run #${result.runInfo.id} criada com ${result.runInfo.scenarioCount} cenário(s).`
          : 'Card criado. Nenhum cenário vinculado encontrado para este sistema + feature.'
      )
      loadData()
    } catch (err) {
      setAlert(err.message)
    } finally {
      setCreating(false)
    }
  }

  // ── Detalhe do card ──────────────────────────────────────
  const openCard = (card) => {
    setDetailCard(card)
    setEditForm({
      title:         card.title,
      description:   card.description || '',
      system_id:     String(card.system?.id ?? ''),
      feature_id:    String(card.feature?.id ?? ''),
      card_status_id: String(card.card_status?.id ?? ''),
    })
    setEditFilteredFeats(
      card.system?.id ? features.filter(f => f.system_id === card.system.id) : []
    )
    setConfirmDelete(false)
  }

  const handleEditSystemChange = (system_id) => {
    setEditFilteredFeats(system_id ? features.filter(f => f.system_id === parseInt(system_id)) : [])
    setEditForm(prev => ({ ...prev, system_id, feature_id: '' }))
  }

  const handleSave = async () => {
    if (!editForm.title.trim()) return
    setSaving(true)
    try {
      await kanbanAPI.moveCard(detailCard.id, {
        title:          editForm.title.trim(),
        description:    editForm.description.trim() || null,
        system_id:      editForm.system_id   ? parseInt(editForm.system_id)   : undefined,
        feature_id:     editForm.feature_id  ? parseInt(editForm.feature_id)  : undefined,
        card_status_id: editForm.card_status_id ? parseInt(editForm.card_status_id) : undefined,
      })
      setDetailCard(null)
      loadData()
    } catch (err) {
      setAlert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await kanbanAPI.deleteCard(detailCard.id)
      setDetailCard(null)
      loadData()
    } catch (err) {
      setAlert(err.message)
    }
  }

  // ── Drag & Drop ──────────────────────────────────────────
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

  const getRunBadgeClass = (title) => RUN_BADGE_CLASS[title?.toLowerCase()] || 'run-badge-planned'

  if (loading) return <div className="empty"><div className="empty-text">Carregando...</div></div>

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Kanban</h1>
        <button className="btn btn-primary" onClick={() => setNewModal(true)}>Novo</button>
      </div>

      {/* Toast */}
      {toast && <div className="kanban-toast">{toast}</div>}

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
                    onClick={() => openCard(card)}
                  >
                    <div className="kanban-card-title">{card.title}</div>
                    {card.run && (
                      <div className={`run-badge run-badge-sm ${getRunBadgeClass(card.run.status_title)}`}>
                        {card.run.status_title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: Novo Card */}
      {newModal && (
        <div className="modal-overlay" onClick={() => setNewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Novo Card</h2>
              <button className="modal-close" onClick={() => setNewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input
                  className="form-input"
                  placeholder="Título do card"
                  value={newForm.title}
                  onChange={e => setNewForm(prev => ({ ...prev, title: e.target.value }))}
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
                  value={newForm.description}
                  onChange={e => setNewForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sistema *</label>
                  <select
                    className="form-input"
                    value={newForm.system_id}
                    onChange={e => handleNewSystemChange(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {systems.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Feature *</label>
                  <select
                    className="form-input"
                    value={newForm.feature_id}
                    onChange={e => setNewForm(prev => ({ ...prev, feature_id: e.target.value }))}
                    disabled={!newForm.system_id}
                  >
                    <option value="">Selecione</option>
                    {newFilteredFeats.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setNewModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={creating || !newForm.title.trim() || !newForm.system_id || !newForm.feature_id}
              >
                {creating ? 'Criando...' : 'Criar Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhe do Card */}
      {detailCard && (
        <div className="modal-overlay" onClick={() => setDetailCard(null)}>
          <div className="modal modal-card-detail" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{detailCard.title}</h2>
              <button className="modal-close" onClick={() => setDetailCard(null)}>×</button>
            </div>
            <div className="modal-body modal-body-two-col">
              {/* Coluna esquerda */}
              <div className="modal-col-main">
                <div className="form-group">
                  <label className="form-label">Título</label>
                  <input
                    className="form-input"
                    value={editForm.title}
                    onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Detalhes</label>
                  <textarea
                    className="form-input"
                    rows={5}
                    value={editForm.description}
                    onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ resize: 'vertical' }}
                    placeholder="Descrição do card..."
                  />
                </div>
                {detailCard.run && (
                  <div className={`run-badge ${getRunBadgeClass(detailCard.run.status_title)}`}>
                    Run #{detailCard.run.id} · {detailCard.run.scenario_count} cenário(s) · {detailCard.run.status_title}
                  </div>
                )}
                {!detailCard.run && (
                  <div className="run-badge-none">Sem cenários vinculados</div>
                )}
              </div>

              {/* Coluna direita */}
              <div className="modal-col-side">
                <div className="form-group">
                  <label className="form-label">Sistema</label>
                  <select
                    className="form-input"
                    value={editForm.system_id}
                    onChange={e => handleEditSystemChange(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {systems.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Feature</label>
                  <select
                    className="form-input"
                    value={editForm.feature_id}
                    onChange={e => setEditForm(prev => ({ ...prev, feature_id: e.target.value }))}
                    disabled={!editForm.system_id}
                  >
                    <option value="">Selecione</option>
                    {editFilteredFeats.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Etapa</label>
                  <select
                    className="form-input card-stage-listbox"
                    size={4}
                    value={editForm.card_status_id}
                    onChange={e => setEditForm(prev => ({ ...prev, card_status_id: e.target.value }))}
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer modal-footer-spread">
              {confirmDelete ? (
                <>
                  <span className="delete-confirm-text">Confirmar exclusão?</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                    <button className="btn btn-danger" onClick={handleDelete}>Excluir</button>
                  </div>
                </>
              ) : (
                <>
                  <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Excluir</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving || !editForm.title.trim()}
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              )}
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
