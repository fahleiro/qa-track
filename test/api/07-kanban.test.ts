import { request } from '../shared/api-client'
import { log } from '../shared/logger'
import { System, Feature, Scenario, ScenarioStatus, Card, CardStatus, Run } from '../shared/types'

// IDs de setup
let systemId: number | null = null
let featureId: number | null = null
let scenarioId: number | null = null
let ativoStatusId: number | null = null

// IDs criados nos testes
let cardId: number | null = null
let cardNoRunId: number | null = null
let runId: number | null = null

// Etapas do kanban
let stageBacklog:  CardStatus | null = null
let stageDevId:    number | null = null
let stageTestesId: number | null = null
let stageFinId:    number | null = null

async function setup(): Promise<void> {
  log.section('SETUP')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any }

  // Sistema
  res = await request<System>('POST', '/api/system', { title: `TEST_SYS_KB_${Date.now()}` })
  if (res.status === 201) { systemId = res.data.id; log.success(`Sistema criado ID ${systemId}`) }
  else { log.error(`Falha ao criar sistema → ${res.status}`); return }

  // Feature
  res = await request<Feature>('POST', '/api/feature', {
    title: `TEST_FEAT_KB_${Date.now()}`,
    system_id: systemId,
  })
  if (res.status === 201) { featureId = res.data.id; log.success(`Feature criada ID ${featureId}`) }
  else { log.error(`Falha ao criar feature → ${res.status}`); return }

  // Buscar status "Ativo" nos seeds
  res = await request<ScenarioStatus[]>('GET', '/api/config/status/scenario')
  if (res.status === 200 && Array.isArray(res.data)) {
    const ativo = res.data.find((s: ScenarioStatus) => s.title === 'Ativo')
    if (ativo) { ativoStatusId = ativo.id; log.success(`Status Ativo encontrado ID ${ativoStatusId}`) }
    else { log.error('Status "Ativo" não encontrado nos seeds'); return }
  }

  // Cenário ativo, vinculado ao sistema e feature
  res = await request<Scenario>('POST', '/api/scenario', {
    title: `TEST_SCN_KB_${Date.now()}`,
    feature_id: featureId,
    status_id: ativoStatusId,
    system_ids: [systemId],
    prerequisites: ['Sistema configurado'],
    expectations: ['Operação concluída com sucesso'],
  })
  if (res.status === 201) { scenarioId = res.data.id; log.success(`Cenário criado ID ${scenarioId}`) }
  else { log.error(`Falha ao criar cenário → ${res.status}`) }

  // Carregar etapas do kanban
  res = await request<CardStatus[]>('GET', '/api/kanban/status')
  if (res.status === 200 && Array.isArray(res.data) && res.data.length === 4) {
    const sorted = [...res.data].sort((a: CardStatus, b: CardStatus) => a.order - b.order)
    stageBacklog  = sorted[0]
    stageDevId    = sorted[1].id
    stageTestesId = sorted[2].id
    stageFinId    = sorted[3].id
    log.success(`Etapas carregadas: ${sorted.map((s: CardStatus) => s.title).join(' → ')}`)
  } else {
    log.error(`GET /api/kanban/status → esperado 200 com 4 etapas, recebido ${res.status}`)
  }
}

async function testKanbanStatus(): Promise<void> {
  log.section('KANBAN — etapas')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any }

  res = await request<CardStatus[]>('GET', '/api/kanban/status')
  if (res.status === 200 && Array.isArray(res.data)) {
    const titles = res.data.map((s: CardStatus) => s.title)
    const expected = ['Backlog', 'Em desenvolvimento', 'Em testes', 'Finalizado']
    const allPresent = expected.every(t => titles.includes(t))
    allPresent
      ? log.success(`GET /api/kanban/status → ${res.data.length} etapas (${titles.join(', ')})`)
      : log.error(`GET /api/kanban/status → etapas esperadas ausentes. Encontradas: ${titles.join(', ')}`)

    const ordered = res.data.every((s: CardStatus, i: number) =>
      i === 0 || res.data[i - 1].order <= s.order
    )
    ordered
      ? log.success('Etapas retornadas em ordem crescente de "order"')
      : log.error('Etapas fora de ordem')
  } else {
    log.error(`GET /api/kanban/status → esperado 200, recebido ${res.status}`)
  }
}

