import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { startTransition } from 'react'
import { ApiError } from '../../lib/api'
import {
  createWorkflow,
  getHomeVideos,
  getRecentProjects,
  getStylePresets,
} from './home-api'

export const stylePresetsQueryKey = ['home', 'style-presets'] as const
export const homeVideosQueryKey = ['home', 'videos'] as const
export const recentProjectsQueryKey = ['home', 'recent-projects'] as const

export function useStylePresets() {
  return useQuery({
    queryKey: stylePresetsQueryKey,
    queryFn: getStylePresets,
    staleTime: 5 * 60 * 1000,
  })
}

export function useHomeVideos() {
  return useQuery({
    queryKey: homeVideosQueryKey,
    queryFn: getHomeVideos,
    staleTime: 60 * 1000,
  })
}

export function useRecentProjects(enabled: boolean) {
  return useQuery({
    queryKey: recentProjectsQueryKey,
    queryFn: getRecentProjects,
    enabled,
  })
}

export function useCreateWorkflow() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: recentProjectsQueryKey })
      startTransition(() => {
        navigate({
          to: '/sora2-workflow/$workflowId',
          params: { workflowId: String(data.id) },
        })
      })
    },
  })
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return '操作失败，请稍后再试。'
}
