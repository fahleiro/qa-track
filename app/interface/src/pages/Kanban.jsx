import { useState, useEffect } from 'react'
import { kanbanAPI, systemsAPI, featuresAPI } from '../services/api'

const RUN_BADGE_CLASS = {
  planned: 'run-badge-planned',
  running: 'run-badge-running',
  closed:  'run-badge-closed',
}

const emptyGroup = () => ({ system_id: '', feature_ids: [] })

// Achata os grupos [{system_id, feature_ids:[]}] em pairs [{system_id, feature_id}]
const groupsToPairs = (groups) => {
  const pairs = []
  const seen = new Set()
  for (const g of groups) {
    const sid = parseInt(g.system_id)
    if (!sid) continue
    for (const f of g.feature_ids) {
      const fid = parseInt(f)
      if (!fid) continue
      const k = `${sid}:${fid}`
      if (seen.has(k)) continue
      seen.add(k)
      pairs.push({ system_id: sid, feature_id: fid })
    }
  }
  return pairs
}

// Converte os impacts agrupados do card em groups [{system_id, feature_ids}]
const impactsToGroups = (impacts) => {
  if (!Array.isArray(impacts) || impacts.length === 0) return [emptyGroup()]
  return impacts.map(i => ({
    system_id:   String(i.system.id),
    feature_ids: i.features.map(f => String(f.id)),
  }))
}

