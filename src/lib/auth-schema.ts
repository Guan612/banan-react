import { z } from 'zod'

const emailDomainMessage = '仅支持 qq.com、163.com 邮箱'

function isAllowedEmailDomain(email: string) {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain === 'qq.com' || domain === '163.com'
}

export const userProfileSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  nickname: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  membership_level: z.string().nullable().optional(),
  membership_expired_at: z.string().nullable().optional(),
  remaining_quota: z.number().nullable().optional(),
  used_quota: z.number().nullable().optional(),
  free_quota: z.number().nullable().optional(),
  status: z.string().optional(),
  role: z.string().optional(),
  has_bindphone: z.boolean().optional(),
  has_bindwechat: z.boolean().optional(),
  has_password: z.boolean().optional(),
  created_at: z.string().nullable().optional(),
})

export const authTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().nullable().optional(),
  token_type: z.string().optional(),
  user: userProfileSchema.optional(),
})

export const loginSchema = z.object({
  username: z.string().trim().min(1, '请输入用户名或邮箱'),
  password: z.string().min(1, '请输入密码'),
})

export const emailCodeLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, '请输入邮箱地址')
    .email('请输入有效的邮箱地址')
    .refine(isAllowedEmailDomain, emailDomainMessage),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, '验证码应为 6 位数字'),
})

export const sendEmailCodeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, '请输入邮箱地址')
    .email('请输入有效的邮箱地址')
    .refine(isAllowedEmailDomain, emailDomainMessage),
  purpose: z.enum(['login', 'register', 'reset']).default('login'),
})

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, '用户名长度应为3-20个字符')
      .max(20, '用户名长度应为3-20个字符')
      .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
    email: z
      .string()
      .trim()
      .min(1, '请输入邮箱地址')
      .email('请输入有效的邮箱地址')
      .refine(isAllowedEmailDomain, emailDomainMessage),
    emailCode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, '验证码应为 6 位数字'),
    nickname: z
      .string()
      .trim()
      .max(50, '昵称长度不能超过50个字符')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, '密码至少需要6个字符'),
    confirmPassword: z.string().min(1, '请确认密码'),
    inviteCode: z.string().trim().max(20, '邀请码长度不能超过20个字符').optional().or(z.literal('')),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

export const smsCodeSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, '验证码应为 6 位数字'),
  invite_code: z.string().trim().max(20, '邀请码长度不能超过20个字符').optional().or(z.literal('')),
})

export const sendSmsCodeSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  purpose: z.enum(['sms_login', 'reset_password']).default('sms_login'),
})

export const wechatQrcodeSchema = z.object({
  scene_id: z.string(),
  qrcode_url: z.string(),
  expire_seconds: z.number(),
})

export const wechatCheckSchema = z.object({
  status: z.enum(['pending', 'scanned', 'confirmed', 'expired']),
  access_token: z.string().optional(),
  refresh_token: z.string().nullable().optional(),
  token_type: z.string().optional(),
  user: userProfileSchema.optional(),
})

export const linuxDoAuthorizeSchema = z.object({
  url: z.string(),
})

export type UserProfile = z.infer<typeof userProfileSchema>
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type EmailCodeLoginInput = z.infer<typeof emailCodeLoginSchema>
export type SendEmailCodeInput = z.infer<typeof sendEmailCodeSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type SmsCodeInput = z.infer<typeof smsCodeSchema>
export type SendSmsCodeInput = z.infer<typeof sendSmsCodeSchema>
export type WechatQrcode = z.infer<typeof wechatQrcodeSchema>
export type WechatCheckResponse = z.infer<typeof wechatCheckSchema>
