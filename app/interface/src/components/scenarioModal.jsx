import { useState, useEffect } from 'react'
import { scenariosAPI, systemsAPI } from '../services/api'

// Componente para item de lista dinâmica (pré-requisito ou resultado esperado)
function DynamicListItem({ 
  item, 
  onConfirm, 
  onEdit, 
  onDelete, 
  disabled,
  placeholder 
}) {
  const [value, setValue] = useState(item.description || '')
  const [isEditing, setIsEditing] = useState(!item.confirmed)

  useEffect(() => {
    setValue(item.description || '')
    setIsEditing(!item.confirmed)
  }, [item])

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(item.tempId || item.id, value.trim())
      setIsEditing(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    onEdit(item.tempId || item.id)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      handleConfirm()
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      marginBottom: '6px'
    }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || !isEditing}
        style={{
          flex: 1,
          padding: '8px 10px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          fontSize: '13px',
          backgroundColor: isEditing ? 'white' : '#f5f5f5',
          color: isEditing ? '#333' : '#666'
        }}
      />
      {isEditing ? (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={disabled || !value.trim()}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid var(--color-blue)',
            backgroundColor: 'var(--color-blue)',
            color: 'white',
            cursor: value.trim() ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            fontWeight: '500',
            opacity: value.trim() ? 1 : 0.5
          }}
        >
          OK
        </button>
      ) : (
        <button
          type="button"
          onClick={handleEdit}
          disabled={disabled}
          style={{
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            backgroundColor: 'transparent',
            color: '#666',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Editar
        </button>
      )}
      <button
        type="button"
        onClick={() => onDelete(item.tempId || item.id)}
        disabled={disabled}
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#999',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: 1
        }}
        onMouseEnter={(e) => e.target.style.color = '#e53935'}
        onMouseLeave={(e) => e.target.style.color = '#999'}
      >
        ×
      </button>
    </div>
  )
}

