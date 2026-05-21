import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { LoginForm } from '../features/auth/login-form'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, activeProps: _activeProps, ...props }: any) => (
    <a href={typeof to === 'string' ? to : '#'} {...props}>
      {children}
    </a>
  ),
}))

const passwordMutateAsync = vi.fn()
const emailCodeMutateAsync = vi.fn()
const sendEmailCodeMutateAsync = vi.fn()
const smsMutateAsync = vi.fn()
const sendSmsMutateAsync = vi.fn()
const wechatQrcodeMutateAsync = vi.fn(() =>
  Promise.resolve({
    scene_id: 'scene-1',
    qrcode_url: 'https://example.com/qr.png',
    expire_seconds: 300,
  }),
)

vi.mock('../features/auth/use-login', () => ({
  useLogin: () => ({
    mutateAsync: passwordMutateAsync,
    isPending: false,
    error: null,
  }),
}))

vi.mock('../features/auth/use-auth-methods', () => ({
  useEmailCodeLogin: () => ({
    mutateAsync: emailCodeMutateAsync,
    isPending: false,
    error: null,
  }),
  useSendEmailCode: () => ({
    mutateAsync: sendEmailCodeMutateAsync,
    isPending: false,
    error: null,
  }),
  useSmsLogin: () => ({
    mutateAsync: smsMutateAsync,
    isPending: false,
    error: null,
  }),
  useSendSmsCode: () => ({
    mutateAsync: sendSmsMutateAsync,
    isPending: false,
    error: null,
  }),
  useGetWechatQrcode: () => ({
    mutateAsync: wechatQrcodeMutateAsync,
    isPending: false,
    error: null,
  }),
  checkWechatScanStatus: vi.fn(),
  getLinuxDoAuthorizeUrl: vi.fn(),
  loginWithLinuxDoCallback: vi.fn(),
}))

describe('login route', () => {
  test('submits username and password', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LoginForm />
      </QueryClientProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /账号登录/ }))

    fireEvent.change(screen.getByLabelText(/邮箱\/用户名/), {
      target: { value: 'banana' },
    })
    fireEvent.change(screen.getByLabelText(/密码/), {
      target: { value: 'secret123' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: /^登录$/ })[0])

    await waitFor(() => {
      expect(passwordMutateAsync).toHaveBeenCalledWith({
        username: 'banana',
        password: 'secret123',
      })
    })
  })
})
