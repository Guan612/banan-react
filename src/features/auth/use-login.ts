import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { apiRequest, parseApiData } from '../../lib/api'
import { persistAuth } from '../../lib/auth'
import { authTokenResponseSchema } from '../../lib/auth-schema'
import type { AuthTokenResponse, LoginInput } from '../../lib/auth-types'
import { normalizeRedirectTarget } from './auth-redirect'
import { profileQueryKey } from './query-keys'

export function useLogin(redirectTo?: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const data = await apiRequest<unknown>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      })

      return parseApiData<AuthTokenResponse>(authTokenResponseSchema, data)
    },
    onSuccess: async (data) => {
      persistAuth(data)
      await queryClient.invalidateQueries({ queryKey: profileQueryKey })
      await navigate({ to: normalizeRedirectTarget(redirectTo) })
    },
  })
}
