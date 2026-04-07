import { ApiResponse } from './types'

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

  const response = await fetch(`${BASE_URL}${path}`, options)
  const data: T | null = response.status !== 204
    ? await response.json() as T
    : null

  return { status: response.status, data }
}
