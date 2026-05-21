import type {
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  Viewport,
} from '@xyflow/react'
import type {
  WorkflowCanvas,
  WorkflowCanvasBatchActionsInput,
  WorkflowNode,
  WorkflowViewport,
} from './workflow-types'
import { serializeEdges, serializeNodes } from './workflow-canvas-utils'

const BASE64_IMAGE_DATA_URL_RE = /^data:image\/[^;,]+;base64,/i
const BASE64_VIDEO_DATA_URL_RE = /^data:video\/[^;,]+;base64,/i
const TRANSIENT_MEDIA_URL_RE = /^blob:/i
const LOCAL_PROTOCOL_MEDIA_URL_RE = /^(local-image:\/\/|file:\/\/)/i
const WINDOWS_LOCAL_PATH_RE = /^[a-zA-Z]:[\\/]/

function isNonPersistentMediaUrl(value: unknown) {
  if (typeof value !== 'string') return false

  const candidate = value.trim()
  if (!candidate) return false

  return (
    BASE64_IMAGE_DATA_URL_RE.test(candidate) ||
    BASE64_VIDEO_DATA_URL_RE.test(candidate) ||
    TRANSIENT_MEDIA_URL_RE.test(candidate) ||
    LOCAL_PROTOCOL_MEDIA_URL_RE.test(candidate) ||
    WINDOWS_LOCAL_PATH_RE.test(candidate)
  )
}

export function sanitizeWorkflowCanvasPayloadValue(value: unknown): unknown {
  if (value === null || value === undefined) return value

  if (typeof value === 'string') {
    return isNonPersistentMediaUrl(value) ? '' : value
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeWorkflowCanvasPayloadValue(item))
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sanitizeWorkflowCanvasPayloadValue(item),
      ]),
    )
  }

  return value
}

export function sanitizeCanvasForSave(canvas: WorkflowCanvas): WorkflowCanvas {
  return sanitizeWorkflowCanvasPayloadValue(canvas) as WorkflowCanvas
}

export function createWorkflowSaveSignature(input: {
  name: string
  novelContent: string
  currentStyle: string
  workflowMode: string
  nodes: Node[]
  edges: Edge[]
  viewport: WorkflowViewport
}) {
  return JSON.stringify({
    name: input.name.trim() || '未命名项目',
    novelContent: input.novelContent,
    currentStyle: input.currentStyle,
    workflowMode: input.workflowMode,
    nodes: serializeNodes(input.nodes),
    edges: serializeEdges(input.edges),
    viewport: input.viewport,
  })
}

function toFiniteNumber(value: unknown) {
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

function serializeCreatedNode(node: Node) {
  return sanitizeWorkflowCanvasPayloadValue(
    serializeNodes([node])[0],
  ) as Record<string, unknown>
}

function serializeCreatedEdge(edge: Edge) {
  return sanitizeWorkflowCanvasPayloadValue(
    serializeEdges([edge])[0],
  ) as Record<string, unknown>
}

export function buildNodePositionBatchActions(
  changes: NodeChange[],
  currentNodes: Node[],
): WorkflowCanvasBatchActionsInput | null {
  const nodeById = new Map(currentNodes.map((node) => [String(node.id), node]))
  const updates = changes
    .filter((change) => change.type === 'position' && change.dragging === false)
    .map((change) => {
      const node = nodeById.get(String(change.id))
      const x = toFiniteNumber(change.position?.x ?? node?.position.x)
      const y = toFiniteNumber(change.position?.y ?? node?.position.y)

      if (x === null || y === null) return null

      return {
        id: String(change.id),
        position: { x, y },
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  if (!updates.length) return null

  return {
    actions: [{ action: 'update', updates }],
    created_by_role: 'user',
  }
}

export function buildViewportBatchActions(
  viewport: Viewport,
): WorkflowCanvasBatchActionsInput | null {
  const x = toFiniteNumber(viewport.x)
  const y = toFiniteNumber(viewport.y)
  const zoom = toFiniteNumber(viewport.zoom)

  if (x === null || y === null || zoom === null) return null

  return {
    actions: [{ action: 'updateViewport', viewport: { x, y, zoom } }],
    created_by_role: 'user',
  }
}

export function buildStructureBatchActions(input: {
  createdNodes?: Node[]
  deletedNodeIds?: string[]
  createdEdges?: Edge[]
  deletedEdgeIds?: string[]
}): WorkflowCanvasBatchActionsInput | null {
  const actions: WorkflowCanvasBatchActionsInput['actions'] = []

  const createdNodes = (input.createdNodes ?? [])
    .filter((node) => node?.id)
    .map((node) => serializeCreatedNode(node))
  if (createdNodes.length) {
    actions.push({ action: 'create', creates: createdNodes })
  }

  const deletedNodeIds = [...new Set((input.deletedNodeIds ?? []).filter(Boolean))]
  if (deletedNodeIds.length) {
    actions.push({ action: 'delete', ids: deletedNodeIds })
  }

  const createdEdges = (input.createdEdges ?? [])
    .filter((edge) => edge?.id && edge.source && edge.target)
    .map((edge) => serializeCreatedEdge(edge))
  if (createdEdges.length) {
    actions.push({ action: 'createEdge', creates: createdEdges })
  }

  const deletedEdgeIds = [...new Set((input.deletedEdgeIds ?? []).filter(Boolean))]
  if (deletedEdgeIds.length) {
    actions.push({ action: 'deleteEdge', ids: deletedEdgeIds })
  }

  if (!actions.length) return null

  return {
    actions,
    created_by_role: 'user',
  }
}

export function buildCanvasForSave(input: {
  source: WorkflowCanvas | null | undefined
  nodes: Node[]
  edges: Edge[]
  viewport: WorkflowViewport
  currentStyle: string
  workflowMode: string
}) {
  return sanitizeCanvasForSave({
    ...(input.source ?? {}),
    nodes: serializeNodes(input.nodes),
    edges: serializeEdges(input.edges),
    viewport: input.viewport,
    currentStyle: input.currentStyle,
    workflowMode: input.workflowMode,
  })
}

export function getRemovedEdgeIds(changes: EdgeChange[]) {
  return changes
    .filter((change) => change.type === 'remove')
    .map((change) => String(change.id))
}

export function getRemovedNodeIds(changes: NodeChange[]) {
  return changes
    .filter((change) => change.type === 'remove')
    .map((change) => String(change.id))
}

export function getConnectedEdgeIdsForNodes(
  deletedNodeIds: string[],
  currentEdges: Edge[],
) {
  if (!deletedNodeIds.length) return []

  const idSet = new Set(deletedNodeIds.map((id) => String(id)))
  return currentEdges
    .filter(
      (edge) =>
        idSet.has(String(edge.source)) || idSet.has(String(edge.target)),
    )
    .map((edge) => String(edge.id))
}

export function buildNodeDataDraft(node: Node | null) {
  if (!node) return '{}'

  const { nodeType, rawType, ...data } = (node.data ?? {}) as Record<
    string,
    unknown
  > & {
    nodeType?: string
    rawType?: string
  }
  return JSON.stringify(data, null, 2)
}

export function mergeNodeDraftData(
  node: Node,
  parsed: Record<string, unknown>,
): WorkflowNode['data'] {
  const currentData = (node.data ?? {}) as Record<string, unknown> & {
    rawType?: string
  }
  const resolvedType = String(
    parsed.nodeType ?? parsed.type ?? parsed.rawType ?? currentData.rawType ?? 'custom',
  )

  return {
    ...parsed,
    nodeType: resolvedType,
    rawType: resolvedType,
  }
}