async function testCardCrud(): Promise<void> {
  log.section('KANBAN — criação de card')
  if (!systemId || !featureId) { log.warn('Pulando: setup incompleto'); return }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any }

  // POST sem título → 400
  res = await request('POST', '/api/kanban/card', { system_id: systemId, feature_id: featureId })
  res.status === 400
    ? log.success('POST sem título → 400')
    : log.error(`POST sem título → esperado 400, recebido ${res.status}`)

  // POST sem system_id → 400
  res = await request('POST', '/api/kanban/card', { title: 'x', feature_id: featureId })
  res.status === 400
    ? log.success('POST sem system_id → 400')
    : log.error(`POST sem system_id → esperado 400, recebido ${res.status}`)

  // POST sem feature_id → 400
  res = await request('POST', '/api/kanban/card', { title: 'x', system_id: systemId })
  res.status === 400
    ? log.success('POST sem feature_id → 400')
    : log.error(`POST sem feature_id → esperado 400, recebido ${res.status}`)

  // POST card sem cenários vinculados (sistema sem cenários ativos)
  const sys2Res = await request<System>('POST', '/api/system', { title: `TEST_SYS_NORUN_${Date.now()}` })
  const feat2Res = await request<Feature>('POST', '/api/feature', {
    title: `TEST_FEAT_NORUN_${Date.now()}`,
    system_id: sys2Res.data?.id,
  })
  if (sys2Res.status === 201 && feat2Res.status === 201 && sys2Res.data && feat2Res.data) {
    res = await request<Card>('POST', '/api/kanban/card', {
      title: `TEST_CARD_NORUN_${Date.now()}`,
      system_id: sys2Res.data.id,
      feature_id: feat2Res.data.id,
    })
    if (res.status === 201 && res.data?.runCreated === false) {
      cardNoRunId = res.data.id
      log.success('POST card sem cenários ativos → 201, runCreated=false')
    } else {
      log.error(`POST card sem cenários ativos → esperado 201/runCreated=false, recebido ${res.status}`)
    }
    // limpar auxiliares
    if (cardNoRunId) await request('DELETE', `/api/kanban/card/${cardNoRunId}`)
    await request('DELETE', `/api/feature/${feat2Res.data.id}`)
    await request('DELETE', `/api/system/${sys2Res.data.id}`)
  }

  // POST card com cenários ativos → run criada automaticamente
  res = await request<Card>('POST', '/api/kanban/card', {
    title: `TEST_CARD_KB_${Date.now()}`,
    description: 'Card de teste automatizado',
    system_id: systemId,
    feature_id: featureId,
  })
  if (res.status === 201 && res.data?.id) {
    cardId = res.data.id
    if (res.data.runCreated && res.data.runInfo?.id) {
      runId = res.data.runInfo.id
      log.success(`POST /api/kanban/card → criado ID ${cardId}, Run #${runId} (${res.data.runInfo.scenarioCount} cenário(s))`)
    } else {
      log.error(`POST /api/kanban/card → card criado mas Run não foi gerada (runCreated=${res.data.runCreated})`)
    }
  } else {
    log.error(`POST /api/kanban/card → esperado 201, recebido ${res.status}`)
    return
  }

  // GET lista → contém o card criado
  res = await request<Card[]>('GET', '/api/kanban/card')
  if (res.status === 200 && Array.isArray(res.data)) {
    const found = res.data.find((c: Card) => c.id === cardId)
    found
      ? log.success(`GET /api/kanban/card → card ${cardId} presente`)
      : log.error(`GET /api/kanban/card → card ${cardId} não encontrado`)
  } else {
    log.error(`GET /api/kanban/card → esperado 200, recebido ${res.status}`)
  }

  // GET :id → card enriquecido
  res = await request<Card>('GET', `/api/kanban/card/${cardId}`)
  if (res.status === 200 && res.data?.id === cardId) {
    const hasSystem  = !!res.data.system
    const hasFeature = !!res.data.feature
    const hasRun     = !!res.data.run
    const inBacklog  = res.data.card_status?.title === 'Backlog'
    hasSystem && hasFeature && hasRun && inBacklog
      ? log.success('GET /api/kanban/card/:id → enrichment OK (system, feature, run, backlog)')
      : log.error(`GET /api/kanban/card/:id → enrichment incompleto (system=${hasSystem}, feature=${hasFeature}, run=${hasRun}, backlog=${inBacklog})`)
  } else {
    log.error(`GET /api/kanban/card/:id → esperado 200, recebido ${res.status}`)
  }

  // GET :id inexistente → 404
  res = await request('GET', '/api/kanban/card/99999')
  res.status === 404
    ? log.success('GET /api/kanban/card/99999 → 404')
    : log.error(`GET /api/kanban/card/99999 → esperado 404, recebido ${res.status}`)
}

