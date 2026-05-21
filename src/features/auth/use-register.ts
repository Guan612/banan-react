import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { apiRequest, parseApiData } from '../../lib/api'
import { persistAuth } from '../../lib/auth'
import { authTokenResponseSchema } from '../../lib/auth-schema'
import type { AuthTokenResponse, RegisterInput } from '../../lib/auth-types'
import { profileQueryKey } from './query-keys'

export function useRegister() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const data = await apiRequest<unknown>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      })

      return parseApiData<AuthTokenResponse>(authTokenResponseSchema, data)
    },
    onSuccess: async (data) => {
      persistAuth(data)
      await queryClient.invalidateQueries({ queryKey: profileQueryKey })
      await navigate({ to: '/' })
    },
  })
}