export default function ScenarioModal({ 
  show, 
  onClose, 
  scenario = null, 
  suites = [], 
  defaultSuiteId = null,
  onSave 
}) {
  const [scenarioForm, setScenarioForm] = useState({
    title: '',
    suite_id: null,
    system_ids: []
  })
  const [prerequisites, setPrerequisites] = useState([])
  const [expectations, setExpectations] = useState([])
  const [systems, setSystems] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [tempIdCounter, setTempIdCounter] = useState(0)

  useEffect(() => {
    loadSystems()
  }, [])

  const loadSystems = async () => {
    try {
      const data = await systemsAPI.getAll()
      setSystems(data)
    } catch (error) {
      console.error('Erro ao carregar sistemas:', error)
    }
  }

  useEffect(() => {
    if (show) {
      if (scenario) {
        setScenarioForm({
          title: scenario.title || '',
          suite_id: scenario.suite_id || null,
          system_ids: scenario.systems ? scenario.systems.map(s => s.id) : []
        })
        // Carregar pré-requisitos existentes
        setPrerequisites(
          (scenario.prerequisites || []).map(p => ({
            id: p.id,
            description: p.description,
            confirmed: true,
            isExisting: true
          }))
        )
        // Carregar resultados esperados existentes
        setExpectations(
          (scenario.expectations || []).map(e => ({
            id: e.id,
            description: e.description,
            confirmed: true,
            isExisting: true
          }))
        )
      } else {
        setScenarioForm({
          title: '',
          suite_id: defaultSuiteId,
          system_ids: []
        })
        setPrerequisites([])
        setExpectations([])
      }
      setIsSaving(false)
      setTempIdCounter(0)
    }
  }, [show, scenario, defaultSuiteId])

  const handleClose = () => {
    if (!isSaving) {
      setScenarioForm({ title: '', suite_id: null, system_ids: [] })
      setPrerequisites([])
      setExpectations([])
      setIsSaving(false)
      onClose()
    }
  }

  const handleSystemToggle = (systemId) => {
    setScenarioForm(prev => {
      const isSelected = prev.system_ids.includes(systemId)
      return {
        ...prev,
        system_ids: isSelected 
          ? prev.system_ids.filter(id => id !== systemId)
          : [...prev.system_ids, systemId]
      }
    })
  }

  // Funções para Pré-requisitos
  const addPrerequisite = () => {
    const newTempId = `temp-${tempIdCounter}`
    setTempIdCounter(prev => prev + 1)
    setPrerequisites(prev => [...prev, {
      tempId: newTempId,
      description: '',
      confirmed: false,
      isExisting: false
    }])
  }

  const confirmPrerequisite = (itemId, description) => {
    setPrerequisites(prev => prev.map(item => 
      (item.tempId === itemId || item.id === itemId)
        ? { ...item, description, confirmed: true }
        : item
    ))
  }

  const editPrerequisite = (itemId) => {
    setPrerequisites(prev => prev.map(item => 
      (item.tempId === itemId || item.id === itemId)
        ? { ...item, confirmed: false }
        : item
    ))
  }

  const deletePrerequisite = (itemId) => {
    setPrerequisites(prev => prev.filter(item => 
      item.tempId !== itemId && item.id !== itemId
    ))
  }

  // Funções para Resultados Esperados
  const addExpectation = () => {
    const newTempId = `temp-${tempIdCounter}`
    setTempIdCounter(prev => prev + 1)
    setExpectations(prev => [...prev, {
      tempId: newTempId,
      description: '',
      confirmed: false,
      isExisting: false
    }])
  }

  const confirmExpectation = (itemId, description) => {
    setExpectations(prev => prev.map(item => 
      (item.tempId === itemId || item.id === itemId)
        ? { ...item, description, confirmed: true }
        : item
    ))
  }

  const editExpectation = (itemId) => {
    setExpectations(prev => prev.map(item => 
      (item.tempId === itemId || item.id === itemId)
        ? { ...item, confirmed: false }
        : item
    ))
  }

  const deleteExpectation = (itemId) => {
    setExpectations(prev => prev.filter(item => 
      item.tempId !== itemId && item.id !== itemId
    ))
  }

  const handleSave = async () => {
    if (!scenarioForm.title.trim()) {
      alert('O título do cenário é obrigatório')
      return
    }
    
    const confirmedPrereqs = prerequisites.filter(p => p.confirmed && p.description.trim())
    const confirmedExpecs = expectations.filter(e => e.confirmed && e.description.trim())
    
    if (confirmedPrereqs.length === 0) {
      alert('Pelo menos um pré-requisito é obrigatório')
      return
    }
    if (confirmedExpecs.length === 0) {
      alert('Pelo menos um resultado esperado é obrigatório')
      return
    }

    setIsSaving(true)
    try {
      if (scenario) {
        // Atualização de cenário existente
        await scenariosAPI.update(scenario.id, {
          title: scenarioForm.title,
          suite_id: scenarioForm.suite_id,
          system_ids: scenarioForm.system_ids
        })

        // Gerenciar pré-requisitos
        const existingPreIds = (scenario.prerequisites || []).map(p => p.id)
        const currentPreIds = confirmedPrereqs.filter(p => p.isExisting).map(p => p.id)
        
        // Deletar pré-requisitos removidos
        for (const preId of existingPreIds) {
          if (!currentPreIds.includes(preId)) {
            await scenariosAPI.deletePrerequisite(preId)
          }
        }
        
        // Atualizar ou adicionar pré-requisitos
        for (const pre of confirmedPrereqs) {
          if (pre.isExisting) {
            const original = scenario.prerequisites.find(p => p.id === pre.id)
            if (original && original.description !== pre.description) {
              await scenariosAPI.updatePrerequisite(pre.id, pre.description)
            }
          } else {
            await scenariosAPI.addPrerequisite(scenario.id, pre.description)
          }
        }

        // Gerenciar resultados esperados
        const existingExpIds = (scenario.expectations || []).map(e => e.id)
        const currentExpIds = confirmedExpecs.filter(e => e.isExisting).map(e => e.id)
        
        // Deletar resultados removidos
        for (const expId of existingExpIds) {
          if (!currentExpIds.includes(expId)) {
            await scenariosAPI.deleteExpectation(expId)
          }
        }
        
        // Atualizar ou adicionar resultados
        for (const exp of confirmedExpecs) {
          if (exp.isExisting) {
            const original = scenario.expectations.find(e => e.id === exp.id)
            if (original && original.description !== exp.description) {
              await scenariosAPI.updateExpectation(exp.id, exp.description)
            }
          } else {
            await scenariosAPI.addExpectation(scenario.id, exp.description)
          }
        }
      } else {
        // Criação de novo cenário
        await scenariosAPI.create(
          scenarioForm.title,
          confirmedPrereqs.map(p => p.description),
          confirmedExpecs.map(e => e.description),
          scenarioForm.suite_id,
          scenarioForm.system_ids
        )
      }
      
      if (onSave) {
        await onSave()
      }
      
      handleClose()
    } catch (error) {
      console.error('Erro ao salvar cenário:', error)
      alert('Erro ao salvar cenário. Verifique se o título não está duplicado.')
      setIsSaving(false)
    }
  }

  if (!show) return null

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: 'white'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '12px',
    color: '#666',
    fontWeight: '500'
  }

  const confirmedPrereqsCount = prerequisites.filter(p => p.confirmed).length
  const confirmedExpectationsCount = expectations.filter(e => e.confirmed).length

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={(e) => e.target === e.currentTarget && !isSaving && handleClose()}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid #ddd'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '500', 
            color: 'var(--color-blue)' 
          }}>
            {scenario ? 'Editar Cenário' : 'Novo Cenário'}
          </span>
          <button
            onClick={handleClose}
            disabled={isSaving}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#999',
              cursor: 'pointer',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Título */}
          <div>
            <label style={labelStyle}>
              Título <span style={{ color: 'var(--color-pink)' }}>*</span>
            </label>
            <input
              type="text"
              value={scenarioForm.title}
              onChange={(e) => setScenarioForm({ ...scenarioForm, title: e.target.value })}
              placeholder="Ex: Login com credenciais válidas"
              style={inputStyle}
              disabled={isSaving}
            />
          </div>

          {/* Pré-requisitos */}
          <div>
            <label style={labelStyle}>
              Pré-requisitos <span style={{ color: 'var(--color-pink)' }}>*</span>
              {confirmedPrereqsCount > 0 && (
                <span style={{ 
                  marginLeft: '8px',
                  padding: '2px 6px',
                  backgroundColor: 'var(--color-blue)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '10px'
                }}>
                  {confirmedPrereqsCount}
                </span>
              )}
            </label>
            <div style={{ 
              padding: '10px',
              backgroundColor: '#fafafa',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              {prerequisites.length === 0 ? (
                <p style={{ 
                  color: '#999', 
                  fontSize: '13px', 
                  margin: 0,
                  marginBottom: '8px'
                }}>
                  Nenhum pré-requisito adicionado.
                </p>
              ) : (
                prerequisites.map((item) => (
                  <DynamicListItem
                    key={item.tempId || item.id}
                    item={item}
                    onConfirm={confirmPrerequisite}
                    onEdit={editPrerequisite}
                    onDelete={deletePrerequisite}
                    disabled={isSaving}
                    placeholder="Descreva o pré-requisito..."
                  />
                ))
              )}
              <button
                type="button"
                onClick={addPrerequisite}
                disabled={isSaving}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px dashed #ccc',
                  backgroundColor: 'transparent',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  width: '100%',
                  marginTop: prerequisites.length > 0 ? '4px' : 0
                }}
              >
                + Adicionar pré-requisito
              </button>
            </div>
          </div>

          {/* Resultados Esperados */}
          <div>
            <label style={labelStyle}>
              Resultados Esperados <span style={{ color: 'var(--color-pink)' }}>*</span>
              {confirmedExpectationsCount > 0 && (
                <span style={{ 
                  marginLeft: '8px',
                  padding: '2px 6px',
                  backgroundColor: 'var(--color-blue)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '10px'
                }}>
                  {confirmedExpectationsCount}
                </span>
              )}
            </label>
            <div style={{ 
              padding: '10px',
              backgroundColor: '#fafafa',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              {expectations.length === 0 ? (
                <p style={{ 
                  color: '#999', 
                  fontSize: '13px', 
                  margin: 0,
                  marginBottom: '8px'
                }}>
                  Nenhum resultado esperado adicionado.
                </p>
              ) : (
                expectations.map((item) => (
                  <DynamicListItem
                    key={item.tempId || item.id}
                    item={item}
                    onConfirm={confirmExpectation}
                    onEdit={editExpectation}
                    onDelete={deleteExpectation}
                    disabled={isSaving}
                    placeholder="Descreva o resultado esperado..."
                  />
                ))
              )}
              <button
                type="button"
                onClick={addExpectation}
                disabled={isSaving}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px dashed #ccc',
                  backgroundColor: 'transparent',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  width: '100%',
                  marginTop: expectations.length > 0 ? '4px' : 0
                }}
              >
                + Adicionar resultado esperado
              </button>
            </div>
          </div>

          {/* Suite */}
          <div>
            <label style={labelStyle}>Suite</label>
            <select
              value={scenarioForm.suite_id || 'null'}
              onChange={(e) => setScenarioForm({ ...scenarioForm, suite_id: e.target.value === 'null' ? null : parseInt(e.target.value) })}
              style={inputStyle}
              disabled={isSaving}
            >
              <option value="null">Nenhuma</option>
              {suites.map(suite => (
                <option key={suite.id} value={suite.id}>{suite.title}</option>
              ))}
            </select>
          </div>

          {/* Sistemas */}
          <div>
            <label style={labelStyle}>
              Sistemas
              {scenarioForm.system_ids.length > 0 && (
                <span style={{ 
                  marginLeft: '8px',
                  padding: '2px 6px',
                  backgroundColor: 'var(--color-blue)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '10px'
                }}>
                  {scenarioForm.system_ids.length}
                </span>
              )}
            </label>
            {systems.length === 0 ? (
              <p style={{ 
                color: '#999', 
                fontSize: '13px', 
                margin: 0,
                padding: '10px 12px',
                backgroundColor: '#fafafa',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                Nenhum sistema cadastrado.
              </p>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '6px',
                padding: '10px',
                backgroundColor: '#fafafa',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                {systems.map(system => {
                  const isSelected = scenarioForm.system_ids.includes(system.id)
                  return (
                    <button
                      key={system.id}
                      type="button"
                      onClick={() => handleSystemToggle(system.id)}
                      disabled={isSaving}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--color-blue)' : '#ddd',
                        backgroundColor: isSelected ? 'var(--color-blue)' : 'white',
                        color: isSelected ? 'white' : '#666',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {system.description}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #ddd',
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              color: '#666',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-blue)',
              border: '1px solid var(--color-blue)',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isSaving ? 'Salvando...' : scenario ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}
