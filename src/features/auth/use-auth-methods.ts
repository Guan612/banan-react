import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { startTransition } from 'react'
import { apiRequest, parseApiData } from '../../lib/api'
import { getRefreshToken, persistAuth } from '../../lib/auth'
import {
  authTokenResponseSchema,
  emailCodeLoginSchema,
  linuxDoAuthorizeSchema,
  sendEmailCodeSchema,
  sendSmsCodeSchema,
  smsCodeSchema,
  wechatCheckSchema,
  wechatQrcodeSchema,
} from '../../lib/auth-schema'
import type {
  AuthTokenResponse,
  EmailCodeLoginInput,
  SendEmailCodeInput,
  SendSmsCodeInput,
  SmsCodeInput,
  WechatCheckResponse,
  WechatQrcode,
} from '../../lib/auth-types'
import { normalizeRedirectTarget } from './auth-redirect'
import { profileQueryKey } from './query-keys'

function useAuthSuccessHandler(redirectTo?: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return async (data: AuthTokenResponse) => {
    persistAuth(data)
    await queryClient.invalidateQueries({ queryKey: profileQueryKey })
    startTransition(() => {
      navigate({ to: normalizeRedirectTarget(redirectTo) })
    })
  }
}

export function useSendEmailCode() {
  return useMutation({
    mutationFn: async (input: SendEmailCodeInput) => {
      const payload = parseApiData(sendEmailCodeSchema, input)
      return apiRequest<unknown>('/api/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
  })
}

export function useEmailCodeLogin(redirectTo?: string) {
  const onSuccess = useAuthSuccessHandler(redirectTo)

  return useMutation({
    mutationFn: async (input: EmailCodeLoginInput) => {
      const payload = parseApiData(emailCodeLoginSchema, input)
      const data = await apiRequest<unknown>('/api/auth/login-with-code', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return parseApiData(authTokenResponseSchema, data)
    },
    onSuccess,
  })
}

export function useRegisterWithEmailVerification(redirectTo?: string) {
  const onSuccess = useAuthSuccessHandler(redirectTo)

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const data = await apiRequest<unknown>('/api/auth/register-with-email', {
        method: 'POST',
        body: JSON.stringify(input),
      })

      return parseApiData(authTokenResponseSchema, data)
    },
    onSuccess,
  })
}

export function useSendSmsCode() {
  return useMutation({
    mutationFn: async (input: SendSmsCodeInput) => {
      const payload = parseApiData(sendSmsCodeSchema, input)
      return apiRequest<unknown>('/api/auth/sms/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
  })
}

export function useSmsLogin(redirectTo?: string) {
  const onSuccess = useAuthSuccessHandler(redirectTo)

  return useMutation({
    mutationFn: async (input: SmsCodeInput) => {
      const payload = parseApiData(smsCodeSchema, input)
      const data = await apiRequest<unknown>('/api/auth/sms/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return parseApiData(authTokenResponseSchema, data)
    },
    onSuccess,
  })
}

export function useGetWechatQrcode() {
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const query = inviteCode.trim()
        ? `/api/oauth/wechat/qrcode?invite_code=${encodeURIComponent(inviteCode.trim())}`
        : '/api/oauth/wechat/qrcode'
      const data = await apiRequest<unknown>(query)

      return parseApiData<WechatQrcode>(wechatQrcodeSchema, data)
    },
  })
}

export async function checkWechatScanStatus(sceneId: string) {
  const data = await apiRequest<unknown>(
    `/api/oauth/wechat/check?scene_id=${encodeURIComponent(sceneId)}`,
  )

  return parseApiData<WechatCheckResponse>(wechatCheckSchema, data)
}

export async function getLinuxDoAuthorizeUrl() {
  const data = await apiRequest<unknown>('/api/oauth/linux-do/authorize-url')
  const parsed = parseApiData(linuxDoAuthorizeSchema, data)
  return parsed.url
}

export async function loginWithLinuxDoCallback(code: string) {
  const data = await apiRequest<unknown>('/api/oauth/linux-do/callback', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })

  return parseApiData(authTokenResponseSchema, data)
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        return null
      }

      return apiRequest<unknown>(
        '/api/auth/logout',
        {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
        { retryOnAuth: false },
      )
    },
  })
}
