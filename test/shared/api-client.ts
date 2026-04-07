import { ApiResponse } from './types'
import { evidence } from './evidence'

export const BASE_URL = process.env.QA_API_URL ?? 'http://localhost:3000'

export async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  const url = `${BASE_URL}${path}`
  const response = await fetch(url, options)
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
