import { BASE_URL } from '../shared/api-client'
import { request } from '../shared/api-client'
import { log } from '../shared/logger'

async function testExport(): Promise<unknown> {
  log.section('CONFIG — EXPORT')

  const response = await fetch(`${BASE_URL}/api/config/export`)
  if (!response.ok) {
    log.error(`GET /api/config/export → esperado 200, recebido ${response.status}`)
    return null
  }

  const data: unknown = await response.json()
  if (data && typeof data === 'object') {
    log.success('GET /api/config/export → JSON válido retornado')
    return data
  } else {
    log.error('GET /api/config/export → resposta não é JSON válido')
    return null
  }
}

async function testImport(exportedData: unknown): Promise<void> {
  log.section('CONFIG — IMPORT')

  if (!exportedData) {
    log.warn('Pulando import: export não retornou dados')
    return
  }

  const res = await request('POST', '/api/config/import', exportedData)
  res.status === 200 || res.status === 201
    ? log.success(`POST /api/config/import → ${res.status}`)
    : log.error(`POST /api/config/import → esperado 200/201, recebido ${res.status}`)

  const invalid = await request('POST', '/api/config/import', { invalid: true })
  invalid.status >= 400
    ? log.success(`POST /api/config/import payload inválido → ${invalid.status}`)
    : log.warn(`POST /api/config/import payload inválido → inesperado ${invalid.status}`)
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   TESTES: /api/config export/import ║')
  console.log('╚══════════════════════════════════╝')
  const exported = await testExport()
  await testImport(exported)
}
