import { request } from '../shared/api-client'
import { log } from '../shared/logger'
import { System, Scenario } from '../shared/types'

let createdSystemId: number | null = null
let createdScenarioId: number | null = null

async function testSystem(): Promise<void> {
  log.section('SYSTEM — CRUD')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any } = await request<System[]>('GET', '/api/system')
  res.status === 200 && Array.isArray(res.data)
    ? log.success(`GET /api/system → ${res.data!.length} sistemas`)
    : log.error(`GET /api/system → esperado 200, recebido ${res.status}`)

  res = await request<System>('POST', '/api/system', { title: `TEST_SYS_${Date.now()}` })
  if (res.status === 201 && res.data?.id) {
    createdSystemId = res.data.id
    log.success(`POST /api/system → criado ID ${createdSystemId}`)
  } else {
    log.error(`POST /api/system → esperado 201, recebido ${res.status}`)
  }

  res = await request('POST', '/api/system', {})
  res.status === 400
    ? log.success('POST /api/system sem título → 400')
    : log.error(`POST /api/system sem título → esperado 400, recebido ${res.status}`)

  if (createdSystemId) {
    res = await request<System>('GET', `/api/system/${createdSystemId}`)
    res.status === 200 && res.data?.id === createdSystemId
      ? log.success(`GET /api/system/:id → encontrado`)
      : log.error(`GET /api/system/:id → esperado 200, recebido ${res.status}`)

    res = await request<System>('PATCH', `/api/system/${createdSystemId}`, { title: `TEST_SYS_UPD_${Date.now()}` })
    res.status === 200
      ? log.success('PATCH /api/system/:id → atualizado')
      : log.error(`PATCH /api/system/:id → esperado 200, recebido ${res.status}`)
  }

  res = await request('GET', '/api/system/99999')
  res.status === 404
    ? log.success('GET /api/system/99999 → 404')
    : log.error(`GET /api/system/99999 → esperado 404, recebido ${res.status}`)

  res = await request('PATCH', '/api/system/99999', { title: 'x' })
  res.status === 404
    ? log.success('PATCH /api/system/99999 → 404')
    : log.error(`PATCH /api/system/99999 → esperado 404, recebido ${res.status}`)
}

async function testSystemScenarioAssociation(): Promise<void> {
  log.section('SYSTEM — associação de cenário')

  if (!createdSystemId) {
    log.warn('Pulando: sistema não foi criado')
    return
  }

  // Criar cenário para associar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any } = await request<Scenario>('POST', '/api/scenario', {
    title: `TEST_SCENARIO_FOR_SYS_${Date.now()}`,
    system_ids: [],
    prerequisites: ['Pre'],
    expectations: ['Expect'],
  })
  if (res.status === 201 && res.data?.id) {
    createdScenarioId = res.data.id
    log.success(`Cenário auxiliar criado ID ${createdScenarioId}`)
  } else {
    log.warn(`Não foi possível criar cenário auxiliar → ${res.status}`)
    return
  }

  res = await request('POST', `/api/system/${createdSystemId}/scenario`, { scenario_id: createdScenarioId })
  res.status === 201 || res.status === 200
    ? log.success('POST /api/system/:id/scenario → associado')
    : log.error(`POST /api/system/:id/scenario → esperado 201, recebido ${res.status}`)

  res = await request('DELETE', `/api/system/${createdSystemId}/scenario/${createdScenarioId}`)
  res.status === 204 || res.status === 200
    ? log.success('DELETE /api/system/:id/scenario/:scenarioId → desassociado')
    : log.error(`DELETE /api/system/:id/scenario/:scenarioId → esperado 204, recebido ${res.status}`)
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  if (createdScenarioId) {
    await request('DELETE', `/api/scenario/${createdScenarioId}`)
    log.info(`Cenário ${createdScenarioId} removido`)
  }
  if (createdSystemId) {
    const res = await request('DELETE', `/api/system/${createdSystemId}`)
    res.status === 204
      ? log.success(`Sistema ${createdSystemId} removido`)
      : log.error(`DELETE /api/system/:id → esperado 204, recebido ${res.status}`)

    const again = await request('DELETE', `/api/system/${createdSystemId}`)
    again.status === 404
      ? log.success('DELETE novamente → 404')
      : log.error(`DELETE novamente → esperado 404, recebido ${again.status}`)
  }
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   TESTES: /api/system            ║')
  console.log('╚══════════════════════════════════╝')
  await testSystem()
  await testSystemScenarioAssociation()
  await cleanup()
}
