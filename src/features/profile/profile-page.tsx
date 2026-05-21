import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Copy,
  Crown,
  KeyRound,
  Link2,
  LoaderCircle,
  LogOut,
  Mail,
  Phone,
  QrCode,
  Shield,
  Sparkles,
  UserRound,
  Wallet,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { toast } from '../../components/ui/sonner'
import { clearAuth, getAccessToken, getRefreshToken, persistAuth } from '../../lib/auth'
import type { SendSmsCodeInput, UserProfile } from '../../lib/auth-types'
import { profileQueryKey } from '../auth/query-keys'
import { useLogout, useProfile } from '../auth/use-profile'
import {
  bindPhone,
  changePassword,
  checkWechatBindStatus,
  getQuotaLogs,
  getQuotaSummary,
  getWechatBindQrcode,
  resetPasswordByPhone,
  sendSmsCode,
  toProfileNoticeUser,
  unbindPhone,
  unbindWechat,
  updateProfile,
  uploadAvatarFileToTos,
  type QuotaLog,
} from './profile-api'

type PasswordMode = 'sms' | 'set' | 'old'

const PAGE_SIZE = 10
const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="32" fill="%23e7ecf8"/><circle cx="64" cy="48" r="22" fill="%2392a2c8"/><path d="M30 104c6-18 21-28 34-28s28 10 34 28" fill="%2392a2c8"/></svg>'

function getMembershipTitle(level?: string | null) {
  return (
    {
      spark: '火花 Spark',
      flame: '火焰 Flame',
      blaze: '烈焰 Blaze',
      nova: '新星 Nova',
      cosmos: '宇宙 Cosmos',
      blackhole: '黑洞 Blackhole',
    }[level ?? ''] || '创作者'
  )
}

function getStatusText(status?: string) {
  return (
    {
      active: '正常',
      inactive: '非活跃',
      banned: '已封禁',
    }[status ?? ''] || status || '未知'
  )
}

function formatDate(value?: string | null) {
  if (!value) return '未知'
  return new Intl.DateTimeFormat('zh-CN').format(new Date(value))
}

