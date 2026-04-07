import { request } from '../shared/api-client'
import { log } from '../shared/logger'
import { ScenarioStatus } from '../shared/types'

let createdStatusId: number | null = null

async function testConfigStatus(): Promise<void> {
  log.section('CONFIG STATUS — CRUD')

  let res = await request<ScenarioStatus[]>('GET', '/api/config/status/scenario')
  res.status === 200 && Array.isArray(res.data)
    ? log.success(`GET /api/config/status/scenario → ${res.data!.length} status`)
    : log.error(`GET /api/config/status/scenario → esperado 200, recebido ${res.status}`)

  res = await request<ScenarioStatus>('POST', '/api/config/status/scenario', {
    title: `TEST_STATUS_${Date.now()}`,
  })
  if (res.status === 201 && res.data?.id) {
    createdStatusId = res.data.id
    log.success(`POST /api/config/status/scenario → criado ID ${createdStatusId}`)
  } else {
    log.error(`POST /api/config/status/scenario → esperado 201, recebido ${res.status}`)
  }

  res = await request('POST', '/api/config/status/scenario', {})
  res.status === 400
    ? log.success('POST sem título → 400')
    : log.error(`POST sem título → esperado 400, recebido ${res.status}`)

  if (createdStatusId) {
    res = await request<ScenarioStatus>('GET', `/api/config/status/scenario/${createdStatusId}`)
    res.status === 200 && res.data?.id === createdStatusId
      ? log.success('GET /api/config/status/scenario/:id → encontrado')
      : log.error(`GET /api/config/status/scenario/:id → esperado 200, recebido ${res.status}`)

    res = await request('PATCH', `/api/config/status/scenario/${createdStatusId}`, {
      title: `TEST_STATUS_UPD_${Date.now()}`,
    })
    res.status === 200
      ? log.success('PATCH /api/config/status/scenario/:id → atualizado')
      : log.error(`PATCH /api/config/status/scenario/:id → esperado 200, recebido ${res.status}`)
  }

  res = await request('PATCH', '/api/config/status/scenario/99999', { title: 'x' })
  res.status === 404
    ? log.success('PATCH /99999 → 404')
    : log.error(`PATCH /99999 → esperado 404, recebido ${res.status}`)
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  if (createdStatusId) {
    const res = await request('DELETE', `/api/config/status/scenario/${createdStatusId}`)
    res.status === 204
      ? log.success(`Status ${createdStatusId} removido`)
      : log.error(`DELETE → esperado 204, recebido ${res.status}`)

    const again = await request('DELETE', `/api/config/status/scenario/${createdStatusId}`)
    again.status === 404
      ? log.success('DELETE novamente → 404')
      : log.error(`DELETE novamente → esperado 404, recebido ${again.status}`)
  }
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   TESTES: /api/config/status     ║')
  console.log('╚══════════════════════════════════╝')
  await testConfigStatus()
  await cleanup()
}
