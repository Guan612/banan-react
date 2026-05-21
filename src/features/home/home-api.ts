import { z } from 'zod'
import { apiRequest, parseApiData } from '../../lib/api'
import type { HomeVideo, StylePreset, WorkflowSummary } from './home-types'

const workflowPromptSchema = z.object({
  id: z.number().optional(),
  key: z.string(),
  name: z.string(),
  value: z.string(),
  description: z.string().nullable().optional(),
  img_url: z.string().nullable().optional(),
  prompt_type: z.string(),
  is_active: z.boolean(),
  sort_order: z.number().optional(),
})

const workflowSummarySchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().catch('未命名项目'),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

const recentProjectsResponseSchema = z.object({
  workflows: z.array(workflowSummarySchema).optional(),
})

const homeVideoSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  cover_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  sort_order: z.number().optional(),
  is_enabled: z.boolean().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

const createWorkflowResponseSchema = z.object({
  id: z.union([z.number(), z.string()]),
})

type CreateWorkflowInput = {
  story: string
  styleValue: string
}

const WORKFLOW_PROMPTS_CACHE_DURATION = 5 * 60 * 1000

let cachedWorkflowPrompts: Array<z.infer<typeof workflowPromptSchema>> | null = null
let workflowPromptsCacheTimestamp = 0
let pendingWorkflowPromptsRequest:
  | Promise<Array<z.infer<typeof workflowPromptSchema>>>
  | null = null

async function fetchWorkflowPrompts(forceRefresh = false) {
  const now = Date.now()

  if (
    !forceRefresh &&
    cachedWorkflowPrompts &&
    now - workflowPromptsCacheTimestamp < WORKFLOW_PROMPTS_CACHE_DURATION
  ) {
    return cachedWorkflowPrompts
  }

  if (pendingWorkflowPromptsRequest) {
    return pendingWorkflowPromptsRequest
  }

  pendingWorkflowPromptsRequest = (async () => {
    try {
      const data = await apiRequest<unknown>(
        '/api/workflow-prompts/public?platform=website',
      )
      const prompts = parseApiData(z.array(workflowPromptSchema), data)
      cachedWorkflowPrompts = prompts
      workflowPromptsCacheTimestamp = Date.now()
      return prompts
    } finally {
      pendingWorkflowPromptsRequest = null
    }
  })()

  return pendingWorkflowPromptsRequest
}

export async function getStylePresets() {
  try {
    const prompts = await fetchWorkflowPrompts()

    const presets = prompts
      .filter((prompt) => prompt.prompt_type === 'style' && prompt.is_active)
      .sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          a.name.localeCompare(b.name, 'zh-CN'),
      )
      .map((prompt) => ({
        key: prompt.key,
        label: prompt.name,
        value: prompt.value,
        description: prompt.description,
        img_url: prompt.img_url,
      }))

    return presets
  } catch {
    return []
  }
}

export function clearWorkflowPromptsCache() {
  cachedWorkflowPrompts = null
  workflowPromptsCacheTimestamp = 0
  pendingWorkflowPromptsRequest = null
}

export async function getRecentProjects() {
  const data = await apiRequest<unknown>(
    '/api/sora2-workflow?skip=0&limit=6',
  )
  const parsed = parseApiData(recentProjectsResponseSchema, data)

  return parsed.workflows ?? []
}

export async function getHomeVideos() {
  try {
    const data = await apiRequest<unknown>('/api/home-videos/public')
    return parseApiData(z.array(homeVideoSchema), data)
  } catch {
    return []
  }
}

export async function createWorkflow({ story, styleValue }: CreateWorkflowInput) {
  const data = await apiRequest<unknown>('/api/sora2-workflow', {
    method: 'POST',
    body: JSON.stringify({
      name: story.slice(0, 20) || '新建项目',
      current_step: 1,
      novel_content: story,
      canvas_nodes: {
        nodes: [
          {
            id: 'novel-1',
            type: 'novelInput',
            position: { x: 100, y: 200 },
            data: { content: story },
          },
          {
            id: 'extract-1',
            type: 'characterExtract',
            position: { x: 500, y: 200 },
            data: {
              extracting: false,
              characters: [],
              scenes: [],
              items: [],
              hasInput: true,
            },
          },
        ],
        edges: [
          {
            id: 'novel-1-extract-1',
            source: 'novel-1',
            target: 'extract-1',
            type: 'smoothstep',
          },
        ],
        currentStyle: styleValue,
        workflowMode: 'image',
        autoExtract: true,
      },
    }),
  })

  return parseApiData(createWorkflowResponseSchema, data)
}
