import { request } from '../shared/api-client'
import { log } from '../shared/logger'
import { System, Feature, ScenarioStatus, Scenario, Pre, Expect } from '../shared/types'

let createdSystemId: number | null = null
let createdFeatureId: number | null = null
let createdStatusId: number | null = null
let createdScenarioId: number | null = null
let createdPreId: number | null = null
let createdExpectId: number | null = null

async function setup(): Promise<void> {
  log.section('SETUP')
  let res = await request<System>('POST', '/api/system', { title: `TEST_SYS_SCN_${Date.now()}` })
  if (res.status === 201 && res.data?.id) createdSystemId = res.data.id

  res = await request<Feature>('POST', '/api/feature', {
    title: `TEST_FEAT_SCN_${Date.now()}`,
    system_id: createdSystemId,
  })
  if (res.status === 201 && res.data?.id) createdFeatureId = res.data.id

  res = await request<ScenarioStatus>('POST', '/api/config/status/scenario', { title: `TEST_STATUS_SCN_${Date.now()}` })
  if (res.status === 201 && res.data?.id) createdStatusId = res.data.id

  log.success(`Setup: sistema=${createdSystemId}, feature=${createdFeatureId}, status=${createdStatusId}`)
}

async function testScenarioCrud(): Promise<void> {
  log.section('SCENARIO — CRUD')

  let res = await request<Scenario[]>('GET', '/api/scenario')
  res.status === 200 && Array.isArray(res.data)
    ? log.success(`GET /api/scenario → ${res.data!.length} cenários`)
    : log.error(`GET /api/scenario → esperado 200, recebido ${res.status}`)

  res = await request<Scenario>('POST', '/api/scenario', {
    title: `TEST_SCN_${Date.now()}`,
    feature_id: createdFeatureId,
    status_id: createdStatusId,
    system_ids: createdSystemId ? [createdSystemId] : [],
    prerequisites: ['Usuário logado'],
    expectations: ['Sistema responde com sucesso'],
  })
  if (res.status === 201 && res.data?.id) {
    createdScenarioId = res.data.id
    log.success(`POST /api/scenario → criado ID ${createdScenarioId}`)
  } else {
    log.error(`POST /api/scenario → esperado 201, recebido ${res.status}`)
  }

  res = await request('POST', '/api/scenario', { prerequisites: ['x'], expectations: ['y'] })
  res.status === 400
    ? log.success('POST /api/scenario sem título → 400')
    : log.error(`POST /api/scenario sem título → esperado 400, recebido ${res.status}`)

  res = await request('POST', '/api/scenario', { title: 'X', prerequisites: [], expectations: ['y'] })
  res.status === 400
    ? log.success('POST /api/scenario sem pre → 400')
    : log.error(`POST /api/scenario sem pre → esperado 400, recebido ${res.status}`)

  res = await request('POST', '/api/scenario', { title: 'X', prerequisites: ['y'], expectations: [] })
  res.status === 400
    ? log.success('POST /api/scenario sem expect → 400')
    : log.error(`POST /api/scenario sem expect → esperado 400, recebido ${res.status}`)

  if (createdScenarioId) {
    res = await request<Scenario>('GET', `/api/scenario/${createdScenarioId}`)
    res.status === 200 && res.data?.id === createdScenarioId
      ? log.success('GET /api/scenario/:id → encontrado')
      : log.error(`GET /api/scenario/:id → esperado 200, recebido ${res.status}`)

    res = await request('PATCH', `/api/scenario/${createdScenarioId}`, {
      title: `TEST_SCN_UPD_${Date.now()}`,
    })
    res.status === 200
      ? log.success('PATCH /api/scenario/:id → atualizado')
      : log.error(`PATCH /api/scenario/:id → esperado 200, recebido ${res.status}`)
  }

  res = await request('GET', '/api/scenario/99999')
  res.status === 404
    ? log.success('GET /api/scenario/99999 → 404')
    : log.error(`GET /api/scenario/99999 → esperado 404, recebido ${res.status}`)
}

async function testPreExpect(): Promise<void> {
  log.section('SCENARIO — pre / expect')

  if (!createdScenarioId) {
    log.warn('Pulando: cenário não criado')
    return
  }

  let res = await request<Pre>('POST', `/api/scenario/${createdScenarioId}/pre`, { description: 'Pre via TS' })
  if (res.status === 201 && res.data?.id) {
    createdPreId = res.data.id
    log.success(`POST .../pre → ID ${createdPreId}`)
  } else {
    log.error(`POST .../pre → esperado 201, recebido ${res.status}`)
  }

  if (createdPreId) {
    res = await request('PATCH', `/api/scenario/pre/${createdPreId}`, { description: 'Pre atualizado' })
    res.status === 200
      ? log.success('PATCH /api/scenario/pre/:id → atualizado')
      : log.error(`PATCH /api/scenario/pre/:id → esperado 200, recebido ${res.status}`)

    res = await request('DELETE', `/api/scenario/pre/${createdPreId}`)
    res.status === 204
      ? log.success('DELETE /api/scenario/pre/:id → removido')
      : log.error(`DELETE /api/scenario/pre/:id → esperado 204, recebido ${res.status}`)
    createdPreId = null
  }

  res = await request<Expect>('POST', `/api/scenario/${createdScenarioId}/expect`, { description: 'Expect via TS' })
  if (res.status === 201 && res.data?.id) {
    createdExpectId = res.data.id
    log.success(`POST .../expect → ID ${createdExpectId}`)
  } else {
    log.error(`POST .../expect → esperado 201, recebido ${res.status}`)
  }

  if (createdExpectId) {
    res = await request('PATCH', `/api/scenario/expect/${createdExpectId}`, { description: 'Expect atualizado' })
    res.status === 200
      ? log.success('PATCH /api/scenario/expect/:id → atualizado')
      : log.error(`PATCH /api/scenario/expect/:id → esperado 200, recebido ${res.status}`)

    res = await request('DELETE', `/api/scenario/expect/${createdExpectId}`)
    res.status === 204
      ? log.success('DELETE /api/scenario/expect/:id → removido')
      : log.error(`DELETE /api/scenario/expect/:id → esperado 204, recebido ${res.status}`)
    createdExpectId = null
  }
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  if (createdScenarioId) {
    const res = await request('DELETE', `/api/scenario/${createdScenarioId}`)
    res.status === 204
      ? log.success(`Cenário ${createdScenarioId} removido`)
      : log.error(`DELETE /api/scenario/:id → ${res.status}`)

    const again = await request('DELETE', `/api/scenario/${createdScenarioId}`)
    again.status === 404
      ? log.success('DELETE novamente → 404')
      : log.error(`DELETE novamente → esperado 404, recebido ${again.status}`)
  }
  if (createdStatusId) await request('DELETE', `/api/config/status/scenario/${createdStatusId}`)
  if (createdFeatureId) await request('DELETE', `/api/feature/${createdFeatureId}`)
  if (createdSystemId) await request('DELETE', `/api/system/${createdSystemId}`)
  log.info('Dados de teste removidos')
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   TESTES: /api/scenario          ║')
  console.log('╚══════════════════════════════════╝')
  await setup()
  await testScenarioCrud()
  await testPreExpect()
  await cleanup()
}
