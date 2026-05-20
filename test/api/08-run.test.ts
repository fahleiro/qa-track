import { request } from '../shared/api-client'
import { log } from '../shared/logger'
import { System, Feature, Scenario, ScenarioStatus, Run, ResultStatus } from '../shared/types'

let systemId:   number | null = null
let featureId:  number | null = null
let scenarioId: number | null = null
let cardId:     number | null = null
let runId:      number | null = null

async function setup(): Promise<void> {
  log.section('SETUP')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any }

  // Sistema
  res = await request<System>('POST', '/api/system', { title: `TEST_SYS_RUN_${Date.now()}` })
  if (res.status === 201) { systemId = res.data.id; log.success(`Sistema criado ID ${systemId}`) }
  else { log.error(`Falha ao criar sistema → ${res.status}`); return }

  // Feature
  res = await request<Feature>('POST', '/api/feature', {
    title: `TEST_FEAT_RUN_${Date.now()}`,
    system_id: systemId,
  })
  if (res.status === 201) { featureId = res.data.id; log.success(`Feature criada ID ${featureId}`) }
  else { log.error(`Falha ao criar feature → ${res.status}`); return }

  // Status Ativo
  res = await request<ScenarioStatus[]>('GET', '/api/config/status/scenario')
  const ativo = Array.isArray(res.data) ? res.data.find((s: ScenarioStatus) => s.title === 'Ativo') : null
  if (!ativo) { log.error('Status "Ativo" não encontrado'); return }

  // Cenário
  res = await request<Scenario>('POST', '/api/scenario', {
    title: `TEST_SCN_RUN_${Date.now()}`,
    feature_id: featureId,
    status_id: ativo.id,
    system_ids: [systemId],
    prerequisites: ['Pré-requisito de run'],
    expectations: ['Resultado esperado de run'],
  })
  if (res.status === 201) { scenarioId = res.data.id; log.success(`Cenário criado ID ${scenarioId}`) }
  else { log.error(`Falha ao criar cenário → ${res.status}`); return }

  // Card → cria run automaticamente
  res = await request('POST', '/api/kanban/card', {
    title: `TEST_CARD_RUN_${Date.now()}`,
    system_id: systemId,
    feature_id: featureId,
  })
  if (res.status === 201 && res.data?.runCreated) {
    cardId = res.data.id
    runId  = res.data.runInfo?.id
    log.success(`Card criado ID ${cardId}, Run #${runId}`)
  } else {
    log.error(`Falha ao criar card/run → ${res.status}, runCreated=${res.data?.runCreated}`)
  }
}

async function testRunList(): Promise<void> {
  log.section('RUNS — listagem')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any }

  res = await request<Run[]>('GET', '/api/run')
  if (res.status === 200 && Array.isArray(res.data)) {
    const found = runId ? res.data.find((r: Run) => r.id === runId) : null
    log.success(`GET /api/run → ${res.data.length} runs`)
    found
      ? log.success(`  Run #${runId} presente na listagem (status: ${found.status_title}, cenários: ${found.scenario_count})`)
      : log.error(`  Run #${runId} não encontrada na listagem`)
  } else {
    log.error(`GET /api/run → esperado 200, recebido ${res.status}`)
  }
}

async function testRunDetail(): Promise<void> {
  log.section('RUNS — detalhe')
  if (!runId) { log.warn('Pulando: runId não disponível'); return }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any }

  res = await request<Run>('GET', `/api/run/${runId}`)
  if (res.status === 200 && res.data?.id === runId) {
    const hasScenarios = Array.isArray(res.data.scenarios) && res.data.scenarios.length > 0
    hasScenarios
      ? log.success(`GET /api/run/:id → ${res.data.scenarios.length} cenário(s), status: ${res.data.status_title}`)
      : log.error('GET /api/run/:id → scenarios array vazio ou ausente')

    // Verificar que cenários iniciam com status "Planned"
    if (hasScenarios) {
      const allPlanned = res.data.scenarios.every((s: { result_status_title: string }) =>
        s.result_status_title === 'Planned'
      )
      allPlanned
        ? log.success('Todos os cenários iniciam com result_status = Planned')
        : log.error('Cenário(s) não iniciando com result_status = Planned')
    }
  } else {
    log.error(`GET /api/run/:id → esperado 200, recebido ${res.status}`)
  }

  // GET run inexistente → 404
  res = await request('GET', '/api/run/99999')
  res.status === 404
    ? log.success('GET /api/run/99999 → 404')
    : log.error(`GET /api/run/99999 → esperado 404, recebido ${res.status}`)
}

