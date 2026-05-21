import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { PublicHome } from '../features/home/public-home'
import { UserHome } from '../features/home/user-home'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, activeProps: _activeProps, ...props }: any) => (
      <a href={typeof to === 'string' ? to : '#'} {...props}>
        {children}
      </a>
  ),
  useNavigate: () => vi.fn(),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

function mockFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = String(
        typeof input === 'string' || input instanceof URL ? input : input.url,
      )

      if (url.includes('/api/workflow-prompts/public')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                key: 'style_cinema',
                name: '电影感',
                value: 'cinematic',
                prompt_type: 'style',
                is_active: true,
              },
            ],
          }),
        }
      }

      if (url.includes('/api/home-videos/public')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 1,
                title: '雾海之城',
                description: '一个漂浮在云层上的故事',
                cover_url: 'https://example.com/cover.jpg',
              },
            ],
          }),
        }
      }

      if (url.includes('/api/sora2-workflow?skip=0&limit=6')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              workflows: [
                {
                  id: 9,
                  name: '我的最近项目',
                  updated_at: '2026-05-20T00:00:00Z',
                },
              ],
            },
          }),
        }
      }

      throw new Error(`Unhandled fetch: ${url}`)
    }),
  )
}

describe('home route', () => {
  test('shows guest homepage when no profile is available', async () => {
    mockFetch()

    render(
      <QueryClientProvider client={new QueryClient()}>
        <PublicHome />
      </QueryClientProvider>,
    )

    expect(screen.getByText(/重新定义/i)).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByText(/雾海之城/i)).toBeTruthy()
    })
  })

  test('shows recent projects for signed-in users', async () => {
    mockFetch()

    render(
      <QueryClientProvider client={new QueryClient()}>
        <UserHome
          profile={{
            id: 1,
            username: 'banana',
            email: 'banana@example.com',
            nickname: 'Banana',
            membership_level: 'Pro',
            remaining_quota: 12,
          }}
        />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText(/我的最近项目/i)).toBeTruthy()
    })
    expect(screen.getByText(/我的最近项目/)).toBeTruthy()
    expect(screen.getByText(/延续你上一次的创作现场|全部/)).toBeTruthy()
  })
})