function formatDateTime(value?: string | null) {
  if (!value) return '未知'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getMembershipExpireText(expiredAt?: string | null) {
  if (!expiredAt) return '永久有效'
  const target = new Date(expiredAt)
  const now = new Date()
  if (target.getTime() < now.getTime()) return '已过期'
  const days = Math.ceil((target.getTime() - now.getTime()) / 86400000)
  return `${days} 天后到期`
}

function maskPhone(phone?: string | null) {
  if (!phone) return '未绑定'
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

function getDisplayEmail(profile?: UserProfile) {
  if (!profile?.email) return '未绑定'
  if (profile.email.endsWith('@wechat.temp')) return '微信账号临时邮箱'
  if (profile.email.endsWith('@sms.temp')) return '手机号账号临时邮箱'
  return profile.email
}

function getActionTypeLabel(actionType: string) {
  return (
    {
      chat: 'AI 对话',
      llm_call: '模型调用',
      storyboard: '分镜生成',
      image: '图片生成',
      video: '视频生成',
      recharge: '充值到账',
      refund: '失败退回',
      register: '注册赠送',
      invite_bonus: '邀请奖励',
      activation_code: '激活码到账',
      sub_account_allocate: '子账号分配',
      sub_account_recall: '子账号回收',
    }[actionType] || actionType
  )
}

function useCountdown() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (seconds <= 0) return
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds])

  return [seconds, setSeconds] as const
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="profile-info-row">
      <span className="profile-info-key">{label}</span>
      <div className="profile-info-value">{value}</div>
    </div>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const profileQuery = useProfile()
  const logout = useLogout()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showBindPhoneDialog, setShowBindPhoneDialog] = useState(false)
  const [showBindWechatDialog, setShowBindWechatDialog] = useState(false)
  const [passwordMode, setPasswordMode] = useState<PasswordMode>('old')
  const [profileForm, setProfileForm] = useState({ nickname: '', avatar_url: '' })
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    smsCode: '',
  })
  const [bindPhoneForm, setBindPhoneForm] = useState({ phone: '', code: '' })
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [bindPhoneError, setBindPhoneError] = useState('')
  const [wechatBindError, setWechatBindError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [wechatSceneId, setWechatSceneId] = useState('')
  const [wechatQrcodeUrl, setWechatQrcodeUrl] = useState('')
  const [wechatBindStatusText, setWechatBindStatusText] = useState('请使用微信扫码绑定账号')
  const [pwdSmsCountdown, setPwdSmsCountdown] = useCountdown()
  const [bindSmsCountdown, setBindSmsCountdown] = useCountdown()

  const profile = profileQuery.data

  const quotaSummaryQuery = useQuery({
    queryKey: ['profile', 'quota-summary'],
    enabled: Boolean(profile),
    queryFn: getQuotaSummary,
  })

  const quotaLogsQuery = useQuery({
    queryKey: ['profile', 'quota-logs', currentPage],
    enabled: Boolean(profile),
    queryFn: () => getQuotaLogs(currentPage, PAGE_SIZE),
    placeholderData: (previous) => previous,
  })

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (data) => {
      persistAuth(data)
      await queryClient.invalidateQueries({ queryKey: profileQueryKey })
      setShowEditProfile(false)
      toast.success('资料已更新')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: async () => {
      clearAuth()
      await queryClient.removeQueries({ queryKey: profileQueryKey })
      toast.success('密码修改成功，请重新登录')
      await navigate({ to: '/login' })
    },
  })

  const resetPasswordByPhoneMutation = useMutation({
    mutationFn: resetPasswordByPhone,
    onSuccess: async () => {
      clearAuth()
      await queryClient.removeQueries({ queryKey: profileQueryKey })
      toast.success('密码修改成功，请重新登录')
      await navigate({ to: '/login' })
    },
  })

  const bindPhoneMutation = useMutation({
    mutationFn: bindPhone,
    onSuccess: async (data) => {
      const user = toProfileNoticeUser(data)
      const accessToken = getAccessToken()
      if (accessToken) {
        persistAuth({
          access_token: accessToken,
          refresh_token: getRefreshToken(),
          user,
        })
      }
      queryClient.setQueryData(profileQueryKey, user)
      await queryClient.invalidateQueries({ queryKey: profileQueryKey })
      setShowBindPhoneDialog(false)
      setBindPhoneForm({ phone: '', code: '' })
      toast.success('手机号绑定成功')
    },
  })

  const unbindPhoneMutation = useMutation({
    mutationFn: unbindPhone,
    onSuccess: async (data) => {
      const user = toProfileNoticeUser(data)
      const accessToken = getAccessToken()
      if (accessToken) {
        persistAuth({
          access_token: accessToken,
          refresh_token: getRefreshToken(),
          user,
        })
      }
      queryClient.setQueryData(profileQueryKey, user)
      await queryClient.invalidateQueries({ queryKey: profileQueryKey })
      toast.success('手机号已解绑')
    },
  })

  const unbindWechatMutation = useMutation({
    mutationFn: unbindWechat,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileQueryKey })
      toast.success('微信已解绑')
    },
  })

  const sendSmsMutation = useMutation({
    mutationFn: sendSmsCode,
  })

  const getWechatBindQrcodeMutation = useMutation({
    mutationFn: getWechatBindQrcode,
    onSuccess: (data) => {
      setWechatSceneId(data.scene_id)
      setWechatQrcodeUrl(data.qrcode_url)
      setWechatBindStatusText('请使用微信扫描二维码完成绑定')
      setWechatBindError('')
    },
  })

  const hasPhone = Boolean(profile?.phone)
  const hasPassword = Boolean(profile?.has_password)
  const remainingQuota = Number(profile?.remaining_quota || 0)
  const usedQuota = Number(profile?.used_quota || 0)
  const totalQuota = remainingQuota + usedQuota
  const quotaPercentage = totalQuota > 0 ? Math.round((usedQuota / totalQuota) * 100) : 0
  const quotaLogs = quotaLogsQuery.data?.items ?? []
  const totalLogs = quotaLogsQuery.data?.total ?? 0

  const membershipTone = useMemo(() => {
    switch (profile?.membership_level) {
      case 'spark':
        return 'profile-membership-spark'
      case 'cosmos':
      case 'blackhole':
        return 'profile-membership-cosmos'
      default:
        return 'profile-membership-plus'
    }
  }, [profile?.membership_level])

  useEffect(() => {
    if (!showEditProfile || !profile) return
    setProfileForm({
      nickname: profile.nickname || '',
      avatar_url: profile.avatar_url || '',
    })
    setProfileError('')
  }, [showEditProfile, profile])

  useEffect(() => {
    if (!showBindWechatDialog || !wechatSceneId) return

    let cancelled = false
    const timer = window.setInterval(async () => {
      try {
        const data = await checkWechatBindStatus(wechatSceneId)
        if (cancelled) return

        if (data.status === 'confirmed') {
          if (data.user) {
            const accessToken = getAccessToken()
            if (accessToken) {
              persistAuth({
                access_token: accessToken,
                refresh_token: getRefreshToken(),
                user: data.user,
              })
            }
          }
          await queryClient.invalidateQueries({ queryKey: profileQueryKey })
          toast.success('微信绑定成功')
          setShowBindWechatDialog(false)
          window.clearInterval(timer)
          return
        }

        if (data.status === 'scanned') {
          setWechatBindStatusText('扫码成功，等待微信确认...')
        }

        if (data.status === 'expired') {
          setWechatBindStatusText('二维码已过期，请重新获取')
          window.clearInterval(timer)
        }
      } catch (error) {
        if (cancelled) return
        setWechatBindError(error instanceof Error ? error.message : '获取微信绑定状态失败')
        window.clearInterval(timer)
      }
    }, 2000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [queryClient, showBindWechatDialog, wechatSceneId])

  if (!profileQuery.isPending && !profile) {
    return (
      <main className="page-wrap px-4 py-12">
        <section className="island-shell rounded-[2rem] px-6 py-10 sm:px-8">
          <p className="island-kicker mb-3">Profile</p>
          <h1 className="display-title mb-3 text-4xl font-semibold text-[var(--sea-ink)] sm:text-5xl">
            需要先登录
          </h1>
          <p className="m-0 max-w-2xl text-base leading-8 text-[var(--sea-ink-soft)]">
            登录后可以查看个人资料、积分消耗和账号绑定状态。
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild className="rounded-full">
              <Link to="/login">去登录</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/">返回首页</Link>
            </Button>
          </div>
        </section>
      </main>
    )
  }

  if (profileQuery.isPending || !profile) {
    return (
      <main className="page-wrap px-4 py-12">
        <section className="island-shell rounded-[2rem] px-6 py-10 sm:px-8">
          <p className="text-sm text-[var(--sea-ink-soft)]">正在加载个人信息...</p>
        </section>
      </main>
    )
  }

  async function handleCopyUserId() {
    try {
      await navigator.clipboard.writeText(String(profile.id))
      toast.success('用户 ID 已复制')
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  async function handleLogout() {
    const confirmed = window.confirm('确定要退出登录吗？')
    if (!confirmed) return
    logout()
    await navigate({ to: '/' })
  }

  function openPasswordDialog() {
    setPasswordError('')
    setPasswordForm({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      smsCode: '',
    })
    if (hasPhone) {
      setPasswordMode('sms')
    } else if (!hasPassword) {
      setPasswordMode('set')
    } else {
      setPasswordMode('old')
    }
    setShowPasswordDialog(true)
  }

  async function handleSendPasswordCode() {
    if (!profile.phone) return
    setPasswordError('')
    try {
      await sendSmsMutation.mutateAsync({
        phone: profile.phone,
        purpose: 'reset_password',
      } satisfies SendSmsCodeInput)
      setPwdSmsCountdown(60)
      toast.success('验证码已发送')
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : '发送失败，请稍后重试')
    }
  }

  async function handleSubmitPassword() {
    setPasswordError('')

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('新密码长度至少 6 位')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('两次输入的新密码不一致')
      return
    }

    try {
      if (passwordMode === 'sms') {
        await resetPasswordByPhoneMutation.mutateAsync({
          phone: profile.phone || '',
          code: passwordForm.smsCode.trim(),
          new_password: passwordForm.newPassword,
        })
        return
      }

      await changePasswordMutation.mutateAsync({
        old_password: passwordMode === 'old' ? passwordForm.oldPassword : '',
        new_password: passwordForm.newPassword,
      })
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : '密码修改失败')
    }
  }

  async function handleSendBindCode() {
    setBindPhoneError('')
    if (!/^1[3-9]\d{9}$/.test(bindPhoneForm.phone.trim())) {
      setBindPhoneError('请输入正确的手机号')
      return
    }

    try {
      await sendSmsMutation.mutateAsync({
        phone: bindPhoneForm.phone.trim(),
        purpose: 'sms_login',
      } satisfies SendSmsCodeInput)
      setBindSmsCountdown(60)
      toast.success('验证码已发送')
    } catch (error) {
      setBindPhoneError(error instanceof Error ? error.message : '发送失败，请稍后重试')
    }
  }

  async function handleSubmitBindPhone() {
    setBindPhoneError('')
    if (!/^1[3-9]\d{9}$/.test(bindPhoneForm.phone.trim())) {
      setBindPhoneError('请输入正确的手机号')
      return
    }
    if (!/^\d{4,6}$/.test(bindPhoneForm.code.trim())) {
      setBindPhoneError('请输入正确的验证码')
      return
    }

    try {
      await bindPhoneMutation.mutateAsync({
        phone: bindPhoneForm.phone.trim(),
        code: bindPhoneForm.code.trim(),
      })
    } catch (error) {
      setBindPhoneError(error instanceof Error ? error.message : '绑定失败，请稍后重试')
    }
  }

  async function handleSubmitProfile() {
    setProfileError('')
    try {
      await updateProfileMutation.mutateAsync({
        nickname: profileForm.nickname.trim() || null,
        avatar_url: profileForm.avatar_url.trim() || null,
      })
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : '资料更新失败')
    }
  }

  async function handleSelectAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setProfileError('')
    setAvatarUploading(true)

    try {
      const result = await uploadAvatarFileToTos(file)
      setProfileForm((current) => ({ ...current, avatar_url: result.url }))
      toast.success('头像上传成功')
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : '头像上传失败')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
    }
  }

  async function handleStartWechatBind() {
    setWechatBindError('')
    setWechatBindStatusText('正在生成绑定二维码...')
    try {
      await getWechatBindQrcodeMutation.mutateAsync()
      setShowBindWechatDialog(true)
    } catch (error) {
      setWechatBindError(error instanceof Error ? error.message : '获取二维码失败')
      setShowBindWechatDialog(true)
    }
  }

  const hasRealMembership = profile.membership_level && profile.membership_level !== 'spark'

  return (
      <main className="profile-page pb-16 pt-8">
      <div className="page-wrap px-4 sm:px-0">
        <section className="profile-hero island-shell relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-10 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(125,155,255,0.22),transparent_68%)] blur-2xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(126,211,191,0.22),transparent_68%)] blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="profile-avatar-ring">
                <div className="profile-avatar-core">
                  <img
                    src={profile.avatar_url || DEFAULT_AVATAR}
                    alt={profile.nickname || profile.username}
                    className="h-full w-full object-cover"
                  />
                </div>
                {hasRealMembership ? (
                  <div className="profile-vip-mark">
                    <Crown className="h-3.5 w-3.5" />
                  </div>
                ) : null}
              </div>

              <div className="min-w-0">
                <p className="island-kicker mb-2">My Profile</p>
                <h1 className="display-title mb-2 truncate text-4xl font-semibold tracking-[-0.04em] text-[var(--sea-ink)] sm:text-5xl">
                  {profile.nickname || profile.username}
                </h1>
                <p className="m-0 text-sm text-[var(--sea-ink-soft)]">@{profile.username}</p>
                <div className={`profile-membership mt-4 ${membershipTone}`}>
                  <Sparkles className="h-4 w-4" />
                  <span>{getMembershipTitle(profile.membership_level)}</span>
                  <span className="profile-membership-divider" />
                  <span>{getMembershipExpireText(profile.membership_expired_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditProfile(true)}
                className="rounded-full"
              >
                <Camera className="h-4 w-4" />
                编辑资料
              </Button>
              <Button asChild className="rounded-full">
                <Link to="/sora2-workflow">
                  <Wallet className="h-4 w-4" />
                  {profile.membership_level === 'spark' ? '升级会员' : '充值铃铛'}
                </Link>
              </Button>
              <Button type="button" variant="outline" onClick={openPasswordDialog} className="rounded-full">
                <KeyRound className="h-4 w-4" />
                {hasPhone ? '设置密码' : '修改密码'}
              </Button>
              <Button type="button" variant="outline" onClick={handleLogout} className="rounded-full">
                <LogOut className="h-4 w-4" />
                退出登录
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="feature-card rounded-[1.5rem] border-[var(--line)] py-0">
            <CardHeader className="border-b border-[var(--line)] py-6">
              <CardTitle className="flex items-center gap-2 text-lg text-[var(--sea-ink)]">
                <Wallet className="h-5 w-5 text-[var(--lagoon-deep)]" />
                铃铛配额
              </CardTitle>
              <CardDescription>统一对齐参考项目的剩余、已使用与即将过期信息。</CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <p className="m-0 text-sm text-[var(--sea-ink-soft)]">剩余铃铛</p>
                  <p className="m-0 mt-2 text-4xl font-semibold tracking-[-0.04em] text-[var(--sea-ink)]">
                    {remainingQuota.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="m-0 text-sm text-[var(--sea-ink-soft)]">已使用</p>
                  <p className="m-0 mt-2 text-2xl font-semibold text-[var(--sea-ink)]">
                    {usedQuota.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="m-0 text-sm text-[var(--sea-ink-soft)]">7 天内到期</p>
                  <p className="m-0 mt-2 text-2xl font-semibold text-[var(--sea-ink)]">
                    {Number(quotaSummaryQuery.data?.soon_expire_quota || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <div className="profile-progress-track">
                  <div className="profile-progress-fill" style={{ width: `${Math.min(quotaPercentage, 100)}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[var(--sea-ink-soft)]">
                  <span>累计使用占比</span>
                  <span>{quotaPercentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="feature-card rounded-[1.5rem] border-[var(--line)] py-0">
            <CardHeader className="border-b border-[var(--line)] py-6">
              <CardTitle className="flex items-center gap-2 text-lg text-[var(--sea-ink)]">
                <UserRound className="h-5 w-5 text-[var(--lagoon-deep)]" />
                账户信息
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <InfoRow label="用户名" value={<span className="profile-mono">{profile.username}</span>} />
              <InfoRow label="邮箱" value={getDisplayEmail(profile)} />
              <InfoRow
                label="用户 ID"
                value={
                  <button type="button" onClick={handleCopyUserId} className="profile-copy-button">
                    <span className="profile-mono">{profile.id}</span>
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                }
              />
              <InfoRow
                label="账户状态"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span className={`profile-status-dot profile-status-${profile.status || 'unknown'}`} />
                    {getStatusText(profile.status)}
                  </span>
                }
              />
              <InfoRow label="注册时间" value={formatDate(profile.created_at)} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="feature-card rounded-[1.5rem] border-[var(--line)] py-0">
            <CardHeader className="border-b border-[var(--line)] py-6">
              <CardTitle className="flex items-center gap-2 text-lg text-[var(--sea-ink)]">
                <Link2 className="h-5 w-5 text-[var(--lagoon-deep)]" />
                账号绑定
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <InfoRow
                label="手机号"
                value={
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span>{profile.has_bindphone ? maskPhone(profile.phone) : '未绑定'}</span>
                    {profile.has_bindphone ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={unbindPhoneMutation.isPending}
                        onClick={async () => {
                          if (!window.confirm('确定要解绑手机号吗？')) return
                          try {
                            await unbindPhoneMutation.mutateAsync()
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : '解绑失败')
                          }
                        }}
                        className="rounded-full"
                      >
                        {unbindPhoneMutation.isPending ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Phone className="h-3.5 w-3.5" />
                        )}
                        解绑
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setBindPhoneError('')
                          setBindPhoneForm({ phone: '', code: '' })
                          setShowBindPhoneDialog(true)
                        }}
                        className="rounded-full"
                      >
                        绑定
                      </Button>
                    )}
                  </div>
                }
              />
              <InfoRow
                label="微信"
                value={
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span>{profile.has_bindwechat ? '已绑定' : '未绑定'}</span>
                    {profile.has_bindwechat ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={unbindWechatMutation.isPending}
                        onClick={async () => {
                          if (!window.confirm('确定要解绑微信吗？')) return
                          try {
                            await unbindWechatMutation.mutateAsync()
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : '解绑失败')
                          }
                        }}
                        className="rounded-full"
                      >
                        {unbindWechatMutation.isPending ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Shield className="h-3.5 w-3.5" />
                        )}
                        解绑
                      </Button>
                    ) : (
                      <Button type="button" size="sm" onClick={() => void handleStartWechatBind()} className="rounded-full">
                        绑定
                      </Button>
                    )}
                  </div>
                }
              />
            </CardContent>
          </Card>

          <Card className="feature-card rounded-[1.5rem] border-[var(--line)] py-0">
            <CardHeader className="border-b border-[var(--line)] py-6">
              <CardTitle className="flex items-center gap-2 text-lg text-[var(--sea-ink)]">
                <Wallet className="h-5 w-5 text-[var(--lagoon-deep)]" />
                消费记录
              </CardTitle>
              <CardDescription>展示你最近的铃铛消耗与回退明细。</CardDescription>
            </CardHeader>
            <CardContent className="py-5">
              {quotaLogsQuery.isPending ? (
                <div className="flex items-center gap-3 py-8 text-sm text-[var(--sea-ink-soft)]">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  正在加载消费记录...
                </div>
              ) : quotaLogsQuery.isError ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-sm text-rose-600">
                  <AlertCircle className="h-4 w-4" />
                  {quotaLogsQuery.error instanceof Error ? quotaLogsQuery.error.message : '获取记录失败'}
                </div>
              ) : quotaLogs.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {quotaLogs.map((log: QuotaLog) => (
                      <div key={log.id} className="profile-log-item">
                        <div className={`profile-log-icon ${log.amount > 0 ? 'profile-log-expense' : 'profile-log-income'}`}>
                          {log.amount > 0 ? (
                            <Wallet className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-sm font-medium text-[var(--sea-ink)]">
                            {getActionTypeLabel(log.action_type)}
                          </p>
                          <p className="mt-1 truncate text-xs text-[var(--sea-ink-soft)]">
                            {log.description || '无描述'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`m-0 text-sm font-semibold ${log.amount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {log.amount > 0 ? '-' : '+'}
                            {Math.abs(log.amount)}
                          </p>
                          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                            余额 {log.balance_after} · {formatDateTime(log.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalLogs > PAGE_SIZE ? (
                    <div className="mt-5 flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        className="rounded-full"
                      >
                        上一页
                      </Button>
                      <span className="text-xs text-[var(--sea-ink-soft)]">
                        第 {currentPage} / {Math.max(1, Math.ceil(totalLogs / PAGE_SIZE))} 页
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= Math.ceil(totalLogs / PAGE_SIZE)}
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(Math.ceil(totalLogs / PAGE_SIZE), page + 1),
                          )
                        }
                        className="rounded-full"
                      >
                        下一页
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--sea-ink-soft)]">
                  暂无消费记录
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => void handleSelectAvatar(event)}
      />

      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="app-modal max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑资料</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {profileError ? <p className="profile-inline-error">{profileError}</p> : null}
            <div className="flex flex-col items-center gap-4">
              <div className="profile-avatar-preview">
                <img
                  src={profileForm.avatar_url || profile.avatar_url || DEFAULT_AVATAR}
                  alt="头像预览"
                  className="h-full w-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading || updateProfileMutation.isPending}
                className="rounded-full"
              >
                {avatarUploading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    更换头像
                  </>
                )}
              </Button>
              <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                支持 JPG、PNG、WebP、GIF，建议使用方形头像
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--sea-ink)]">昵称</label>
              <Input
                value={profileForm.nickname}
                maxLength={50}
                placeholder="输入昵称（可选）"
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, nickname: event.target.value }))
                }
                className="auth-input"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditProfile(false)}
                className="flex-1 rounded-full"
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={() => void handleSubmitProfile()}
                disabled={avatarUploading || updateProfileMutation.isPending}
                className="flex-1 rounded-full"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存资料'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="app-modal max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{passwordMode === 'set' ? '设置密码' : '修改密码'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {passwordError ? <p className="profile-inline-error">{passwordError}</p> : null}

            {passwordMode === 'old' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--sea-ink)]">当前密码</label>
                <Input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, oldPassword: event.target.value }))
                  }
                  className="auth-input"
                />
              </div>
            ) : null}

            {passwordMode === 'sms' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--sea-ink)]">短信验证码</label>
                <div className="flex gap-2">
                  <Input
                    value={passwordForm.smsCode}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, smsCode: event.target.value }))
                    }
                    placeholder="输入验证码"
                    className="auth-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pwdSmsCountdown > 0 || sendSmsMutation.isPending}
                    onClick={() => void handleSendPasswordCode()}
                    className="rounded-full"
                  >
                    {pwdSmsCountdown > 0 ? `${pwdSmsCountdown}s` : '发送验证码'}
                  </Button>
                </div>
                <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                  将发送到 {maskPhone(profile.phone)}
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--sea-ink)]">新密码</label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                }
                className="auth-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--sea-ink)]">确认新密码</label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                className="auth-input"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1 rounded-full"
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={() => void handleSubmitPassword()}
                disabled={changePasswordMutation.isPending || resetPasswordByPhoneMutation.isPending}
                className="flex-1 rounded-full"
              >
                {changePasswordMutation.isPending || resetPasswordByPhoneMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '确认修改'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBindPhoneDialog} onOpenChange={setShowBindPhoneDialog}>
        <DialogContent className="app-modal max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>绑定手机号</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {bindPhoneError ? <p className="profile-inline-error">{bindPhoneError}</p> : null}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--sea-ink)]">手机号</label>
              <Input
                value={bindPhoneForm.phone}
                placeholder="输入手机号"
                onChange={(event) =>
                  setBindPhoneForm((current) => ({ ...current, phone: event.target.value }))
                }
                className="auth-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--sea-ink)]">验证码</label>
              <div className="flex gap-2">
                <Input
                  value={bindPhoneForm.code}
                  placeholder="输入验证码"
                  onChange={(event) =>
                    setBindPhoneForm((current) => ({ ...current, code: event.target.value }))
                  }
                  className="auth-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={bindSmsCountdown > 0 || sendSmsMutation.isPending}
                  onClick={() => void handleSendBindCode()}
                  className="rounded-full"
                >
                  {bindSmsCountdown > 0 ? `${bindSmsCountdown}s` : '发送验证码'}
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBindPhoneDialog(false)}
                className="flex-1 rounded-full"
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={() => void handleSubmitBindPhone()}
                disabled={bindPhoneMutation.isPending}
                className="flex-1 rounded-full"
              >
                {bindPhoneMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    绑定中...
                  </>
                ) : (
                  '确认绑定'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBindWechatDialog} onOpenChange={setShowBindWechatDialog}>
        <DialogContent className="app-modal max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>绑定微信</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            {wechatBindError ? <p className="profile-inline-error text-left">{wechatBindError}</p> : null}
            {getWechatBindQrcodeMutation.isPending ? (
              <div className="flex flex-col items-center gap-3 py-8 text-sm text-[var(--sea-ink-soft)]">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                正在生成绑定二维码...
              </div>
            ) : wechatQrcodeUrl ? (
              <>
                <div className="mx-auto flex h-52 w-52 items-center justify-center overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-white p-3">
                  <img src={wechatQrcodeUrl} alt="微信绑定二维码" className="h-full w-full object-contain" />
                </div>
                <p className="m-0 text-sm text-[var(--sea-ink)]">{wechatBindStatusText}</p>
                <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                  扫码后会自动轮询绑定结果，无需手动刷新
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-sm text-[var(--sea-ink-soft)]">
                <QrCode className="h-8 w-8 text-[var(--lagoon-deep)]" />
                暂未获取到二维码
              </div>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBindWechatDialog(false)}
                className="flex-1 rounded-full"
              >
                关闭
              </Button>
              <Button
                type="button"
                onClick={() => void handleStartWechatBind()}
                className="flex-1 rounded-full"
              >
                重新获取
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
