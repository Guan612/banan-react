import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { setAccessToken } from '../../lib/auth'
import { useProfile } from './use-profile'
import { apiRequest } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  apiRequest: vi.fn(),
  parseApiData: (_schema: unknown, data: unknown) => data,
  ApiError: class ApiError extends Error {
    status: number

    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
}))

function Probe() {
  const query = useProfile()

  if (query.isPending) return <p>loading</p>
  if (query.data) return <p>{query.data.username}</p>
  return <p>guest</p>
}

describe('useProfile', () => {
  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  test('does not fetch profile without a token', async () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <Probe />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('guest')).toBeTruthy()
    expect(apiRequest).not.toHaveBeenCalled()
  })

  test('fetches profile when a token exists', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      id: 1,
      username: 'banana',
      email: 'banana@example.com',
    })
    setAccessToken('secret-token')
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <Probe />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('banana')).toBeTruthy()
    })
  })
})
