import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { apiRequest } from './api'
import { clearAuth, persistAuth, setAccessToken } from './auth'

describe('apiRequest', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    clearAuth()
    vi.unstubAllGlobals()
  })

  test('adds bearer token when one is stored', async () => {
    setAccessToken('secret-token')
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: true, data: { ok: true }, message: 'ok' }),
        { status: 200 },
      ),
    )

    await apiRequest('/api/auth/profile')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8004/api/auth/profile',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )

    const [, options] = fetchMock.mock.calls[0]
    expect((options.headers as Headers).get('Authorization')).toBe(
      'Bearer secret-token',
    )
  })

  test('throws backend message when request envelope reports failure', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, message: 'Bad credentials' }),
        { status: 400 },
      ),
    )

    await expect(apiRequest('/api/auth/login')).rejects.toMatchObject({
      message: 'Bad credentials',
    })
  })

  test('unwraps the response data on success', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: true, data: { username: 'banana' } }),
        { status: 200 },
      ),
    )

    await expect(apiRequest('/api/auth/profile')).resolves.toEqual({
      username: 'banana',
    })
  })

  test('refreshes token after a 401 response', async () => {
    persistAuth({
      access_token: 'expired-token',
      refresh_token: 'refresh-token',
      user: {
        id: 1,
        username: 'banana',
        email: 'banana@qq.com',
      },
    })

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
          status: 401,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              access_token: 'fresh-token',
              refresh_token: 'fresh-refresh-token',
              user: {
                id: 1,
                username: 'banana',
                email: 'banana@qq.com',
              },
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, data: { username: 'banana' } }),
          { status: 200 },
        ),
      )

    await expect(apiRequest('/api/auth/profile')).resolves.toEqual({
      username: 'banana',
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8004/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })
})
