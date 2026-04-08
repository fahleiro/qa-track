import { request } from '../shared/api-client'
import { log } from '../shared/logger'
import { ResultStatus } from '../shared/types'

let createdId: number | null = null

async function testResultStatusCrud(): Promise<void> {
  log.section('RESULT STATUS — CRUD')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: { status: number; data: any }

  // GET lista → seeds devem estar presentes
  res = await request<ResultStatus[]>('GET', '/api/config/status/result')
  if (res.status === 200 && Array.isArray(res.data)) {
    const titles = res.data.map((s: ResultStatus) => s.title)
    const hasSeeds = ['Planned', 'Testing', 'Passed', 'Failed'].every(t => titles.includes(t))
    hasSeeds
      ? log.success(`GET /api/config/status/result → ${res.data.length} status (seeds OK)`)
      : log.error(`GET /api/config/status/result → seeds ausentes. Encontrados: ${titles.join(', ')}`)
  } else {
    log.error(`GET /api/config/status/result → esperado 200, recebido ${res.status}`)
  }

  // POST → criação válida
  res = await request<ResultStatus>('POST', '/api/config/status/result', {
    title: `TEST_RESULT_STATUS_${Date.now()}`,
  })
  if (res.status === 201 && res.data?.id) {
    createdId = res.data.id
    log.success(`POST /api/config/status/result → criado ID ${createdId}`)
  } else {
    log.error(`POST /api/config/status/result → esperado 201, recebido ${res.status}`)
  }

  // POST → sem título
  res = await request('POST', '/api/config/status/result', {})
  res.status === 400
    ? log.success('POST sem título → 400')
    : log.error(`POST sem título → esperado 400, recebido ${res.status}`)

  // POST → título duplicado
  if (createdId) {
    const dupTitle = `TEST_RESULT_DUP_${Date.now()}`
    await request('POST', '/api/config/status/result', { title: dupTitle })
    res = await request('POST', '/api/config/status/result', { title: dupTitle })
    res.status === 409
      ? log.success('POST título duplicado → 409')
      : log.error(`POST título duplicado → esperado 409, recebido ${res.status}`)
    // limpar duplicata
    const listRes = await request<ResultStatus[]>('GET', '/api/config/status/result')
    if (Array.isArray(listRes.data)) {
      const dup = listRes.data.find((s: ResultStatus) => s.title === dupTitle)
      if (dup) await request('DELETE', `/api/config/status/result/${dup.id}`)
    }
  }

  // PATCH → atualização válida
  if (createdId) {
    res = await request('PATCH', `/api/config/status/result/${createdId}`, {
      title: `TEST_RESULT_UPD_${Date.now()}`,
    })
    res.status === 200
      ? log.success('PATCH /api/config/status/result/:id → atualizado')
      : log.error(`PATCH /api/config/status/result/:id → esperado 200, recebido ${res.status}`)
  }

  // PATCH → não encontrado
  res = await request('PATCH', '/api/config/status/result/99999', { title: 'x' })
  res.status === 404
    ? log.success('PATCH /99999 → 404')
    : log.error(`PATCH /99999 → esperado 404, recebido ${res.status}`)
}

async function cleanup(): Promise<void> {
  log.section('CLEANUP')
  if (createdId) {
    const res = await request('DELETE', `/api/config/status/result/${createdId}`)
    res.status === 204
      ? log.success(`Status ${createdId} removido`)
      : log.error(`DELETE → esperado 204, recebido ${res.status}`)

    const again = await request('DELETE', `/api/config/status/result/${createdId}`)
    again.status === 404
      ? log.success('DELETE novamente → 404')
      : log.error(`DELETE novamente → esperado 404, recebido ${again.status}`)
  }
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════════╗')
  console.log('║   TESTES: /api/config/status/result  ║')
  console.log('╚══════════════════════════════════════╝')
  await testResultStatusCrud()
  await cleanup()
}
