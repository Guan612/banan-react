import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { RegisterForm } from '../features/auth/register-form'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, activeProps: _activeProps, ...props }: any) => (
    <a href={typeof to === 'string' ? to : '#'} {...props}>
      {children}
    </a>
  ),
}))

const mutateAsync = vi.fn()
const sendCodeMutateAsync = vi.fn()

vi.mock('../features/auth/use-auth-methods', () => ({
  useRegisterWithEmailVerification: () => ({
    mutateAsync,
    isPending: false,
    error: null,
  }),
  useSendEmailCode: () => ({
    mutateAsync: sendCodeMutateAsync,
    isPending: false,
    error: null,
  }),
}))

describe('register route', () => {
  test('submits email verification registration form', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RegisterForm />
      </QueryClientProvider>,
    )

    fireEvent.change(screen.getByLabelText(/用户名/), {
      target: { value: 'banana' },
    })
    fireEvent.change(screen.getByLabelText(/^邮箱$/), {
      target: { value: 'banana@qq.com' },
    })
    fireEvent.change(screen.getByLabelText(/^邮箱验证码$/), {
      target: { value: '123456' },
    })
    fireEvent.change(screen.getByLabelText(/^密码$/), {
      target: { value: 'secret12345' },
    })
    fireEvent.change(screen.getByLabelText(/确认密码/), {
      target: { value: 'secret12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: /创建账户/ }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        username: 'banana',
        email: 'banana@qq.com',
        emailCode: '123456',
        nickname: '',
        password: 'secret12345',
        confirmPassword: 'secret12345',
        inviteCode: '',
      })
    })
  })
})
