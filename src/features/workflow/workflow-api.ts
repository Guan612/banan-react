import { z } from 'zod'
import { getAccessToken } from '../../lib/auth'
import { API_BASE_URL, apiRequest, parseApiData } from '../../lib/api'
import type {
  WorkflowCanvasBatchActionsInput,
  WorkflowCreateInput,
  WorkflowDetail,
  WorkflowListResponse,
  WorkflowUpdateInput,
} from './workflow-types'

const workflowSummarySchema = z.object({
  id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  user_id: z
    .union([z.number(), z.string()])
    .transform((value) => Number(value))
    .optional(),
  name: z.string().catch('未命名项目'),
  thumbnail: z.string().nullable().optional(),
  project_type: z.string().catch('canvas2'),
  collaboration_role: z.string().catch('owner'),
  collaboration_category: z.string().catch('my_canvas'),
  is_sub_account_canvas: z.boolean().catch(false),
  can_manage_collaboration: z.boolean().catch(false),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

const workflowDetailSchema: z.ZodType<WorkflowDetail> = z.object({
  id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  user_id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  name: z.string().catch('未命名项目'),
  current_step: z.number().catch(1),
  novel_content: z.string().nullable().optional(),
  workflow_state: z.record(z.string(), z.unknown()).nullable().optional(),
  canvas_nodes: z.record(z.string(), z.unknown()).nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  project_type: z.string().catch('canvas2'),
  collaboration_role: z.string().catch('owner'),
  collaboration_category: z.string().catch('my_canvas'),
  is_sub_account_canvas: z.boolean().catch(false),
  can_manage_collaboration: z.boolean().catch(false),
  room_id: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

const workflowListResponseSchema: z.ZodType<WorkflowListResponse> = z.object({
  workflows: z.array(workflowSummarySchema).catch([]),
})

const workflowCreateResponseSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((value) => Number(value)),
})

const workflowBatchActionsResponseSchema = z.object({
  updated_count: z.number().catch(0),
})

export const workflowProjectsQueryKey = ['workflow', 'projects'] as const
export const workflowDetailQueryKey = (workflowId: string) =>
  ['workflow', workflowId] as const

export async function listWorkflows() {
  const data = await apiRequest<unknown>(
    '/api/sora2-workflow?limit=100&project_type=canvas2',
  )

  return parseApiData(workflowListResponseSchema, data)
}

export async function createWorkflow(input: WorkflowCreateInput) {
  const data = await apiRequest<unknown>('/api/sora2-workflow', {
    method: 'POST',
    body: JSON.stringify({
      project_type: 'canvas2',
      ...input,
    }),
  })

  return parseApiData(workflowCreateResponseSchema, data)
}

export async function getWorkflowById(workflowId: string) {
  const data = await apiRequest<unknown>(`/api/sora2-workflow/${workflowId}`)
  return parseApiData(workflowDetailSchema, data)
}

export async function updateWorkflow(
  workflowId: string,
  input: WorkflowUpdateInput,
) {
  const data = await apiRequest<unknown>(`/api/sora2-workflow/${workflowId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })

  return parseApiData(workflowDetailSchema, data)
}

export async function updateWorkflowKeepalive(
  workflowId: string,
  input: WorkflowUpdateInput,
) {
  const token = getAccessToken()
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  await fetch(`${API_BASE_URL}/api/sora2-workflow/${workflowId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(input),
    keepalive: true,
  })
}

export async function applyWorkflowCanvasBatchActions(
  workflowId: string,
  input: WorkflowCanvasBatchActionsInput,
) {
  const data = await apiRequest<unknown>(
    `/api/sora2-workflow/${workflowId}/nodes:batchActions`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )

  return parseApiData(workflowBatchActionsResponseSchema, data)
}

export async function deleteWorkflow(workflowId: string) {
  await apiRequest<unknown>(`/api/sora2-workflow/${workflowId}`, {
    method: 'DELETE',
  })
}