async function testCardFlow(): Promise<void> {
  log.section('KANBAN — fluxo completo (Backlog → Finalizado)')
  if (!cardId || !runId || !stageDevId || !stageTestesId || !stageFinId) {
    log.warn('Pulando: card ou run não criados no passo anterior')
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any }

  // Mover para Em desenvolvimento → sem transição de run
  res = await request<Card>('PATCH', `/api/kanban/card/${cardId}`, { card_status_id: stageDevId })
  if (res.status === 200 && res.data?.card_status?.id === stageDevId) {
    log.success('PATCH → Backlog ➜ Em desenvolvimento (200)')
  } else {
    log.error(`PATCH Backlog → Em desenvolvimento → esperado 200, recebido ${res.status}`)
  }

  // Mover para Em testes → run deve virar Running
  res = await request<Card>('PATCH', `/api/kanban/card/${cardId}`, { card_status_id: stageTestesId })
  if (res.status === 200) {
    log.success('PATCH → Em desenvolvimento ➜ Em testes (200)')
    // Verificar status da run
    const runRes = await request<Run>('GET', `/api/run/${runId}`)
    runRes.data?.status_title === 'Running'
      ? log.success('Run status → Running após mover para Em testes')
      : log.error(`Run status esperado Running, recebido ${runRes.data?.status_title}`)
  } else {
    log.error(`PATCH Em desenvolvimento → Em testes → esperado 200, recebido ${res.status}`)
  }

  // Tentar mover para Finalizado com cenários não-Passed → 400 (bloqueio)
  res = await request('PATCH', `/api/kanban/card/${cardId}`, { card_status_id: stageFinId })
  if (res.status === 400) {
    log.success('PATCH → Finalizado com cenários não-Passed → 400 (bloqueio correto)')
  } else {
    log.error(`PATCH → Finalizado bloqueado → esperado 400, recebido ${res.status}`)
  }

  // Atualizar todos os cenários da run para Passed
  const passedRes = await request('GET', '/api/config/status/result')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passed = Array.isArray(passedRes.data) ? passedRes.data.find((s: any) => s.title === 'Passed') : null
  if (!passed) { log.error('Status "Passed" não encontrado'); return }

  const runDetail = await request<Run>('GET', `/api/run/${runId}`)
  if (runDetail.status === 200 && Array.isArray(runDetail.data?.scenarios)) {
    for (const scenario of runDetail.data!.scenarios!) {
      const patchRes = await request('PATCH', `/api/run/detail/${scenario.id}/status`, {
        result_status_id: passed.id,
      })
      patchRes.status === 200
        ? log.success(`  Cenário ${scenario.scenario_id} → Passed`)
        : log.error(`  Cenário ${scenario.scenario_id} → PATCH falhou ${patchRes.status}`)
    }
  } else {
    log.error(`GET /api/run/${runId} → esperado 200, recebido ${runDetail.status}`)
    return
  }

  // Mover para Finalizado com todos Passed → 200, run → Closed
  res = await request<Card>('PATCH', `/api/kanban/card/${cardId}`, { card_status_id: stageFinId })
  if (res.status === 200) {
    log.success('PATCH → Em testes ➜ Finalizado (200, todos Passed)')
    const runRes = await request<Run>('GET', `/api/run/${runId}`)
    runRes.data?.status_title === 'Closed'
      ? log.success('Run status → Closed após finalizar card')
      : log.error(`Run status esperado Closed, recebido ${runRes.data?.status_title}`)
  } else {
    log.error(`PATCH → Finalizado com todos Passed → esperado 200, recebido ${res.status}: ${JSON.stringify(res.data)}`)
  }
}

async function testCardNotFound(): Promise<void> {
  log.section('KANBAN — card inexistente')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any }

  res = await request('PATCH', '/api/kanban/card/99999', { card_status_id: 1 })
  res.status === 404
    ? log.success('PATCH /api/kanban/card/99999 → 404')
    : log.error(`PATCH /api/kanban/card/99999 → esperado 404, recebido ${res.status}`)

  res = await request('DELETE', '/api/kanban/card/99999')
  res.status === 404
    ? log.success('DELETE /api/kanban/card/99999 → 404')
    : log.error(`DELETE /api/kanban/card/99999 → esperado 404, recebido ${res.status}`)
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  if (cardId) {
    const res = await request('DELETE', `/api/kanban/card/${cardId}`)
    res.status === 204
      ? log.success(`Card ${cardId} removido`)
      : log.error(`DELETE card ${cardId} → esperado 204, recebido ${res.status}`)
  }
  if (scenarioId) { await request('DELETE', `/api/scenario/${scenarioId}`); log.info(`Cenário ${scenarioId} removido`) }
  if (featureId)  { await request('DELETE', `/api/feature/${featureId}`);   log.info(`Feature ${featureId} removida`) }
  if (systemId)   { await request('DELETE', `/api/system/${systemId}`);     log.info(`Sistema ${systemId} removido`) }
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   TESTES: /api/kanban            ║')
  console.log('╚══════════════════════════════════╝')
  await setup()
  await testKanbanStatus()
  await testCardCrud()
  await testCardFlow()
  await testCardNotFound()
  await cleanup()
}

export { runId as exportedRunId }
