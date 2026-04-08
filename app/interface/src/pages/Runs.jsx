import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { runsAPI, resultStatusAPI } from '../services/api'

const RUN_STATUS_CLASS = {
  planned: 'run-badge-planned',
  running: 'run-badge-running',
  closed:  'run-badge-closed',
}

const RUN_STATUSES = ['Planned', 'Running', 'Closed']

export default function Runs() {
  const [runs, setRuns] = useState([])
  const [resultStatuses, setResultStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [runDetail, setRunDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [savingDetail, setSavingDetail] = useState({})
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSystem, setFilterSystem] = useState('')
  const [filterFeature, setFilterFeature] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [r, rs] = await Promise.all([runsAPI.getAll(), resultStatusAPI.getAll()])
      setRuns(r)
      setResultStatuses(rs)
    } catch (err) {
      console.error('Erro ao carregar runs:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDetail = async (runId) => {
    if (expandedId === runId) {
      setExpandedId(null)
      setRunDetail(null)
      return
    }
    setExpandedId(runId)
    setRunDetail(null)
    setDetailLoading(true)
    try {
      const detail = await runsAPI.getById(runId)
      setRunDetail(detail)
    } catch (err) {
      console.error('Erro ao carregar detalhe:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleStatusChange = async (detailId, result_status_id) => {
    setSavingDetail(prev => ({ ...prev, [detailId]: true }))
    try {
      await runsAPI.updateDetailStatus(detailId, parseInt(result_status_id))
      const statusObj = resultStatuses.find(rs => rs.id === parseInt(result_status_id))
      setRunDetail(prev => ({
        ...prev,
        scenarios: prev.scenarios.map(s =>
          s.id === detailId
            ? { ...s, result_status_id: parseInt(result_status_id), result_status_title: statusObj?.title }
            : s
        )
      }))
      const updated = await runsAPI.getAll()
      setRuns(updated)
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    } finally {
      setSavingDetail(prev => ({ ...prev, [detailId]: false }))
    }
  }

  // Derived filter options from run data
  const systems = [...new Map(
    runs.filter(r => r.system_id).map(r => [r.system_id, { id: r.system_id, title: r.system_title }])
  ).values()]

  const features = [...new Map(
    runs
      .filter(r => r.feature_id && (!filterSystem || r.system_id === parseInt(filterSystem)))
      .map(r => [r.feature_id, { id: r.feature_id, title: r.feature_title }])
  ).values()]

  const filteredRuns = runs.filter(r => {
    if (filterStatus && r.status_title !== filterStatus) return false
    if (filterSystem && r.system_id !== parseInt(filterSystem)) return false
    if (filterFeature && r.feature_id !== parseInt(filterFeature)) return false
    return true
  })

  const getStatusClass = (title) => RUN_STATUS_CLASS[title?.toLowerCase()] || 'run-badge-planned'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : null

  if (loading) return <div className="empty"><div className="empty-text">Carregando...</div></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Runs</h1>
        <button className="btn btn-secondary" onClick={() => setGuideOpen(v => !v)}>
          {guideOpen ? 'Fechar guia' : 'Guia'}
        </button>
      </div>

      {/* Reference Guide */}
      {guideOpen && (
        <div className="runs-guide">
          <h3 className="runs-guide-title">Como funciona</h3>
          <p className="runs-guide-text">
            Uma <strong>Run</strong> é criada automaticamente quando um card é adicionado ao Kanban,
            desde que existam cenários cadastrados para o sistema e a feature do card.
          </p>
          <div className="runs-guide-statuses">
            <div className="runs-guide-item">
              <span className="run-badge run-badge-planned">Planned</span>
              <span>Card em Backlog ou Em desenvolvimento</span>
            </div>
            <div className="runs-guide-item">
              <span className="run-badge run-badge-running">Running</span>
              <span>Card movido para "Em testes"</span>
            </div>
            <div className="runs-guide-item">
              <span className="run-badge run-badge-closed">Closed</span>
              <span>Card finalizado (todos os cenários com Passed)</span>
            </div>
          </div>
          <p className="runs-guide-text">
            Cada cenário da Run tem um resultado independente: <em>Planned, Testing, Passed</em> ou <em>Failed</em>.
            O card só avança para <strong>Finalizado</strong> quando todos estiverem como <strong>Passed</strong>.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="runs-filters">
        <select
          className="form-input runs-filter-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {RUN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="form-input runs-filter-select"
          value={filterSystem}
          onChange={e => { setFilterSystem(e.target.value); setFilterFeature('') }}
        >
          <option value="">Todos os sistemas</option>
          {systems.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <select
          className="form-input runs-filter-select"
          value={filterFeature}
          onChange={e => setFilterFeature(e.target.value)}
          disabled={!filterSystem}
        >
          <option value="">Todas as features</option>
          {features.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
      </div>

      {/* Runs List */}
      {filteredRuns.length === 0 ? (
        <div className="empty">
          <div className="empty-text">Nenhuma run encontrada</div>
          <div className="empty-sub">Crie um card no Kanban para gerar uma run automaticamente</div>
        </div>
      ) : (
        <div className="runs-list">
          {filteredRuns.map(run => (
            <div key={run.id} className={`run-item${expandedId === run.id ? ' run-item-expanded' : ''}`}>
              <div
                className="run-item-header"
                onClick={() => loadDetail(run.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && loadDetail(run.id)}
              >
                <div className="run-item-info">
                  <div className="run-item-title">
                    Run #{run.id} — {run.title}
                  </div>
                  <div className="run-item-meta">
                    {run.card_title && (
                      <span className="run-item-card">Card: {run.card_title}</span>
                    )}
                    {run.system_title && <span className="tag">{run.system_title}</span>}
                    {run.feature_title && <span className="tag">{run.feature_title}</span>}
                    {(formatDate(run.start_date) || formatDate(run.end_date)) && (
                      <span className="run-item-dates">
                        {formatDate(run.start_date)}
                        {formatDate(run.end_date) ? ` → ${formatDate(run.end_date)}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="run-item-right">
                  {run.scenario_count > 0 && (
                    <div className="run-item-progress">
                      <span className="run-item-count">{run.passed_count}/{run.scenario_count} Passed</span>
                      <div className="run-progress-bar">
                        <div
                          className="run-progress-fill"
                          style={{ width: `${Math.round((run.passed_count / run.scenario_count) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <span className={`run-badge ${getStatusClass(run.status_title)}`}>
                    {run.status_title}
                  </span>
                  <span className="run-expand-icon">{expandedId === run.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Detail panel */}
              {expandedId === run.id && (
                <div className="run-item-detail">
                  {run.card_id && (
                    <div className="run-detail-link">
                      <Link to="/kanban" className="btn-link">← Ver no Kanban</Link>
                    </div>
                  )}
                  {detailLoading ? (
                    <div className="run-detail-loading">Carregando cenários...</div>
                  ) : runDetail && runDetail.id === run.id ? (
                    runDetail.scenarios.length === 0 ? (
                      <div className="run-detail-empty">Nenhum cenário nesta run</div>
                    ) : (
                      <table className="run-scenarios-table">
                        <thead>
                          <tr>
                            <th>Cenário</th>
                            <th>Resultado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {runDetail.scenarios.map(s => (
                            <tr
                              key={s.id}
                              className={`run-scenario-row run-scenario-${s.result_status_title?.toLowerCase()}`}
                            >
                              <td className="run-scenario-title">{s.scenario_title}</td>
                              <td className="run-scenario-status">
                                <select
                                  className="run-status-select"
                                  value={s.result_status_id || ''}
                                  onChange={e => handleStatusChange(s.id, e.target.value)}
                                  disabled={!!savingDetail[s.id]}
                                >
                                  {resultStatuses.map(rs => (
                                    <option key={rs.id} value={rs.id}>{rs.title}</option>
                                  ))}
                                </select>
                                {savingDetail[s.id] && <span className="run-saving">salvando...</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
