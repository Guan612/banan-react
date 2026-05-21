import { getDefaultStore } from 'jotai/vanilla'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'
import type { UserProfile } from './auth-types'

const ACCESS_TOKEN_KEY = 'auth.access_token'
const REFRESH_TOKEN_KEY = 'auth.refresh_token'
const USER_KEY = 'auth.user'

const emptyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

function getStorage() {
  return typeof window === 'undefined' ? emptyStorage : window.localStorage
}

const stringStorage = createJSONStorage<string | null>(() => getStorage())
const userStorage = createJSONStorage<UserProfile | null>(() => getStorage())

export const accessTokenAtom = atomWithStorage<string | null>(
  ACCESS_TOKEN_KEY,
  null,
  stringStorage,
  { getOnInit: true },
)

export const refreshTokenAtom = atomWithStorage<string | null>(
  REFRESH_TOKEN_KEY,
  null,
  stringStorage,
  { getOnInit: true },
)

export const authUserAtom = atomWithStorage<UserProfile | null>(
  USER_KEY,
  null,
  userStorage,
  { getOnInit: true },
)

export const authStore = getDefaultStore()

export function getAccessToken() {
  return authStore.get(accessTokenAtom)
}

export function getRefreshToken() {
  return authStore.get(refreshTokenAtom)
}

export function getStoredUser() {
  return authStore.get(authUserAtom)
}

export function persistAuth(payload: {
  access_token: string
  refresh_token?: string | null
  user?: UserProfile
}) {
  authStore.set(accessTokenAtom, payload.access_token)

  if (payload.refresh_token !== undefined) {
    authStore.set(refreshTokenAtom, payload.refresh_token)
  }

  if (payload.user !== undefined) {
    authStore.set(authUserAtom, payload.user)
  }
}

export function setAccessToken(token: string) {
  authStore.set(accessTokenAtom, token)
}

export function clearAuth() {
  authStore.set(accessTokenAtom, null)
  authStore.set(refreshTokenAtom, null)
  authStore.set(authUserAtom, null)
}

export function clearAccessToken() {
  clearAuth()
}
