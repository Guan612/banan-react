import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )

  return {
    ...actual,
    Link: ({ children, to, activeProps: _activeProps, ...props }: any) => (
      <a href={typeof to === 'string' ? to : '#'} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => vi.fn().mockResolvedValue(undefined),
  }
})

const logout = vi.fn()
const useProfileMock = vi.fn()

vi.mock('../features/auth/use-profile', () => ({
  useProfile: () => useProfileMock(),
  useLogout: () => logout,
}))

import Header from '../components/Header'

describe('Header', () => {
  test('shows login and register actions for guests', () => {
    useProfileMock.mockReturnValue({ isPending: false, data: undefined })

    render(
      <QueryClientProvider client={new QueryClient()}>
        <Header />
      </QueryClientProvider>,
    )

    expect(screen.getByText('登录')).toBeTruthy()
    expect(screen.getByText('注册')).toBeTruthy()
  })

  test('shows username and logout for authenticated users', () => {
    useProfileMock.mockReturnValue({
      isPending: false,
      data: { username: 'banana', nickname: null },
    })

    render(
      <QueryClientProvider client={new QueryClient()}>
        <Header />
      </QueryClientProvider>,
    )

    expect(screen.getByText('banana')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /退出/i }))
    expect(logout).toHaveBeenCalled()
  })
})
