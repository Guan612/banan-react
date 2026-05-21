import { createStore } from 'jotai/vanilla'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'

export type ThemeMode = 'light' | 'dark' | 'auto'

const THEME_KEY = 'theme'

const emptyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

const themeStorage = createJSONStorage<ThemeMode>(() =>
  typeof window === 'undefined' ? emptyStorage : window.localStorage,
)

export const themeModeAtom = atomWithStorage<ThemeMode>(
  THEME_KEY,
  'auto',
  themeStorage,
)

export const themeStore = createStore()
