import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { WorkflowProjectsPage } from '../features/workflow/workflow-projects-page'

const navigate = vi.fn()

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
    useNavigate: () => navigate,
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('workflow projects route', () => {
  test('shows canvas projects grouped by category', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(
          typeof input === 'string' || input instanceof URL ? input : input.url,
        )

        if (url.includes('/api/sora2-workflow?limit=100&project_type=canvas2')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                workflows: [
                  {
                    id: 101,
                    user_id: 1,
                    name: '我的画布项目',
                    collaboration_role: 'owner',
                    collaboration_category: 'my_canvas',
                    project_type: 'canvas2',
                    is_sub_account_canvas: false,
                    can_manage_collaboration: false,
                    updated_at: '2026-05-20T08:00:00Z',
                  },
                  {
                    id: 202,
                    user_id: 2,
                    name: '协作画布项目',
                    collaboration_role: 'viewer',
                    collaboration_category: 'invited_collaboration_canvas',
                    project_type: 'canvas2',
                    is_sub_account_canvas: false,
                    can_manage_collaboration: false,
                    updated_at: '2026-05-20T09:00:00Z',
                  },
                ],
              },
            }),
          }
        }

        throw new Error(`Unhandled fetch: ${url}`)
      }),
    )

    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkflowProjectsPage />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('我的画布项目')).toBeTruthy()
    })

    expect(screen.getByText('画布 2.0')).toBeTruthy()
    expect(
      screen.getByRole('button', {
        name: /我的画布\s*1/i,
      }),
    ).toBeTruthy()
    expect(screen.queryByText('协作画布项目')).toBeNull()
  })
})
