import { request, BASE_URL } from '../shared/api-client'
import { log } from '../shared/logger'

interface LoginResponse {
  token: string
  user: { id: number; username: string; role: string }
}

interface MeResponse {
  id: number
  username: string
  role: string
}

async function testLogin(): Promise<void> {
  log.section('AUTH — login (caminho feliz)')

  const username = process.env.QA_TEST_USER ?? 'admin'
  const password = process.env.QA_TEST_PASS ?? 'admin'

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json() as LoginResponse

  if (res.status !== 200) {
    log.error(`POST /api/auth/login → esperado 200, recebido ${res.status}`)
    throw new Error(`Login falhou: ${res.status}`)
  }
  if (!data.token || !data.user?.username) {
    log.error('Resposta do login sem token ou user')
    throw new Error('Login: resposta inválida')
  }
  log.success(`POST /api/auth/login → 200 (user=${data.user.username}, role=${data.user.role})`)
}

async function testMe(): Promise<void> {
  log.section('AUTH — /api/auth/me com Bearer token')
  const res = await request<MeResponse>('GET', '/api/auth/me')
  if (res.status === 200 && res.data?.username) {
    log.success(`GET /api/auth/me → 200 (user=${res.data.username})`)
  } else {
    log.error(`GET /api/auth/me → esperado 200, recebido ${res.status}`)
    throw new Error(`/me retornou ${res.status}`)
  }
}

export async function run(): Promise<void> {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   TESTES: /api/auth              ║')
  console.log('╚══════════════════════════════════╝')
  await testLogin()
  await testMe()
}
