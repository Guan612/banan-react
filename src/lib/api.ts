import { clearAuth, getAccessToken, getRefreshToken, persistAuth } from './auth'
import type { ZodType } from 'zod'

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data?: T
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (!value || typeof value !== 'object') {
    return false
  }

  return Object.prototype.hasOwnProperty.call(value, 'success')
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8004'

let refreshPromise: Promise<string | null> | null = null

async function requestWithJson(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  const body = (await response.json()) as unknown
  return { response, body }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { response, body } = await requestWithJson('/api/auth/refresh', {
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ refresh_token: refreshToken }),
        })

        if (!isApiEnvelope(body) || !response.ok || body.success === false || !body.data) {
          clearAuth()
          return null
        }

        const data = body.data as {
          access_token: string
          refresh_token?: string | null
          user?: unknown
        }

        persistAuth({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user as never,
        })

        return data.access_token
      } catch {
        clearAuth()
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  options?: { retryOnAuth?: boolean },
): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  const body = (await response.json()) as unknown

  const canRetryAuth =
    options?.retryOnAuth !== false &&
    response.status === 401 &&
    !path.includes('/api/auth/refresh') &&
    !path.includes('/api/auth/logout')

  if (canRetryAuth) {
    const refreshedAccessToken = await refreshAccessToken()

    if (refreshedAccessToken) {
      return apiRequest<T>(path, init, { retryOnAuth: false })
    }
  }

  if (!response.ok) {
    if (isApiEnvelope(body)) {
      throw new ApiError(body.message || 'Request failed', response.status)
    }

    throw new ApiError('Request failed', response.status)
  }

  if (isApiEnvelope<T>(body)) {
    if (body.success === false) {
      throw new ApiError(body.message || 'Request failed', response.status)
    }

    return body.data as T
  }

  return body as T
}

export function parseApiData<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new ApiError('服务端返回数据格式异常', 500)
  }

  return result.data
}
