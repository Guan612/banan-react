import { afterEach, describe, expect, test } from 'vitest'
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  persistAuth,
  setAccessToken,
} from './auth'

describe('auth token storage', () => {
  afterEach(() => {
    localStorage.clear()
    clearAuth()
  })

  test('returns null when no token is stored', () => {
    expect(getAccessToken()).toBeNull()
  })

  test('stores and reads an access token', () => {
    setAccessToken('abc123')

    expect(getAccessToken()).toBe('abc123')
  })

  test('clears a stored access token', () => {
    setAccessToken('abc123')
    clearAuth()

    expect(getAccessToken()).toBeNull()
  })

  test('stores refresh token and user profile together', () => {
    persistAuth({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      user: {
        id: 1,
        username: 'banana',
        email: 'banana@qq.com',
      },
    })

    expect(getAccessToken()).toBe('access-1')
    expect(getRefreshToken()).toBe('refresh-1')
    expect(getStoredUser()).toMatchObject({
      username: 'banana',
    })
  })

  test('returns null during SSR when window is unavailable', () => {
    const originalWindow = globalThis.window

    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
    })

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()

    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
    })
  })
})
