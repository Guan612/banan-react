export type WorkflowNodeData = Record<string, unknown> & {
  label?: string
  title?: string
  content?: string
  prompt?: string
  text?: string
}

export type WorkflowNode = {
  id: string
  type?: string
  position?: {
    x?: number
    y?: number
  }
  data?: WorkflowNodeData
}

export type WorkflowEdge = {
  id: string
  source: string
  target: string
  type?: string
  label?: string
}

export type WorkflowViewport = {
  x: number
  y: number
  zoom: number
}

export type WorkflowCanvas = {
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
  viewport?: WorkflowViewport
  currentStyle?: string
  workflowMode?: string
  autoExtract?: boolean
  globalOrientation?: string
  globalImageAspectRatio?: string
  globalImageResolution?: string
  edgeType?: string
  [key: string]: unknown
}

export type WorkflowCanvasNodePatch = {
  id: string
  position?: {
    x: number
    y: number
  }
  data?: Record<string, unknown>
}

export type WorkflowCanvasBatchAction =
  | {
      action: 'update'
      updates: WorkflowCanvasNodePatch[]
    }
  | {
      action: 'updateViewport'
      viewport: WorkflowViewport
    }
  | {
      action: 'create' | 'createEdge'
      creates: Record<string, unknown>[]
    }
  | {
      action: 'delete' | 'deleteEdge'
      ids: string[]
    }

export type WorkflowCanvasBatchActionsInput = {
  actions: WorkflowCanvasBatchAction[]
  created_by_role?: string
}

export type WorkflowDetail = {
  id: number
  user_id: number
  name: string
  current_step: number
  novel_content?: string | null
  workflow_state?: Record<string, unknown> | null
  canvas_nodes?: WorkflowCanvas | null
  thumbnail?: string | null
  project_type: string
  collaboration_role: string
  collaboration_category: string
  is_sub_account_canvas: boolean
  can_manage_collaboration: boolean
  room_id?: string | null
  created_at: string
  updated_at: string
}

export type WorkflowSummary = {
  id: number
  user_id?: number
  name: string
  thumbnail?: string | null
  project_type: string
  collaboration_role: string
  collaboration_category: string
  is_sub_account_canvas: boolean
  can_manage_collaboration: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type WorkflowListResponse = {
  workflows: WorkflowSummary[]
}

export type WorkflowUpdateInput = {
  name?: string
  novel_content?: string | null
  current_step?: number
  canvas_nodes?: WorkflowCanvas
}

export type WorkflowCreateInput = {
  name?: string
  current_step?: number
  novel_content?: string | null
  canvas_nodes?: WorkflowCanvas
  project_type?: string
}
