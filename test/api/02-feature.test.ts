import { request } from '../shared/api-client'
import { log } from '../shared/logger'
import { System, Feature } from '../shared/types'

let createdSystemId: number | null = null
let createdFeatureId: number | null = null

async function setup(): Promise<void> {
  log.section('SETUP')
  const res = await request<System>('POST', '/api/system', { title: `TEST_SYS_FEAT_${Date.now()}` })
  if (res.status === 201 && res.data?.id) {
    createdSystemId = res.data.id
    log.success(`Sistema auxiliar criado ID ${createdSystemId}`)
  } else {
    log.warn(`Não foi possível criar sistema auxiliar → ${res.status}`)
  }
}

async function testFeature(): Promise<void> {
  log.section('FEATURE — CRUD')

  let res = await request<Feature[]>('GET', '/api/feature')
  res.status === 200 && Array.isArray(res.data)
    ? log.success(`GET /api/feature → ${res.data!.length} features`)
    : log.error(`GET /api/feature → esperado 200, recebido ${res.status}`)

  if (createdSystemId) {
    res = await request<Feature[]>('GET', `/api/feature/system/${createdSystemId}`)
    res.status === 200 && Array.isArray(res.data)
      ? log.success(`GET /api/feature/system/:id → ${res.data!.length} features`)
      : log.error(`GET /api/feature/system/:id → esperado 200, recebido ${res.status}`)
  }

  res = await request<Feature>('POST', '/api/feature', {
    title: `TEST_FEAT_${Date.now()}`,
    system_id: createdSystemId,
  })
  if (res.status === 201 && res.data?.id) {
    createdFeatureId = res.data.id
    log.success(`POST /api/feature → criado ID ${createdFeatureId}`)
  } else {
    log.error(`POST /api/feature → esperado 201, recebido ${res.status}`)
  }

  res = await request('POST', '/api/feature', { system_id: createdSystemId })
  res.status === 400
    ? log.success('POST /api/feature sem título → 400')
    : log.error(`POST /api/feature sem título → esperado 400, recebido ${res.status}`)

  if (createdFeatureId) {
    res = await request<Feature>('GET', `/api/feature/${createdFeatureId}`)
    res.status === 200 && res.data?.id === createdFeatureId
      ? log.success('GET /api/feature/:id → encontrado')
      : log.error(`GET /api/feature/:id → esperado 200, recebido ${res.status}`)

    res = await request('PATCH', `/api/feature/${createdFeatureId}`, {
      title: `TEST_FEAT_UPD_${Date.now()}`,
      system_id: createdSystemId,
    })
    res.status === 200
      ? log.success('PATCH /api/feature/:id → atualizado')
      : log.error(`PATCH /api/feature/:id → esperado 200, recebido ${res.status}`)
  }

  res = await request('GET', '/api/feature/99999')
  res.status === 404
    ? log.success('GET /api/feature/99999 → 404')
    : log.error(`GET /api/feature/99999 → esperado 404, recebido ${res.status}`)
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  if (createdFeatureId) {
    const res = await request('DELETE', `/api/feature/${createdFeatureId}`)
    res.status === 204
      ? log.success(`Feature ${createdFeatureId} removida`)
      : log.error(`DELETE /api/feature/:id → esperado 204, recebido ${res.status}`)
  }
  if (createdSystemId) {
    await request('DELETE', `/api/system/${createdSystemId}`)
    log.info(`Sistema ${createdSystemId} removido`)
  }
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   TESTES: /api/feature           ║')
  console.log('╚══════════════════════════════════╝')
  await setup()
  await testFeature()
  await cleanup()
}