async function testResultStatusUpdate(): Promise<void> {
  log.section('RUNS — atualizar result_status de cenário')
  if (!runId) { log.warn('Pulando: runId não disponível'); return }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any }

  // Buscar cenários da run
  res = await request<Run>('GET', `/api/run/${runId}`)
  if (res.status !== 200 || !Array.isArray(res.data?.scenarios) || res.data.scenarios.length === 0) {
    log.error('Não foi possível obter cenários da run para testar result_status')
    return
  }
  const detail = res.data.scenarios[0]

  // Buscar status "Testing"
  const statusRes = await request<ResultStatus[]>('GET', '/api/config/status/result')
  const testing = Array.isArray(statusRes.data)
    ? statusRes.data.find((s: ResultStatus) => s.title === 'Testing')
    : null
  if (!testing) { log.error('Status "Testing" não encontrado'); return }

  // PATCH sem result_status_id → 400
  res = await request('PATCH', `/api/run/detail/${detail.id}/status`, {})
  res.status === 400
    ? log.success('PATCH sem result_status_id → 400')
    : log.error(`PATCH sem result_status_id → esperado 400, recebido ${res.status}`)

  // PATCH válido → 200
  res = await request('PATCH', `/api/run/detail/${detail.id}/status`, {
    result_status_id: testing.id,
  })
  res.status === 200
    ? log.success(`PATCH /api/run/detail/:id/status → resultado atualizado para Testing`)
    : log.error(`PATCH /api/run/detail/:id/status → esperado 200, recebido ${res.status}`)

  // PATCH id inexistente → 404
  res = await request('PATCH', '/api/run/detail/99999/status', { result_status_id: testing.id })
  res.status === 404
    ? log.success('PATCH /api/run/detail/99999/status → 404')
    : log.error(`PATCH /api/run/detail/99999/status → esperado 404, recebido ${res.status}`)
}

async function testResultStatusInUse(): Promise<void> {
  log.section('RESULT STATUS — exclusão de status em uso')

  // Criar status auxiliar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createRes = await request<any>('POST', '/api/config/status/result', {
    title: `TEST_INUSE_${Date.now()}`,
  })
  if (createRes.status !== 201 || !createRes.data?.id) {
    log.warn('Não foi possível criar status auxiliar para testar bloqueio de exclusão')
    return
  }
  const tempStatusId = createRes.data.id

  // Atribuir esse status a um cenário da run para colocar em uso
  if (runId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runDetail: { status: number; data: any } = await request<Run>('GET', `/api/run/${runId}`)
    if (runDetail.status === 200 && Array.isArray(runDetail.data?.scenarios) && runDetail.data.scenarios.length > 0) {
      await request('PATCH', `/api/run/detail/${runDetail.data.scenarios[0].id}/status`, {
        result_status_id: tempStatusId,
      })
    }
  }

  // Tentar excluir status em uso → 409
  const deleteRes = await request('DELETE', `/api/config/status/result/${tempStatusId}`)
  if (deleteRes.status === 409) {
    log.success('DELETE status em uso → 409 (bloqueio correto)')
    // Limpar: restaurar detail para Planned, depois excluir status auxiliar
    const plannedRes = await request('GET', '/api/config/status/result')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const planned = Array.isArray(plannedRes.data) ? plannedRes.data.find((s: any) => s.title === 'Planned') : null
    if (planned && runId) {
      const runDetail = await request<Run>('GET', `/api/run/${runId}`)
      if (Array.isArray(runDetail.data?.scenarios)) {
        for (const s of runDetail.data!.scenarios!) {
          await request('PATCH', `/api/run/detail/${s.id}/status`, { result_status_id: planned.id })
        }
      }
    }
    await request('DELETE', `/api/config/status/result/${tempStatusId}`)
  } else {
    log.error(`DELETE status em uso → esperado 409, recebido ${deleteRes.status}`)
    await request('DELETE', `/api/config/status/result/${tempStatusId}`)
  }
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  if (cardId)    { await request('DELETE', `/api/kanban/card/${cardId}`); log.info(`Card ${cardId} removido`) }
  if (scenarioId){ await request('DELETE', `/api/scenario/${scenarioId}`); log.info(`Cenário ${scenarioId} removido`) }
  if (featureId) { await request('DELETE', `/api/feature/${featureId}`);  log.info(`Feature ${featureId} removida`) }
  if (systemId)  { await request('DELETE', `/api/system/${systemId}`);    log.info(`Sistema ${systemId} removido`) }
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   TESTES: /api/run               ║')
  console.log('╚══════════════════════════════════╝')
  await setup()
  await testRunList()
  await testRunDetail()
  await testResultStatusUpdate()
  await testResultStatusInUse()
  await cleanup()
}
