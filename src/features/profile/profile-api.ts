import { z } from 'zod'
import { apiRequest, parseApiData } from '../../lib/api'
import { authTokenResponseSchema, userProfileSchema } from '../../lib/auth-schema'
import type { AuthTokenResponse, SendSmsCodeInput, UserProfile } from '../../lib/auth-types'
import { directUploadImageFile } from '../../lib/direct-upload'

const quotaSummarySchema = z.object({
  total_quota: z.number(),
  soon_expire_quota: z.number(),
  records_count: z.number(),
})

const quotaLogSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  action_type: z.string(),
  amount: z.number(),
  balance_before: z.number(),
  balance_after: z.number(),
  description: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
  created_at: z.string(),
})

const paginatedQuotaLogsSchema = z.object({
  items: z.array(quotaLogSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
  pages: z.number(),
})

const profileUpdatePayloadSchema = z.object({
  nickname: z.string().trim().max(50).optional().nullable(),
  avatar_url: z.string().trim().max(500).optional().nullable(),
})

const changePasswordPayloadSchema = z.object({
  old_password: z.string(),
  new_password: z.string().min(6),
})

const resetPasswordByPhonePayloadSchema = z.object({
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/),
  code: z.string().trim().regex(/^\d{4,6}$/),
  new_password: z.string().min(6),
})

const bindPhonePayloadSchema = z.object({
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/),
  code: z.string().trim().regex(/^\d{4,6}$/),
})

const bindWechatQrcodeSchema = z.object({
  scene_id: z.string(),
  qrcode_url: z.string(),
  expire_seconds: z.number(),
})

const bindWechatCheckSchema = z.object({
  status: z.enum(['pending', 'scanned', 'confirmed', 'expired']),
  user: userProfileSchema.optional(),
})

export type QuotaSummary = z.infer<typeof quotaSummarySchema>
export type QuotaLog = z.infer<typeof quotaLogSchema>
export type PaginatedQuotaLogs = z.infer<typeof paginatedQuotaLogsSchema>
export type BindWechatQrcode = z.infer<typeof bindWechatQrcodeSchema>
export type BindWechatCheck = z.infer<typeof bindWechatCheckSchema>

export async function getQuotaSummary() {
  const data = await apiRequest<unknown>('/api/quota/summary')
  return parseApiData(quotaSummarySchema, data)
}

export async function getQuotaLogs(page: number, pageSize: number) {
  const skip = Math.max(0, (page - 1) * pageSize)
  const data = await apiRequest<unknown>(`/api/quota-logs?skip=${skip}&limit=${pageSize}`)
  return parseApiData(paginatedQuotaLogsSchema, data)
}

export async function updateProfile(payload: {
  nickname?: string | null
  avatar_url?: string | null
}) {
  const body = parseApiData(profileUpdatePayloadSchema, payload)
  const data = await apiRequest<unknown>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  })

  return parseApiData<AuthTokenResponse>(authTokenResponseSchema, data)
}

export async function uploadAvatarFileToTos(file: File) {
  const result = await directUploadImageFile(file, file.name)
  return { url: result.url }
}

export async function changePassword(payload: {
  old_password: string
  new_password: string
}) {
  const body = parseApiData(changePasswordPayloadSchema, payload)
  return apiRequest<unknown>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function resetPasswordByPhone(payload: {
  phone: string
  code: string
  new_password: string
}) {
  const body = parseApiData(resetPasswordByPhonePayloadSchema, payload)
  return apiRequest<unknown>('/api/auth/sms/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function sendSmsCode(input: SendSmsCodeInput) {
  return apiRequest<unknown>('/api/auth/sms/send', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function bindPhone(payload: { phone: string; code: string }) {
  const body = parseApiData(bindPhonePayloadSchema, payload)
  const data = await apiRequest<unknown>('/api/auth/sms/bindphone', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return parseApiData(
    z.object({
      user: userProfileSchema,
    }),
    data,
  )
}

export async function unbindPhone() {
  const data = await apiRequest<unknown>('/api/auth/sms/unbindphone', {
    method: 'POST',
  })

  return parseApiData(
    z.object({
      user: userProfileSchema,
    }),
    data,
  )
}

export async function getWechatBindQrcode() {
  const data = await apiRequest<unknown>('/api/oauth/wechat/bindqrcode')
  return parseApiData(bindWechatQrcodeSchema, data)
}

export async function checkWechatBindStatus(sceneId: string) {
  const data = await apiRequest<unknown>(
    `/api/oauth/wechat/bindcheck?scene_id=${encodeURIComponent(sceneId)}`,
  )
  return parseApiData(bindWechatCheckSchema, data)
}

export async function unbindWechat() {
  return apiRequest<unknown>('/api/oauth/wechat/unbind', {
    method: 'POST',
  })
}

export function toProfileNoticeUser(data: AuthTokenResponse | { user: UserProfile }) {
  return data.user
}
