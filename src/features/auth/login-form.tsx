import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { LoaderCircle, QrCode, Smartphone, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Separator } from '../../components/ui/separator'
import {
  emailCodeLoginSchema,
  loginSchema,
  sendEmailCodeSchema,
  sendSmsCodeSchema,
  smsCodeSchema,
} from '../../lib/auth-schema'
import { getFirstFieldError } from '../../lib/form-utils'
import {
  checkWechatScanStatus,
  getLinuxDoAuthorizeUrl,
  loginWithLinuxDoCallback,
  useEmailCodeLogin,
  useGetWechatQrcode,
  useSendEmailCode,
  useSendSmsCode,
  useSmsLogin,
} from './use-auth-methods'
import { normalizeRedirectTarget } from './auth-redirect'
import { useLogin } from './use-login'
import { persistAuth } from '../../lib/auth'

type LoginMode = 'wechat' | 'phone' | 'password' | 'code'

function getInviteCodeFromUrl() {
  if (typeof window === 'undefined') {
    return ''
  }

  return new URLSearchParams(window.location.search).get('invite') ?? ''
}

function useCountdown() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (seconds <= 0) {
      return
    }

    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds])

  return [seconds, setSeconds] as const
}

const WECHAT_QRCODE_THROTTLE_MS = 15_000
const WECHAT_QRCODE_FAILURE_COOLDOWN_MS = 45_000

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const normalizedRedirectTo = normalizeRedirectTarget(redirectTo)
  const passwordLogin = useLogin(normalizedRedirectTo)
  const emailCodeLogin = useEmailCodeLogin(normalizedRedirectTo)
  const sendEmailCode = useSendEmailCode()
  const smsLogin = useSmsLogin(normalizedRedirectTo)
  const sendSmsCode = useSendSmsCode()
  const getWechatQrcode = useGetWechatQrcode()

  const [mode, setMode] = useState<LoginMode>('wechat')
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'error' | 'success' | null>(null)
  const [emailCountdown, setEmailCountdown] = useCountdown()
  const [smsCountdown, setSmsCountdown] = useCountdown()
  const [wechatSceneId, setWechatSceneId] = useState('')
  const [wechatQrcodeUrl, setWechatQrcodeUrl] = useState('')
  const [wechatStatusText, setWechatStatusText] = useState('请使用微信扫描二维码')
  const [wechatImageLoading, setWechatImageLoading] = useState(false)
  const [wechatImageError, setWechatImageError] = useState(false)
  const [wechatCooldownSeconds, setWechatCooldownSeconds] = useState(0)
  const lastWechatFetchAtRef = useRef(0)
  const wechatFailureCooldownUntilRef = useRef(0)
  const wechatCooldownTimerRef = useRef<number | null>(null)
  const lastWechatInviteCodeRef = useRef('')

  const passwordForm = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setMessage(null)
      await passwordLogin.mutateAsync(value)
    },
  })

  const codeForm = useForm({
    defaultValues: {
      email: '',
      code: '',
    },
    validators: {
      onSubmit: emailCodeLoginSchema,
    },
    onSubmit: async ({ value }) => {
      setMessage(null)
      await emailCodeLogin.mutateAsync(value)
    },
  })

  const smsForm = useForm({
    defaultValues: {
      phone: '',
      code: '',
      invite_code: getInviteCodeFromUrl(),
    },
    validators: {
      onSubmit: smsCodeSchema,
    },
    onSubmit: async ({ value }) => {
      setMessage(null)
      await smsLogin.mutateAsync(value)
    },
  })

  const wechatInviteForm = useForm({
    defaultValues: {
      inviteCode: getInviteCodeFromUrl(),
    },
    onSubmit: async () => {},
  })

  const currentError =
    passwordLogin.error?.message ||
    emailCodeLogin.error?.message ||
    smsLogin.error?.message ||
    sendEmailCode.error?.message ||
    sendSmsCode.error?.message ||
    getWechatQrcode.error?.message

  useEffect(() => {
    if (!currentError) {
      return
    }

    setMessageTone('error')
    setMessage(currentError)
  }, [currentError])

  useEffect(() => {
    return () => {
      if (wechatCooldownTimerRef.current) {
        window.clearInterval(wechatCooldownTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const code = new URLSearchParams(window.location.search).get('code')

    if (!code) {
      return
    }

    let cancelled = false

    async function runLinuxDoCallback() {
      setMessageTone('success')
      setMessage('正在处理 Linux Do 登录...')

      try {
        const data = await loginWithLinuxDoCallback(code)

        if (cancelled) {
          return
        }

        persistAuth(data)
        window.location.href = normalizedRedirectTo
      } catch (error) {
        if (cancelled) {
          return
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Linux Do 登录失败，请重试'
        setMessageTone('error')
        setMessage(errorMessage)
      }
    }

    void runLinuxDoCallback()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (mode !== 'wechat') {
      return
    }

    let cancelled = false

    async function loadQrcode() {
      try {
        await fetchWechatQrcode({
          force: false,
          inviteCode: wechatInviteForm.state.values.inviteCode,
        })

        if (cancelled) {
          return
        }
      } catch {
        // handled by shared message effect
      }
    }

    void loadQrcode()

    return () => {
      cancelled = true
    }
  }, [mode, wechatInviteForm.state.values.inviteCode])

  useEffect(() => {
    if (mode !== 'wechat' || !wechatSceneId) {
      return
    }

    let active = true
    const timer = window.setInterval(async () => {
      try {
        const result = await checkWechatScanStatus(wechatSceneId)

        if (!active) {
          return
        }

        if (result.status === 'confirmed' && result.access_token) {
          persistAuth(result)
          window.location.href = normalizedRedirectTo
          return
        }

        if (result.status === 'scanned') {
          setWechatStatusText('已扫码，请在微信内确认登录')
          return
        }

        if (result.status === 'expired') {
          setWechatStatusText('二维码已过期，请刷新')
          return
        }

        setWechatStatusText('请使用微信扫描二维码')
      } catch {
        // ignore poll jitter, user can refresh
      }
    }, 2000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [mode, wechatSceneId])

  function startWechatCooldown(seconds: number) {
    if (wechatCooldownTimerRef.current) {
      window.clearInterval(wechatCooldownTimerRef.current)
    }

    setWechatCooldownSeconds(seconds)

    wechatCooldownTimerRef.current = window.setInterval(() => {
      setWechatCooldownSeconds((value) => {
        if (value <= 1) {
          if (wechatCooldownTimerRef.current) {
            window.clearInterval(wechatCooldownTimerRef.current)
            wechatCooldownTimerRef.current = null
          }
          return 0
        }

        return value - 1
      })
    }, 1000)
  }

  async function preloadWechatQrcode(url: string) {
    setWechatImageLoading(true)
    setWechatImageError(false)

    await new Promise<void>((resolve, reject) => {
      const image = new window.Image()
      image.referrerPolicy = 'no-referrer'
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('二维码图片加载失败'))
      image.src = url
    })
  }

  async function fetchWechatQrcode({
    force,
    inviteCode,
  }: {
    force: boolean
    inviteCode: string
  }) {
    const now = Date.now()
    const normalizedInviteCode = inviteCode.trim()
    const inviteChanged = normalizedInviteCode !== lastWechatInviteCodeRef.current
    const inFailureCooldown = now < wechatFailureCooldownUntilRef.current
    const withinThrottleWindow = now - lastWechatFetchAtRef.current < WECHAT_QRCODE_THROTTLE_MS

    if (!force) {
      if (inFailureCooldown) {
        const remainingSeconds = Math.ceil(
          (wechatFailureCooldownUntilRef.current - now) / 1000,
        )
        startWechatCooldown(remainingSeconds)
        setWechatStatusText(`请求过于频繁，请 ${remainingSeconds}s 后重试`)
        return null
      }

      if (withinThrottleWindow && !inviteChanged) {
        return null
      }
    }

    setMessage(null)
    lastWechatFetchAtRef.current = now

    try {
      const data = await getWechatQrcode.mutateAsync(normalizedInviteCode)
      await preloadWechatQrcode(data.qrcode_url)
      lastWechatInviteCodeRef.current = normalizedInviteCode
      wechatFailureCooldownUntilRef.current = 0
      setWechatCooldownSeconds(0)
      setWechatSceneId(data.scene_id)
      setWechatQrcodeUrl(data.qrcode_url)
      setWechatStatusText('请使用微信扫描二维码')
      setWechatImageError(false)
      return data
    } catch (error) {
      const cooldownUntil = Date.now() + WECHAT_QRCODE_FAILURE_COOLDOWN_MS
      wechatFailureCooldownUntilRef.current = cooldownUntil
      const remainingSeconds = Math.ceil(
        WECHAT_QRCODE_FAILURE_COOLDOWN_MS / 1000,
      )
      startWechatCooldown(remainingSeconds)
      setWechatImageError(true)
      setWechatQrcodeUrl('')
      setWechatStatusText(`二维码获取失败，请 ${remainingSeconds}s 后重试`)
      throw error
    } finally {
      setWechatImageLoading(false)
    }
  }

  async function onSendEmailCode() {
    setMessage(null)

    const payload = sendEmailCodeSchema.safeParse({
      email: codeForm.state.values.email,
      purpose: 'login',
    })

    if (!payload.success) {
      setMessageTone('error')
      setMessage(payload.error.issues[0]?.message ?? '请输入正确的邮箱地址')
      return
    }

    await sendEmailCode.mutateAsync(payload.data)
    setMessageTone('success')
    setMessage('验证码已发送到您的邮箱')
    setEmailCountdown(60)
  }

  async function onSendSmsCode() {
    setMessage(null)

    const payload = sendSmsCodeSchema.safeParse({
      phone: smsForm.state.values.phone,
      purpose: 'sms_login',
    })

    if (!payload.success) {
      setMessageTone('error')
      setMessage(payload.error.issues[0]?.message ?? '请输入正确的手机号')
      return
    }

    await sendSmsCode.mutateAsync(payload.data)
    setMessageTone('success')
    setMessage('短信验证码已发送')
    setSmsCountdown(60)
  }

  async function onLinuxDoLogin() {
    const url = await getLinuxDoAuthorizeUrl()
    window.location.href = url
  }

  return (
    <section className="auth-shell mx-auto max-w-xl rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
      <p className="island-kicker mb-3">账号登录</p>
      <h1 className="display-title mb-3 text-4xl font-bold tracking-tight text-[var(--auth-text)] sm:text-5xl">
        欢迎回来
      </h1>
      <p className="auth-copy mb-8 max-w-lg text-sm leading-7 sm:text-base">
        登录以继续你的 AI 创作之旅
      </p>

      <div className="auth-segment mb-6 grid grid-cols-3 gap-1 rounded-xl p-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setMode('wechat')}
          className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            mode === 'wechat'
              ? 'bg-[#07C160] text-white shadow-[0_12px_28px_rgba(7,193,96,0.22)]'
              : 'auth-segment-button'
          }`}
        >
          微信扫码
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setMode('phone')}
          className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            mode === 'phone' ? 'auth-segment-button is-active' : 'auth-segment-button'
          }`}
        >
          手机登录
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setMode('password')}
          className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            mode === 'password' || mode === 'code'
              ? 'auth-segment-button is-active'
              : 'auth-segment-button'
          }`}
        >
          账号登录
        </Button>
      </div>

      {message ? (
        <div
          className={`mb-4 rounded-xl border p-3 text-sm ${
            messageTone === 'success'
              ? 'auth-message-success'
              : 'auth-message-error'
          }`}
        >
          {message}
        </div>
      ) : null}

      {mode === 'wechat' ? (
        <div className="flex flex-col items-center">
          <label className="auth-label mb-4 block w-full text-sm font-semibold">
            邀请码
            <Input
              className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
              placeholder="邀请码（选填，可额外获得铃铛）"
              value={wechatInviteForm.state.values.inviteCode}
              onChange={(event) =>
                wechatInviteForm.setFieldValue('inviteCode', event.target.value)
              }
            />
          </label>

          <div className="auth-qr-frame flex min-h-64 w-64 items-center justify-center rounded-[1.5rem] p-3">
            {getWechatQrcode.isPending || wechatImageLoading ? (
              <LoaderCircle className="h-8 w-8 animate-spin text-[#07C160]" />
            ) : wechatQrcodeUrl ? (
              <img
                key={wechatSceneId || wechatQrcodeUrl}
                src={wechatQrcodeUrl}
                alt="微信登录二维码"
                referrerPolicy="no-referrer"
                className="h-56 w-56 rounded-xl bg-white p-2"
              />
            ) : (
              <div className="auth-separator-text text-center text-sm">
                <QrCode className="mx-auto mb-3 h-8 w-8" />
                {wechatImageError ? '二维码加载失败' : '二维码加载中...'}
              </div>
            )}
          </div>

          <p className="auth-copy mt-5 text-sm">{wechatStatusText}</p>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              void fetchWechatQrcode({
                force: true,
                inviteCode: wechatInviteForm.state.values.inviteCode,
              })
            }
            disabled={getWechatQrcode.isPending || wechatCooldownSeconds > 0}
            className="mt-4 text-sm text-[#07C160] transition hover:text-[#41d88b] disabled:cursor-not-allowed disabled:text-[var(--auth-text-soft)]"
          >
            {wechatCooldownSeconds > 0 ? `${wechatCooldownSeconds}s 后可重试` : '刷新二维码'}
          </Button>
        </div>
      ) : null}

      {mode === 'phone' ? (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            void smsForm.handleSubmit()
          }}
        >
          <smsForm.Field name="phone" validators={{ onChange: smsCodeSchema.shape.phone }}>
            {(field) => (
              <label className="auth-label block text-sm font-semibold">
                手机号
                <Input
                  className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
                  placeholder="请输入手机号"
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
          </smsForm.Field>

          <smsForm.Field name="code" validators={{ onChange: smsCodeSchema.shape.code }}>
            {(field) => (
              <label className="auth-label block text-sm font-semibold">
                验证码
                <div className="mt-2 flex gap-3">
                  <Input
                    className="auth-input flex-1 rounded-2xl px-4 py-3 text-center font-mono tracking-[0.3em]"
                    placeholder="000000"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={() => void onSendSmsCode()}
                    variant="outline"
                    disabled={smsCountdown > 0 || sendSmsCode.isPending}
                    className="auth-secondary-button h-auto rounded-2xl px-4 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sendSmsCode.isPending
                      ? '发送中'
                      : smsCountdown > 0
                        ? `${smsCountdown}s`
                        : '发送'}
                  </Button>
                </div>
                {field.state.meta.isTouched ? (
                  <span className="mt-2 block text-sm text-rose-300">
                    {getFirstFieldError(field.state.meta.errors)}
                  </span>
                ) : null}
              </label>
            )}
          </smsForm.Field>

          <smsForm.Field name="invite_code">
            {(field) => (
              <label className="auth-label block text-sm font-semibold">
                邀请码
                <Input
                  className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
                  placeholder="有邀请码可额外获得铃铛"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          </smsForm.Field>

          <Button
            type="submit"
            variant="ghost"
            disabled={smsLogin.isPending}
            className="auth-submit inline-flex h-auto w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          >
            {smsLogin.isPending ? '登录中...' : '登录'}
          </Button>
        </form>
      ) : null}

      {(mode === 'password' || mode === 'code') ? (
        <>
          <div className="mb-4 flex gap-2 text-xs">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode('password')}
              className={`rounded-lg px-3 py-1.5 transition ${
                mode === 'password' ? 'auth-segment-button is-active' : 'auth-segment-button'
              }`}
            >
              密码登录
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode('code')}
              className={`rounded-lg px-3 py-1.5 transition ${
                mode === 'code' ? 'auth-segment-button is-active' : 'auth-segment-button'
              }`}
            >
              邮箱验证码
            </Button>
          </div>

          {mode === 'password' ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void passwordForm.handleSubmit()
              }}
            >
              <passwordForm.Field name="username" validators={{ onChange: loginSchema.shape.username }}>
                {(field) => (
                  <label className="auth-label block text-sm font-semibold">
                    邮箱/用户名
                    <Input
                      className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
                      placeholder="请输入用户名或邮箱"
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
              </passwordForm.Field>

              <passwordForm.Field name="password" validators={{ onChange: loginSchema.shape.password }}>
                {(field) => (
                  <label className="auth-label block text-sm font-semibold">
                    密码
                    <Input
                      type="password"
                      className="auth-input mt-2 w-full rounded-2xl px-4 py-3"
                      placeholder="请输入密码"
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
              </passwordForm.Field>

              <Button
                type="submit"
                variant="ghost"
                disabled={passwordLogin.isPending}
                className="auth-submit inline-flex h-auto w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                {passwordLogin.isPending ? '登录中...' : '登录'}
              </Button>
            </form>
          ) : null}

          {mode === 'code' ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void codeForm.handleSubmit()
              }}
            >
              <codeForm.Field name="email" validators={{ onChange: emailCodeLoginSchema.shape.email }}>
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
              </codeForm.Field>

              <codeForm.Field name="code" validators={{ onChange: emailCodeLoginSchema.shape.code }}>
                {(field) => (
                  <label className="auth-label block text-sm font-semibold">
                    验证码
                    <div className="mt-2 flex gap-3">
                      <Input
                        className="auth-input flex-1 rounded-2xl px-4 py-3 text-center font-mono tracking-[0.3em]"
                        placeholder="000000"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={() => void onSendEmailCode()}
                        variant="outline"
                        disabled={emailCountdown > 0 || sendEmailCode.isPending}
                        className="auth-secondary-button h-auto rounded-2xl px-4 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {sendEmailCode.isPending
                          ? '发送中'
                          : emailCountdown > 0
                            ? `${emailCountdown}s`
                            : '发送'}
                      </Button>
                    </div>
                    {field.state.meta.isTouched ? (
                      <span className="mt-2 block text-sm text-rose-300">
                        {getFirstFieldError(field.state.meta.errors)}
                      </span>
                    ) : null}
                  </label>
                )}
              </codeForm.Field>

              <Button
                type="submit"
                variant="ghost"
                disabled={emailCodeLogin.isPending}
                className="auth-submit inline-flex h-auto w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                {emailCodeLogin.isPending ? '登录中...' : '登录'}
              </Button>
            </form>
          ) : null}
        </>
      ) : null}

      <div className="mt-6 flex items-center gap-3">
        <Separator className="auth-separator-line flex-1" />
        <span className="auth-separator-text text-xs">其他方式</span>
        <Separator className="auth-separator-line flex-1" />
      </div>

      <Button
        type="button"
        onClick={() => void onLinuxDoLogin()}
        variant="outline"
        className="auth-secondary-button mt-5 inline-flex h-auto w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition"
      >
        <UserRound className="h-4 w-4" />
        使用 Linux Do 登录
      </Button>

      <p className="auth-copy mt-6 text-sm">
        还没有账号？{' '}
        <Link
          to="/register"
          search={
            normalizedRedirectTo !== '/'
              ? { redirect: normalizedRedirectTo }
              : undefined
          }
        >
          立即注册
        </Link>
      </p>
    </section>
  )
}