function PairsEditor({ groups, setGroups, features, systems }) {
  const updateGroup = (idx, patch) => {
    setGroups(prev => prev.map((g, i) => i === idx ? { ...g, ...patch } : g))
  }
  const onSystemChange = (idx, system_id) => {
    // reset features quando troca o sistema
    updateGroup(idx, { system_id, feature_ids: [] })
  }
  const onFeaturesChange = (idx, options) => {
    const ids = Array.from(options).filter(o => o.selected).map(o => o.value)
    updateGroup(idx, { feature_ids: ids })
  }
  const addGroup = () => setGroups(prev => [...prev, emptyGroup()])
  const removeGroup = (idx) => setGroups(prev => prev.filter((_, i) => i !== idx))

  // sistemas já usados em OUTROS grupos não aparecem nos seguintes
  const usedElsewhere = (idx) =>
    new Set(groups.filter((_, i) => i !== idx).map(g => g.system_id).filter(Boolean))

  return (
    <div className="pairs-editor">
      {groups.map((g, idx) => {
        const used = usedElsewhere(idx)
        const sysOptions = systems.filter(s => !used.has(String(s.id)) || String(s.id) === g.system_id)
        const featOptions = g.system_id
          ? features.filter(f => f.system_id === parseInt(g.system_id))
          : []
        return (
          <div key={idx} className="pairs-row">
            <div className="pairs-row-header">
              <span className="pairs-row-label">Impacto {idx + 1}</span>
              {groups.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeGroup(idx)}
                  title="Remover impacto"
                >×</button>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sistema</label>
                <select
                  className="form-input"
                  value={g.system_id}
                  onChange={e => onSystemChange(idx, e.target.value)}
                >
                  <option value="">Selecione</option>
                  {sysOptions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Features <span style={{opacity: 0.6, fontWeight: 400, fontSize: '0.85em'}}>
                    ({g.feature_ids.length} selecionada{g.feature_ids.length === 1 ? '' : 's'})
                  </span>
                </label>
                <select
                  className="form-input"
                  multiple
                  size={5}
                  value={g.feature_ids}
                  onChange={e => onFeaturesChange(idx, e.target.selectedOptions)}
                  disabled={!g.system_id}
                  style={{ height: 'auto', minHeight: '120px' }}
                >
                  {featOptions.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
                {g.system_id && featOptions.length === 0 && (
                  <div style={{opacity: 0.6, fontSize: '0.85em', marginTop: '4px'}}>
                    Sem features cadastradas para este sistema.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <button type="button" className="btn btn-secondary btn-sm" onClick={addGroup}>
        + Adicionar outro sistema impactado
      </button>
    </div>
  )
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
  const [newModal, setNewModal]     = useState(false)
  const [newForm, setNewForm]       = useState({ title: '', description: '' })
  const [newGroups, setNewGroups]   = useState([emptyGroup()])
  const [creating, setCreating]     = useState(false)

  // Modal detalhe do card
  const [detailCard, setDetailCard]   = useState(null)
  const [editForm, setEditForm]       = useState({})
  const [editGroups, setEditGroups]   = useState([emptyGroup()])
  const [saving, setSaving]           = useState(false)
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

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 6000)
  }

  // ── Novo card ────────────────────────────────────────────
  const newPairsCount = groupsToPairs(newGroups).length
  const canCreate = newForm.title.trim() && newPairsCount > 0

  const handleCreate = async () => {
    if (!canCreate) return
    setCreating(true)
    try {
      const pairs = groupsToPairs(newGroups)
      const result = await kanbanAPI.createCard({
        title: newForm.title.trim(),
        description: newForm.description.trim() || null,
        pairs,
      })
      setNewModal(false)
      setNewForm({ title: '', description: '' })
      setNewGroups([emptyGroup()])
      showToast(
        result.runCreated
          ? `Card criado · Run #${result.runInfo.id} com ${result.runInfo.scenarioCount} cenário(s)`
          : 'Card criado · nenhum cenário ativo encontrado para os impactos selecionados'
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
      title: card.title,
      description: card.description || '',
      card_status_id: String(card.card_status?.id ?? ''),
    })
    setEditGroups(impactsToGroups(card.impacts))
    setConfirmDelete(false)
  }

  const editPairsCount = groupsToPairs(editGroups).length

  const handleSave = async () => {
    if (!editForm.title.trim()) return
    if (editPairsCount === 0) {
      setAlert('Pelo menos 1 impacto (sistema + feature) é obrigatório.')
      return
    }
    setSaving(true)
    try {
      const pairs = groupsToPairs(editGroups)
      const result = await kanbanAPI.moveCard(detailCard.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        card_status_id: editForm.card_status_id ? parseInt(editForm.card_status_id) : undefined,
        pairs,
      })
      setDetailCard(null)
      if (result?.runUpdate?.message) {
        showToast(result.runUpdate.message)
      }
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
      const result = await kanbanAPI.moveCard(dragging.id, { card_status_id: targetStatusId })
      if (result?.runUpdate?.message) showToast(result.runUpdate.message)
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
                    {Array.isArray(card.impacts) && card.impacts.length > 1 && (
                      <div className="kanban-card-impacts" style={{ fontSize: '0.78em', opacity: 0.7, marginTop: 2 }}>
                        {card.impacts.length} sistemas · {(card.pairs?.length || 0)} pares
                      </div>
                    )}
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
          <div className="modal modal-card-detail" onClick={e => e.stopPropagation()}>
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
              <div className="form-group">
                <label className="form-label">
                  Impactos * <span style={{opacity: 0.6, fontWeight: 400, fontSize: '0.85em'}}>
                    ({newPairsCount} par{newPairsCount === 1 ? '' : 'es'} sistema/feature)
                  </span>
                </label>
                <PairsEditor
                  groups={newGroups}
                  setGroups={setNewGroups}
                  features={features}
                  systems={systems}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setNewModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={creating || !canCreate}
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
                    rows={4}
                    value={editForm.description}
                    onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ resize: 'vertical' }}
                    placeholder="Descrição do card..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Impactos <span style={{opacity: 0.6, fontWeight: 400, fontSize: '0.85em'}}>
                      ({editPairsCount} par{editPairsCount === 1 ? '' : 'es'})
                    </span>
                  </label>
                  <PairsEditor
                    groups={editGroups}
                    setGroups={setEditGroups}
                    features={features}
                    systems={systems}
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
