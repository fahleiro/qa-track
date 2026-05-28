import { ApiResponse } from './types'
import { evidence } from './evidence'

export const BASE_URL = process.env.QA_API_URL ?? 'http://localhost:3000'

const AUTH_USERNAME = process.env.QA_TEST_USER ?? 'admin'
const AUTH_PASSWORD = process.env.QA_TEST_PASS ?? 'admin'

let cachedToken: string | null = null
let loginPromise: Promise<string> | null = null

async function login(): Promise<string> {
  const url = `${BASE_URL}/api/auth/login`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: AUTH_USERNAME, password: AUTH_PASSWORD }),
  })
  if (!response.ok) {
    throw new Error(`Falha no login dos testes: HTTP ${response.status}`)
  }
  const data = await response.json() as { token: string }
  return data.token
}

async function ensureToken(): Promise<string> {
  if (cachedToken) return cachedToken
  if (!loginPromise) loginPromise = login()
  cachedToken = await loginPromise
  loginPromise = null
  return cachedToken
}

export async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  const isPublicAuth = path.startsWith('/api/auth/login') || path === '/api/health'
  if (!isPublicAuth) {
    const token = await ensureToken()
    headers.Authorization = `Bearer ${token}`
  }

  const options: RequestInit = { method, headers }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  const url = `${BASE_URL}${path}`
  const response = await fetch(url, options)

  // Token expirado/inválido: tenta refresh único e repete.
  if (response.status === 401 && !isPublicAuth) {
    cachedToken = null
    const token = await ensureToken()
    headers.Authorization = `Bearer ${token}`
    const retry = await fetch(url, { ...options, headers })
    const data: T | null = retry.status !== 204 ? await retry.json() as T : null
    evidence.addApi({
      method,
      url,
      requestBody: body ?? null,
      responseStatus: retry.status,
      responseBody: data,
    })
    return { status: retry.status, data }
  }

  const data: T | null = response.status !== 204
    ? await response.json() as T
    : null

  evidence.addApi({
    method,
    url,
    requestBody: body ?? null,
    responseStatus: response.status,
    responseBody: data,
  })

  return { status: response.status, data }
}
