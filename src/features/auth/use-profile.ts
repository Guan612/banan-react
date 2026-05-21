import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest, parseApiData } from '../../lib/api'
import { clearAuth, getAccessToken } from '../../lib/auth'
import { userProfileSchema } from '../../lib/auth-schema'
import type { UserProfile } from '../../lib/auth-types'
import { profileQueryKey } from './query-keys'
import { useLogoutMutation } from './use-auth-methods'

export function useProfile() {
  const token = getAccessToken()
  const hasToken = Boolean(token)
  const query = useQuery({
    queryKey: profileQueryKey,
    enabled: hasToken,
    retry: false,
    queryFn: async () => {
      try {
        const data = await apiRequest<unknown>('/api/auth/profile')

        return parseApiData<UserProfile>(userProfileSchema, data)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearAuth()
        }

        throw error
      }
    },
  })

  if (!hasToken) {
    return {
      ...query,
      data: undefined,
      error: null,
      isError: false,
      isPending: false,
      isLoading: false,
      status: 'success' as const,
    }
  }

  return query
}

export function useLogout() {
  const queryClient = useQueryClient()
  const logoutMutation = useLogoutMutation()

  return () => {
    void logoutMutation.mutateAsync().catch(() => {})
    clearAuth()
    queryClient.removeQueries({ queryKey: profileQueryKey })
  }
}
