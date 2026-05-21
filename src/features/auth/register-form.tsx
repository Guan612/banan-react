import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { Gift, LoaderCircle, MailCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Separator } from '../../components/ui/separator'
import { registerSchema, sendEmailCodeSchema } from '../../lib/auth-schema'
import { getFirstFieldError } from '../../lib/form-utils'
import { normalizeRedirectTarget } from './auth-redirect'
import {
  useRegisterWithEmailVerification,
  useSendEmailCode,
} from './use-auth-methods'

function getInviteCodeFromUrl() {
  if (typeof window === 'undefined') {
    return ''
  }

  return new URLSearchParams(window.location.search).get('code') ?? ''
}

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const normalizedRedirectTo = normalizeRedirectTarget(redirectTo)
  const register = useRegisterWithEmailVerification(normalizedRedirectTo)
  const sendEmailCode = useSendEmailCode()
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'error' | 'success' | null>(null)

  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      emailCode: '',
      nickname: '',
      password: '',
      confirmPassword: '',
      inviteCode: getInviteCodeFromUrl(),
    },
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value }) => {
      setMessage(null)
      await register.mutateAsync(value)
    },
  })

  async function onSendCode() {
    const payload = sendEmailCodeSchema.safeParse({
      email: form.state.values.email,
      purpose: 'register',
    })

    if (!payload.success) {
      setMessageTone('error')
      setMessage(payload.error.issues[0]?.message ?? '请输入正确的邮箱地址')
      return
    }

    await sendEmailCode.mutateAsync(payload.data)
    setMessageTone('success')
    setMessage('验证码已发送到您的邮箱，请查收')
    setCountdown(60)

    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          return 0
        }

        return value - 1
      })
    }, 1000)
  }

  const currentError = register.error?.message || sendEmailCode.error?.message

  return (
    <section className="auth-shell mx-auto max-w-5xl rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="hidden lg:block">
          <p className="island-kicker mb-3">加入我们</p>
          <h1 className="display-title mb-4 text-5xl font-bold tracking-tight text-[var(--auth-text)]">
            开启 AI 创作新体验
          </h1>
          <p className="auth-copy max-w-lg text-base leading-8">
            使用邮箱验证码完成注册，新用户注册即可获得积分，填写邀请码可解锁更高的新手奖励。
          </p>

          <div className="mt-8 space-y-4">
            <div className="auth-segment rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-3 text-[var(--auth-text)]">
                <Gift className="h-5 w-5 text-emerald-300" />
                <span className="font-semibold">新用户专享</span>
              </div>
              <ul className="auth-copy space-y-2 text-sm leading-6">
                <li>注册即送 20 积分，立即体验</li>
                <li>填写邀请码可额外获得 50 积分</li>
                <li>支持海量模板库与现代创作工作流</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <p className="island-kicker mb-3 lg:hidden">创建账号</p>
          <h2 className="display-title mb-3 text-4xl font-bold tracking-tight text-[var(--auth-text)] lg:hidden">
            注册
          </h2>
          <p className="auth-copy mb-8 text-sm leading-7 lg:hidden">
            请填写以下信息完成注册
          </p>

          {message || currentError ? (
            <div
              className={`mb-4 rounded-xl border p-3 text-sm ${
                currentError || messageTone === 'error'
                  ? 'auth-message-error'
                  : 'auth-message-success'
              }`}
            >
              {currentError || message}
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void form.handleSubmit()
            }}
          >
            <form.Field name="username" validators={{ onChange: registerSchema.shape.username }}>
              {(field) => (
                <label className="auth-label block text-sm font-semibold">
                  用户名
                  <Input
                    className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder="3-20个字符，支持字母、数字、下划线"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {field.state.meta.isTouched ? (
                    <span className="mt-2 block text-sm text-rose-300">
                      {getFirstFieldError(field.state.meta.errors)}
                    </span>
                  ) : null}
                </label>
              )}
            </form.Field>

            <form.Field name="email" validators={{ onChange: registerSchema.shape.email }}>
              {(field) => (
                <label className="auth-label block text-sm font-semibold">
                  邮箱
                  <Input
                    type="email"
                    className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder="请输入 qq.com 或 163.com 邮箱"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {field.state.meta.isTouched ? (
                    <span className="mt-2 block text-sm text-rose-300">
                      {getFirstFieldError(field.state.meta.errors)}
                    </span>
                  ) : null}
                </label>
              )}
            </form.Field>

            <form.Field name="emailCode" validators={{ onChange: registerSchema.shape.emailCode }}>
              {(field) => (
                <label className="auth-label block text-sm font-semibold">
                  邮箱验证码
                  <div className="mt-2 flex gap-3">
                    <Input
                      className="auth-input flex-1 rounded-2xl px-4 py-3 text-center font-mono tracking-[0.28em]"
                      placeholder="000000"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={() => void onSendCode()}
                      variant="outline"
                      disabled={countdown > 0 || sendEmailCode.isPending}
                      className="auth-secondary-button h-auto rounded-2xl px-4 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sendEmailCode.isPending
                        ? '发送中'
                        : countdown > 0
                          ? `${countdown}s`
                          : '发送验证码'}
                    </Button>
                  </div>
                  {field.state.meta.isTouched ? (
                    <span className="mt-2 block text-sm text-rose-300">
                      {getFirstFieldError(field.state.meta.errors)}
                    </span>
                  ) : null}
                </label>
              )}
            </form.Field>

            <form.Field name="nickname">
              {(field) => (
                <label className="auth-label block text-sm font-semibold">
                  昵称
                  <Input
                    className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder="显示名称，不填则使用用户名"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            </form.Field>

            <form.Field name="password" validators={{ onChange: registerSchema.shape.password }}>
              {(field) => (
                <label className="auth-label block text-sm font-semibold">
                  密码
                  <Input
                    type="password"
                    className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder="至少6个字符"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {field.state.meta.isTouched ? (
                    <span className="mt-2 block text-sm text-rose-300">
                      {getFirstFieldError(field.state.meta.errors)}
                    </span>
                  ) : null}
                </label>
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <label className="auth-label block text-sm font-semibold">
                  确认密码
                  <Input
                    type="password"
                    className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder="请再次输入密码"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {field.state.meta.isTouched || form.state.isSubmitted ? (
                    <span className="mt-2 block text-sm text-rose-300">
                      {getFirstFieldError(field.state.meta.errors)}
                    </span>
                  ) : null}
                </label>
              )}
            </form.Field>

            <form.Field name="inviteCode">
              {(field) => (
                <label className="auth-label block text-sm font-semibold">
                  邀请码
                  <Input
                    className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder="如有邀请码请填写，可额外获得50积分"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            </form.Field>

            <Button
              type="submit"
              variant="ghost"
              disabled={register.isPending}
              className="auth-submit inline-flex h-auto w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              {register.isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  注册中...
                </>
              ) : (
                <>
                  <MailCheck className="h-4 w-4" />
                  创建账户
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <Separator className="auth-separator-line flex-1" />
            <span className="auth-separator-text text-xs">已有账号</span>
            <Separator className="auth-separator-line flex-1" />
          </div>

          <Link
            to="/login"
            search={
              normalizedRedirectTo !== '/'
                ? { redirect: normalizedRedirectTo }
                : undefined
            }
            className="auth-secondary-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium no-underline transition"
          >
            <UserRound className="h-4 w-4" />
            去登录
          </Link>
        </div>
      </div>
    </section>
  )
}
