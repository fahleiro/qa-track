import { useState, useEffect } from 'react'
import { Plus, Play, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { runsAPI, scenariosAPI, suitesAPI, scenarioStatusAPI, runStatusAPI, resultsAPI } from '../services/api'

export default function TestRuns() {
  const [runs, setRuns] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [suites, setSuites] = useState([])
  const [scenarioStatuses, setScenarioStatuses] = useState([])
  const [runStatuses, setRunStatuses] = useState([])
  const [results, setResults] = useState([])
  const [expandedRuns, setExpandedRuns] = useState(new Set())
  
  // Modals
  const [showRunModal, setShowRunModal] = useState(false)
  const [showSelectScenariosModal, setShowSelectScenariosModal] = useState(false)
  
  // Editing states
  const [editingRun, setEditingRun] = useState(null)
  const [currentRunId, setCurrentRunId] = useState(null)
  const [selectedScenarios, setSelectedScenarios] = useState(new Set())
  const [runForm, setRunForm] = useState({ title: '', description: '', status: null })
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [runsData, scenariosData, suitesData, scenarioStatusesData, runStatusesData, resultsData] = await Promise.all([
        runsAPI.getAll(),
        scenariosAPI.getAll(),
        suitesAPI.getAll(),
        scenarioStatusAPI.getAll(),
        runStatusAPI.getAll(),
        resultsAPI.getAll()
      ])
      setRuns(runsData)
      setScenarios(scenariosData)
      setSuites(suitesData)
      setScenarioStatuses(scenarioStatusesData)
      setRunStatuses(runStatusesData)
      setResults(resultsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
    setLoading(false)
  }

  const toggleRun = (runId) => {
    const newExpanded = new Set(expandedRuns)
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId)
    } else {
      newExpanded.add(runId)
    }
    setExpandedRuns(newExpanded)
  }

  const openRunModal = (run = null) => {
    if (run) {
      setEditingRun(run)
      setRunForm({ 
        title: run.title, 
        description: run.description || '',
        status: run.status
      })
    } else {
      setEditingRun(null)
      setRunForm({ title: '', description: '', status: null })
    }
    setShowRunModal(true)
  }

  const saveRun = async () => {
    if (!runForm.title.trim()) {
      alert('O título da execução é obrigatório')
      return
    }
    if (!runForm.description.trim()) {
      alert('A descrição da execução é obrigatória')
      return
    }
    
    setIsSaving(true)
    
    try {
      if (editingRun) {
        await runsAPI.update(editingRun.id, runForm)
        setShowRunModal(false)
        await loadData()
      } else {
        const newRun = await runsAPI.create(runForm.title, runForm.description, runForm.status)
        setCurrentRunId(newRun.id)
        setShowRunModal(false)
        setShowSelectScenariosModal(true)
      }
    } catch (error) {
      console.error('Erro ao salvar execução:', error)
      alert('Erro ao salvar execução. Verifique se o título não está duplicado.')
    }
    setIsSaving(false)
  }

  const addScenariosToRun = async () => {
    if (selectedScenarios.size === 0) {
      setShowSelectScenariosModal(false)
      setSelectedScenarios(new Set())
      await loadData()
      return
    }

    setIsSaving(true)
    try {
      // Adicionar cada cenário individualmente
      for (const scenarioId of selectedScenarios) {
        await runsAPI.addScenario(currentRunId, scenarioId)
      }
      setShowSelectScenariosModal(false)
      setSelectedScenarios(new Set())
      await loadData()
    } catch (error) {
      console.error('Erro ao adicionar cenários:', error)
      alert('Erro ao adicionar cenários')
    }
    setIsSaving(false)
  }

  const toggleScenarioSelection = (scenarioId) => {
    const newSelected = new Set(selectedScenarios)
    if (newSelected.has(scenarioId)) {
      newSelected.delete(scenarioId)
    } else {
      newSelected.add(scenarioId)
    }
    setSelectedScenarios(newSelected)
  }

  const deleteRun = async (id) => {
    if (!confirm('Deletar esta execução?')) return
    try {
      await runsAPI.delete(id)
      await loadData()
    } catch (error) {
      console.error('Erro ao deletar execução:', error)
    }
  }

  const openEditScenariosModal = async (run) => {
    setCurrentRunId(run.id)
    
    try {
      // Buscar detalhes da execução
      const runDetails = await runsAPI.getById(run.id, true)
      const scenarioIds = runDetails.details?.map(d => d.scenario_id) || []
      setSelectedScenarios(new Set(scenarioIds))
      setShowSelectScenariosModal(true)
    } catch (error) {
      console.error('Erro ao carregar cenários da execução:', error)
    }
  }

  const updateRunStatus = async (runId, newStatusId) => {
    try {
      await runsAPI.update(runId, { status: newStatusId })
      await loadData()
    } catch (error) {
      console.error('Erro ao atualizar status da execução:', error)
    }
  }

  // Agrupar cenários por suite
  const scenariosBySuite = scenarios.reduce((acc, scenario) => {
    const suiteId = scenario.suite_id || 'no-suite'
    if (!acc[suiteId]) acc[suiteId] = []
    acc[suiteId].push(scenario)
    return acc
  }, {})

  if (loading) {
    return <div className="config-container"><p>Carregando...</p></div>
  }

  return (
    <div className="config-container">
      <main className="config-content" style={{ maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ marginBottom: '8px' }}>Execuções de Teste</h2>
            <p className="config-description">Gerencie e execute seus testes organizados em runs</p>
          </div>
          <button 
            onClick={() => openRunModal()}
            className="btn-save"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'auto' }}
          >
            <Plus size={20} />
            Nova Execução
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {runs.length === 0 ? (
            <div className="empty-message">Nenhuma execução criada ainda</div>
          ) : (
            runs.map(run => (
              <TestRunCard 
                key={run.id}
                run={run}
                expanded={expandedRuns.has(run.id)}
                onToggle={() => toggleRun(run.id)}
                onEdit={() => openRunModal(run)}
                onDelete={() => deleteRun(run.id)}
                onEditScenarios={() => openEditScenariosModal(run)}
                scenarioStatuses={scenarioStatuses}
                runStatuses={runStatuses}
                scenarios={scenarios}
                suites={suites}
                results={results}
                onUpdateRunStatus={updateRunStatus}
                onReloadData={loadData}
              />
            ))
          )}
        </div>
      </main>

      {/* Modal Criar/Editar Run */}
      {showRunModal && (
        <div className="modal" onClick={(e) => e.target.className === 'modal' && !isSaving && setShowRunModal(false)}>
          <div className="modal-content">
            <span className="close-btn" onClick={() => setShowRunModal(false)}>&times;</span>
            <h3>{editingRun ? 'Editar Execução' : 'Nova Execução'}</h3>
            
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Título <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={runForm.title}
                onChange={(e) => setRunForm({ ...runForm, title: e.target.value })}
                placeholder="Nome da execução"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid var(--input-border-color)' }}
                disabled={isSaving}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Descrição <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={runForm.description}
                onChange={(e) => setRunForm({ ...runForm, description: e.target.value })}
                placeholder="Descrição da execução"
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid var(--input-border-color)', resize: 'vertical' }}
                disabled={isSaving}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Status</label>
              <select
                value={runForm.status || ''}
                onChange={(e) => setRunForm({ ...runForm, status: e.target.value ? parseInt(e.target.value) : null })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid var(--input-border-color)' }}
                disabled={isSaving}
              >
                <option value="">Selecione um status</option>
                {runStatuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button className="btn-cancel" onClick={() => setShowRunModal(false)} disabled={isSaving}>
                Cancelar
              </button>
              <button 
                className="btn-save" 
                onClick={saveRun} 
                disabled={isSaving || !runForm.title.trim() || !runForm.description.trim()}
              >
                {isSaving ? 'Salvando...' : editingRun ? 'Salvar' : 'Próximo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Selecionar Cenários */}
      {showSelectScenariosModal && (
        <div className="modal" onClick={(e) => e.target.className === 'modal' && !isSaving && setShowSelectScenariosModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
            <span className="close-btn" onClick={() => {
              setShowSelectScenariosModal(false)
              setSelectedScenarios(new Set())
              loadData()
            }}>&times;</span>
            <h3>Selecionar Cenários de Teste</h3>
            <p style={{ color: 'var(--clr-midnight-a30)', marginTop: '8px' }}>
              Escolha os cenários que farão parte desta execução
            </p>

            <div style={{ marginTop: '24px' }}>
              {Object.entries(scenariosBySuite).map(([suiteId, suiteScenarios]) => {
                const suite = suites.find(s => s.id === parseInt(suiteId))
                const suiteName = suite ? suite.title : '🔓 Cenários Soltos'
                
                return (
                  <div key={suiteId} style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--panel-bg-color)', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '12px', color: 'var(--text-color)' }}>📁 {suiteName}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {suiteScenarios.map(scenario => (
                        <label 
                          key={scenario.id}
                          style={{ display: 'flex', alignItems: 'start', gap: '12px', padding: '8px', cursor: 'pointer', borderRadius: '4px' }}
                          className="test-case-checkbox"
                        >
                          <input
                            type="checkbox"
                            checked={selectedScenarios.has(scenario.id)}
                            onChange={() => toggleScenarioSelection(scenario.id)}
                            style={{ marginTop: '4px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500' }}>{scenario.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--clr-midnight-a30)', marginTop: '4px' }}>
                              <strong>Pré:</strong> {scenario.prerequisites && scenario.prerequisites.length > 0 ? scenario.prerequisites.map(p => p.description).join('; ') : '-'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--clr-midnight-a30)', marginTop: '2px' }}>
                              <strong>Esperado:</strong> {scenario.expectations && scenario.expectations.length > 0 ? scenario.expectations.map(e => e.description).join('; ') : '-'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button 
                className="btn-cancel" 
                onClick={() => {
                  setShowSelectScenariosModal(false)
                  setSelectedScenarios(new Set())
                  loadData()
                }}
                disabled={isSaving}
              >
                Pular
              </button>
              <button 
                className="btn-save" 
                onClick={addScenariosToRun}
                disabled={isSaving}
              >
                {isSaving ? 'Adicionando...' : `Adicionar Selecionados (${selectedScenarios.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente do Card de Test Run
function TestRunCard({ 
  run, 
  expanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onEditScenarios, 
  scenarioStatuses, 
  runStatuses,
  scenarios,
  suites,
  results,
  onUpdateRunStatus,
  onReloadData
}) {
  const [runDetails, setRunDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (expanded && !runDetails) {
      loadRunDetails()
    }
  }, [expanded])

  const loadRunDetails = async () => {
    setLoadingDetails(true)
    try {
      const data = await runsAPI.getById(run.id, true)
      setRunDetails(data)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
    }
    setLoadingDetails(false)
  }

  const updateScenarioResult = async (scenarioId, statusId) => {
    try {
      // Criar ou atualizar resultado
      await resultsAPI.create(scenarioId, run.id, statusId)
      await loadRunDetails()
      await onReloadData()
    } catch (error) {
      console.error('Erro ao atualizar resultado:', error)
    }
  }

  const getRunStatusBadge = () => {
    if (run.status) {
      const status = runStatuses.find(s => s.id === run.status)
      if (status) {
        return <span className="status-badge">{status.title}</span>
      }
    }
    return <span className="status-badge pending">Sem Status</span>
  }

  // Mapear cenários vinculados à execução
  const linkedScenarios = runDetails?.details?.map(detail => {
    const scenario = scenarios.find(s => s.id === detail.scenario_id)
    if (!scenario) return null
    
    const suite = suites.find(s => s.id === scenario.suite_id)
    
    // Buscar o resultado mais recente para este cenário nesta execução
    const scenarioResults = results.filter(r => r.scenario_id === detail.scenario_id && r.run_id === run.id)
    const lastResult = scenarioResults.length > 0 ? scenarioResults[scenarioResults.length - 1] : null
    
    return {
      ...scenario,
      suite_name: suite?.title,
      result_status: lastResult?.status,
      result_id: lastResult?.id
    }
  }).filter(Boolean) || []

  return (
    <div className="test-run-card">
      <div className="test-run-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button onClick={onToggle} className="expand-btn">
            {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h3 style={{ margin: 0 }}>{run.title}</h3>
              {getRunStatusBadge()}
            </div>
            {run.description && (
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--clr-midnight-a30)' }}>
                {run.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: 'var(--clr-midnight-a30)' }}>
              <span>📋 {linkedScenarios.length} cenário(s)</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={run.status || ''}
            onChange={(e) => onUpdateRunStatus(run.id, e.target.value ? parseInt(e.target.value) : null)}
            style={{ 
              padding: '6px 12px',
              borderRadius: '6px',
              border: '2px solid var(--input-border-color)',
              fontSize: '13px'
            }}
          >
            <option value="">Alterar Status</option>
            {runStatuses.map(status => (
              <option key={status.id} value={status.id}>
                {status.title}
              </option>
            ))}
          </select>
          <button onClick={onEditScenarios} className="icon-btn" title="Editar Cenários">
            <Plus size={18} />
          </button>
          <button onClick={onEdit} className="icon-btn" title="Editar">
            <Edit2 size={18} />
          </button>
          <button onClick={onDelete} className="icon-btn danger" title="Deletar">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="test-run-details">
          {loadingDetails ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Carregando...</p>
          ) : linkedScenarios.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--clr-midnight-a30)' }}>
              Nenhum cenário nesta execução. Clique em + para adicionar.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {linkedScenarios.map(scenario => {
                const currentStatus = scenarioStatuses.find(s => s.id === scenario.result_status)
                return (
                  <div key={scenario.id} className="test-case-item" style={{ 
                    padding: '16px',
                    border: '2px solid var(--input-border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--panel-bg-color)'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{scenario.title}</div>
                      {scenario.suite_name && (
                        <div style={{ fontSize: '12px', color: 'var(--clr-midnight-a30)' }}>
                          📁 {scenario.suite_name}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Pré-condições:</strong> {scenario.prerequisites && scenario.prerequisites.length > 0 ? scenario.prerequisites.map(p => p.description).join('; ') : '-'}
                      </div>
                      <div>
                        <strong>Esperado:</strong> {scenario.expectations && scenario.expectations.length > 0 ? scenario.expectations.map(e => e.description).join('; ') : '-'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600' }}>Status:</label>
                      <select
                        value={scenario.result_status || ''}
                        onChange={(e) => updateScenarioResult(scenario.id, parseInt(e.target.value))}
                        className="status-select"
                        style={{ flex: 1 }}
                      >
                        <option value="">Selecione status</option>
                        {scenarioStatuses.map(status => (
                          <option key={status.id} value={status.id}>
                            {status.title}
                          </option>
                        ))}
                      </select>
                      {currentStatus && (
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '4px',
                          backgroundColor: 'var(--clr-primary)',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {currentStatus.title}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
