export type WorkflowNodeCatalogItem = {
  type: string
  label: string
  color: string
  nextNodes?: string[]
}

export const workflowNodeCatalog: Record<string, WorkflowNodeCatalogItem> = {
  novelInput: {
    type: 'novelInput',
    label: '小说输入',
    color: '#5d7fff',
    nextNodes: ['characterExtract'],
  },
  characterExtract: {
    type: 'characterExtract',
    label: '提取角色和场景',
    color: '#22c55e',
    nextNodes: ['characterPrompt'],
  },
  characterPrompt: {
    type: 'characterPrompt',
    label: '角色/场景/物品',
    color: '#f59e0b',
    nextNodes: ['characterVideo'],
  },
  characterVideo: {
    type: 'characterVideo',
    label: '角色视频',
    color: '#ef4444',
    nextNodes: ['characterCreate'],
  },
  characterCreate: {
    type: 'characterCreate',
    label: '创建角色',
    color: '#8b5cf6',
    nextNodes: ['shotPrompt'],
  },
  textNode: {
    type: 'textNode',
    label: '文本',
    color: '#06b6d4',
    nextNodes: ['characterExtract', 'storyPrompt'],
  },
  storyPrompt: {
    type: 'storyPrompt',
    label: '智能分镜',
    color: '#6366f1',
    nextNodes: [],
  },
  shotPrompt: {
    type: 'shotPrompt',
    label: '分镜',
    color: '#8b5cf6',
    nextNodes: ['imageNode', 'storyVideo'],
  },
  storyVideo: {
    type: 'storyVideo',
    label: '分镜视频',
    color: '#7c3aed',
    nextNodes: [],
  },
  imageNode: {
    type: 'imageNode',
    label: '图片',
    color: '#16a34a',
    nextNodes: ['imageNode', 'storyVideo', 'panoramaPreview'],
  },
  panoramaPreview: {
    type: 'panoramaPreview',
    label: '3D预览',
    color: '#0ea5e9',
    nextNodes: [],
  },
  gridNode: {
    type: 'gridNode',
    label: '宫格',
    color: '#3b82f6',
    nextNodes: [],
  },
  directorPackage: {
    type: 'directorPackage',
    label: '导演工作包',
    color: '#fbbf24',
    nextNodes: ['entityCategory', 'plotLine', 'emotionCurve', 'visualKeyword'],
  },
  entityCategory: {
    type: 'entityCategory',
    label: '实体类别',
    color: '#8b5cf6',
    nextNodes: ['imageNode'],
  },
  plotLine: {
    type: 'plotLine',
    label: '情节线',
    color: '#fb923c',
    nextNodes: ['shotPrompt', 'storyPrompt'],
  },
  emotionCurve: {
    type: 'emotionCurve',
    label: '情绪曲线',
    color: '#f472b6',
    nextNodes: ['shotPrompt'],
  },
  visualKeyword: {
    type: 'visualKeyword',
    label: '视觉关键词',
    color: '#34d399',
    nextNodes: ['shotPrompt', 'imageNode'],
  },
  voiceNode: {
    type: 'voiceNode',
    label: '音色',
    color: '#14b8a6',
    nextNodes: ['characterPrompt', 'shotPrompt', 'storyVideo', 'imageNode'],
  },
}

export const workflowQuickCreateTypes = [
  'textNode',
  'novelInput',
  'storyPrompt',
  'shotPrompt',
  'imageNode',
  'storyVideo',
] as const

export function getWorkflowNodeInfo(type?: string | null) {
  if (!type) {
    return {
      type: 'custom',
      label: '自定义节点',
      color: '#64748b',
      nextNodes: [],
    }
  }

  return (
    workflowNodeCatalog[type] ?? {
      type,
      label: type,
      color: '#64748b',
      nextNodes: [],
    }
  )
}
