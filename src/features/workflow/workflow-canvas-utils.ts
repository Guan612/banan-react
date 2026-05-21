import type { Edge, Node } from '@xyflow/react'
import { getWorkflowNodeInfo } from './workflow-node-catalog'
import type {
  WorkflowCanvas,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
  WorkflowViewport,
} from './workflow-types'

export const DEFAULT_VIEWPORT: WorkflowViewport = {
  x: 0,
  y: 0,
  zoom: 0.9,
}

export function getNodeTitle(node: Pick<Node, 'id' | 'type' | 'data'>) {
  const data = (node.data ?? {}) as WorkflowNodeData
  const nodeType =
    String((data as WorkflowNodeData & { rawType?: string }).rawType || node.type || '').trim()
  const fallbackLabel = getWorkflowNodeInfo(nodeType).label

  return (
    String(
      data.label ||
        data.title ||
        data.name ||
        data.content ||
        fallbackLabel ||
        node.id,
    )
      .trim()
      .slice(0, 48) || '未命名节点'
  )
}

export function getNodeExcerpt(data: WorkflowNodeData | undefined) {
  if (!data) return '暂无节点内容'

  const raw = [
    data.prompt,
    data.text,
    data.content,
    data.description,
    data.dialogue,
    data.negativePrompt,
  ].find((value) => typeof value === 'string' && value.trim().length > 0)

  if (!raw) {
    const compact = JSON.stringify(data)
    return compact.length > 96 ? `${compact.slice(0, 96)}...` : compact
  }

  return raw.trim().slice(0, 120)
}

export function formatTime(value?: string | null) {
  if (!value) return '未知时间'

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function buildFlowNodes(canvas: WorkflowCanvas | null | undefined): Node[] {
  return (canvas?.nodes ?? []).map((node) => ({
    id: String(node.id),
    type: 'workflow',
    position: {
      x: Number(node.position?.x ?? 0),
      y: Number(node.position?.y ?? 0),
    },
    data: {
      ...node.data,
      nodeType: node.type || 'custom',
      rawType: node.type || 'custom',
    },
  }))
}

export function buildFlowEdges(canvas: WorkflowCanvas | null | undefined): Edge[] {
  return (canvas?.edges ?? []).map((edge) => ({
    id: String(edge.id),
    source: String(edge.source),
    target: String(edge.target),
    type: edge.type || 'smoothstep',
    label: edge.label,
    animated: false,
  }))
}

export function serializeNodes(nodes: Node[]): WorkflowNode[] {
  return nodes.map((node) => {
    const { nodeType, rawType, ...data } = (node.data ?? {}) as WorkflowNodeData & {
      nodeType?: string
      rawType?: string
    }

    return {
      id: String(node.id),
      type: String(rawType || nodeType || node.type || 'custom'),
      position: {
        x: Number(node.position.x ?? 0),
        y: Number(node.position.y ?? 0),
      },
      data,
    }
  })
}

export function serializeEdges(edges: Edge[]): WorkflowEdge[] {
  return edges.map((edge) => ({
    id: String(edge.id),
    source: String(edge.source),
    target: String(edge.target),
    type: edge.type || 'smoothstep',
    label: typeof edge.label === 'string' ? edge.label : undefined,
  }))
}
