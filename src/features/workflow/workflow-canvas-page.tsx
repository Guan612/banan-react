import '@xyflow/react/dist/style.css'

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  type Edge,
  type EdgeChange,
  type Node,
  type OnConnect,
  type ReactFlowInstance,
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  type NodeChange,
} from '@xyflow/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import {
  LoaderCircle,
} from 'lucide-react'
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { toast } from 'sonner'
import { accessTokenAtom } from '../../lib/auth'
import { getErrorMessage } from '../home/use-home-page'
import {
  applyWorkflowCanvasBatchActions,
  getWorkflowById,
  updateWorkflow,
  updateWorkflowKeepalive,
} from './workflow-api'
import {
  buildFlowEdges,
  buildFlowNodes,
  DEFAULT_VIEWPORT,
} from './workflow-canvas-utils'
import {
  WorkflowCanvasHeader,
  WorkflowCanvasInspector,
} from './workflow-canvas-sections'
import {
  buildCanvasForSave,
  buildNodeDataDraft,
  buildNodePositionBatchActions,
  buildStructureBatchActions,
  buildViewportBatchActions,
  createWorkflowSaveSignature,
  getConnectedEdgeIdsForNodes,
  getRemovedEdgeIds,
  getRemovedNodeIds,
  mergeNodeDraftData,
} from './workflow-persistence'
import { getWorkflowNodeInfo } from './workflow-node-catalog'
import { workflowNodeTypes } from './workflow-node-renderers'
import type {
  WorkflowCanvas,
  WorkflowCanvasBatchActionsInput,
  WorkflowDetail,
  WorkflowNodeData,
  WorkflowViewport,
} from './workflow-types'

const AUTOSAVE_DELAY_MS = 3000
const VIEWPORT_BATCH_DELAY_MS = 450

const workflowDetailQueryKey = (workflowId: string) =>
  ['workflow', workflowId] as const

type ImageNodeInspectorData = WorkflowNodeData & {
  imagePrompt?: string
  lastGeneratedPrompt?: string
  imageUrl?: string | null
  latestImages?: string[]
  linkedRefImages?: string[]
  selectedRatio?: string
  imageAspectRatio?: string
  selectedResolution?: string
  imageResolution?: string
}

type StoryVideoInspectorData = WorkflowNodeData & {
  prompt?: string
  videoUrl?: string | null
  coverUrl?: string | null
  duration?: number | string
  selectedDuration?: number | string
  selectedVideoDuration?: number | string
  selectedVideoModel?: string
  videoModel?: string
  selectedResolution?: string
  videoResolution?: string
  status?: string
}

function parseLineList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function isImageNode(node: Node | null) {
  return (
    String((node?.data as WorkflowNodeData & { nodeType?: string })?.nodeType || '') ===
    'imageNode'
  )
}

function isStoryVideoNode(node: Node | null) {
  return (
    String((node?.data as WorkflowNodeData & { nodeType?: string })?.nodeType || '') ===
    'storyVideo'
  )
}

function WorkflowCanvasInner({ workflowId }: { workflowId: string }) {
  const accessToken = useAtomValue(accessTokenAtom)
  const queryClient = useQueryClient()
  const reactFlowRef = useRef<ReactFlowInstance<Node, Edge> | null>(null)
  const viewportRef = useRef<WorkflowViewport>(DEFAULT_VIEWPORT)
  const lastSavedSignatureRef = useRef('')
  const latestWorkflowRef = useRef<WorkflowDetail | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const saveInFlightRef = useRef<Promise<WorkflowDetail | null> | null>(null)
  const batchQueueRef = useRef<Promise<void>>(Promise.resolve())
  const batchErrorShownRef = useRef(false)
  const viewportBatchTimerRef = useRef<number | null>(null)

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [projectName, setProjectName] = useState('未命名项目')
  const [novelContent, setNovelContent] = useState('')
  const [currentStyle, setCurrentStyle] = useState('')
  const [workflowMode, setWorkflowMode] = useState('image')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [nodeDataDraft, setNodeDataDraft] = useState('{}')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const projectNameRef = useRef(projectName)
  const novelContentRef = useRef(novelContent)
  const currentStyleRef = useRef(currentStyle)
  const workflowModeRef = useRef(workflowMode)
  const isDirtyRef = useRef(isDirty)

  const workflowQuery = useQuery({
    queryKey: workflowDetailQueryKey(workflowId),
    queryFn: () => getWorkflowById(workflowId),
    enabled: Boolean(accessToken),
    retry: false,
  })

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  useEffect(() => {
    projectNameRef.current = projectName
  }, [projectName])

  useEffect(() => {
    novelContentRef.current = novelContent
  }, [novelContent])

  useEffect(() => {
    currentStyleRef.current = currentStyle
  }, [currentStyle])

  useEffect(() => {
    workflowModeRef.current = workflowMode
  }, [workflowMode])

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )
  const selectedImageNodeData = useMemo(
    () => (isImageNode(selectedNode) ? ((selectedNode.data ?? {}) as ImageNodeInspectorData) : null),
    [selectedNode],
  )
  const selectedStoryVideoNodeData = useMemo(
    () =>
      isStoryVideoNode(selectedNode)
        ? ((selectedNode.data ?? {}) as StoryVideoInspectorData)
        : null,
    [selectedNode],
  )

  const updateDirtyState = useEffectEvent(() => {
    const signature = createWorkflowSaveSignature({
      name: projectNameRef.current,
      novelContent: novelContentRef.current,
      currentStyle: currentStyleRef.current,
      workflowMode: workflowModeRef.current,
      nodes: nodesRef.current,
      edges: edgesRef.current,
      viewport: viewportRef.current,
    })
    setIsDirty(signature !== lastSavedSignatureRef.current)
  })

  const commitSavedState = useEffectEvent((workflow: WorkflowDetail | null) => {
    if (workflow) {
      latestWorkflowRef.current = workflow
      queryClient.setQueryData(workflowDetailQueryKey(workflowId), workflow)
    }

    lastSavedSignatureRef.current = createWorkflowSaveSignature({
      name: projectNameRef.current,
      novelContent: novelContentRef.current,
      currentStyle: currentStyleRef.current,
      workflowMode: workflowModeRef.current,
      nodes: nodesRef.current,
      edges: edgesRef.current,
      viewport: viewportRef.current,
    })
    setIsDirty(false)
  })

  const saveWorkflowSnapshot = useEffectEvent(
    async ({
      silent = false,
      keepalive = false,
    }: {
      silent?: boolean
      keepalive?: boolean
    } = {}) => {
      if (saveInFlightRef.current) {
        return saveInFlightRef.current
      }

      const current = latestWorkflowRef.current
      if (!current) {
        throw new Error('工作流尚未加载完成')
      }

      const payload = {
        name: projectNameRef.current.trim() || '未命名项目',
        novel_content: novelContentRef.current,
        current_step: current.current_step,
        canvas_nodes: buildCanvasForSave({
          source: current.canvas_nodes,
          nodes: nodesRef.current,
          edges: edgesRef.current,
          viewport: viewportRef.current,
          currentStyle: currentStyleRef.current,
          workflowMode: workflowModeRef.current,
        }),
      }

      setIsSaving(true)
      const promise = (async () => {
        if (keepalive) {
          await updateWorkflowKeepalive(workflowId, payload)
          commitSavedState(null)
          return null
        }

        const data = await updateWorkflow(workflowId, payload)
        commitSavedState(data)
        if (!silent) {
          toast.success('画布已保存')
        }
        return data
      })()
        .catch((error) => {
          if (!silent) {
            toast.error(getErrorMessage(error))
          }
          throw error
        })
        .finally(() => {
          saveInFlightRef.current = null
          setIsSaving(false)
        })

      saveInFlightRef.current = promise
      return promise
    },
  )

  const enqueueBatchActions = useEffectEvent(
    (payload: WorkflowCanvasBatchActionsInput | null) => {
      if (!payload || !payload.actions.length) return

      batchQueueRef.current = batchQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            await applyWorkflowCanvasBatchActions(workflowId, payload)
            batchErrorShownRef.current = false
          } catch (error) {
            if (!batchErrorShownRef.current) {
              batchErrorShownRef.current = true
              toast.error(
                `轻量保存失败，后续会继续走整包保存。${getErrorMessage(error)}`,
              )
            }
          }
        })
    },
  )

  const scheduleViewportBatchSave = useEffectEvent(() => {
    if (viewportBatchTimerRef.current !== null) {
      window.clearTimeout(viewportBatchTimerRef.current)
    }

    viewportBatchTimerRef.current = window.setTimeout(() => {
      viewportBatchTimerRef.current = null
      enqueueBatchActions(buildViewportBatchActions(viewportRef.current))
    }, VIEWPORT_BATCH_DELAY_MS)
  })

  useEffect(() => {
    const workflow = workflowQuery.data
    if (!workflow) return

    latestWorkflowRef.current = workflow
    const nextNodes = buildFlowNodes(workflow.canvas_nodes)
    const nextEdges = buildFlowEdges(workflow.canvas_nodes)
    const nextViewport = workflow.canvas_nodes?.viewport ?? DEFAULT_VIEWPORT

    setProjectName(workflow.name || '未命名项目')
    setNovelContent(workflow.novel_content || '')
    setCurrentStyle(workflow.canvas_nodes?.currentStyle || '')
    setWorkflowMode(workflow.canvas_nodes?.workflowMode || 'image')
    setNodes(nextNodes)
    setEdges(nextEdges)
    viewportRef.current = nextViewport
    setSelectedNodeId(nextNodes[0]?.id ?? null)

    const signature = createWorkflowSaveSignature({
      name: workflow.name || '未命名项目',
      novelContent: workflow.novel_content || '',
      currentStyle: workflow.canvas_nodes?.currentStyle || '',
      workflowMode: workflow.canvas_nodes?.workflowMode || 'image',
      nodes: nextNodes,
      edges: nextEdges,
      viewport: nextViewport,
    })
    lastSavedSignatureRef.current = signature
    setIsDirty(false)

    if (reactFlowRef.current) {
      requestAnimationFrame(() => {
        reactFlowRef.current?.setViewport(nextViewport, { duration: 0 })
      })
    }
  }, [workflowQuery.data])

  useEffect(() => {
    setNodeDataDraft(buildNodeDataDraft(selectedNode))
  }, [selectedNode])

  useEffect(() => {
    updateDirtyState()
  }, [nodes, edges, projectName, novelContent, currentStyle, workflowMode, updateDirtyState])

  useEffect(() => {
    if (!isDirty || !accessToken || !workflowQuery.data) return

    const timer = window.setTimeout(() => {
      void saveWorkflowSnapshot({ silent: true })
    }, AUTOSAVE_DELAY_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [accessToken, isDirty, saveWorkflowSnapshot, workflowQuery.data])

  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveWorkflowSnapshot()
      }
    }

    window.addEventListener('keydown', handleSaveShortcut)
    return () => {
      window.removeEventListener('keydown', handleSaveShortcut)
    }
  }, [saveWorkflowSnapshot])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    const handlePageHide = () => {
      if (!isDirtyRef.current) return
      void saveWorkflowSnapshot({ silent: true, keepalive: true })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [saveWorkflowSnapshot])

  useEffect(() => {
    return () => {
      if (viewportBatchTimerRef.current !== null) {
        window.clearTimeout(viewportBatchTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  const onNodesChange = useEffectEvent((changes: NodeChange<Node>[]) => {
    const currentNodes = nodesRef.current
    const currentEdges = edgesRef.current
    const deletedNodeIds = getRemovedNodeIds(changes)
    const deletedEdgeIds = getConnectedEdgeIdsForNodes(deletedNodeIds, currentEdges)
    const positionPayload = buildNodePositionBatchActions(changes, currentNodes)

    setNodes((current) => applyNodeChanges(changes, current))

    if (deletedNodeIds.length) {
      setEdges((current) =>
        current.filter(
          (edge) =>
            !deletedNodeIds.includes(String(edge.source)) &&
            !deletedNodeIds.includes(String(edge.target)),
        ),
      )
      if (selectedNodeId && deletedNodeIds.includes(selectedNodeId)) {
        setSelectedNodeId(null)
      }
    }

    enqueueBatchActions(positionPayload)
    enqueueBatchActions(
      buildStructureBatchActions({
        deletedNodeIds,
        deletedEdgeIds,
      }),
    )
  })

  const onEdgesChange = useEffectEvent((changes: EdgeChange<Edge>[]) => {
    const deletedEdgeIds = getRemovedEdgeIds(changes)
    setEdges((current) => applyEdgeChanges(changes, current))
    enqueueBatchActions(buildStructureBatchActions({ deletedEdgeIds }))
  })

  const onConnect: OnConnect = useEffectEvent((connection) => {
    const nextEdge: Edge = {
      ...connection,
      id: `edge-${crypto.randomUUID()}`,
      type: 'smoothstep',
      animated: false,
    }

    setEdges((currentEdges) => addEdge(nextEdge, currentEdges))
    enqueueBatchActions(buildStructureBatchActions({ createdEdges: [nextEdge] }))
  })

  function createNode(templateType: string) {
    const selected = selectedNode
    const baseX = selected?.position.x ?? 80
    const baseY = selected?.position.y ?? 80
    const id = `${templateType}-${crypto.randomUUID().slice(0, 8)}`
    const info = getWorkflowNodeInfo(templateType)

    const node: Node = {
      id,
      type: 'workflow',
      position: {
        x: baseX + 320,
        y: baseY + (nodes.length % 2) * 120,
      },
      data: {
        nodeType: templateType,
        rawType: templateType,
        label: `新${info.label}`,
        content: '',
      },
    }

    setNodes((current) => [...current, node])
    setSelectedNodeId(id)
    enqueueBatchActions(buildStructureBatchActions({ createdNodes: [node] }))
  }

  function removeSelectedNode() {
    if (!selectedNodeId) return

    const deletedEdgeIds = edgesRef.current
      .filter(
        (edge) =>
          String(edge.source) === selectedNodeId ||
          String(edge.target) === selectedNodeId,
      )
      .map((edge) => String(edge.id))

    setNodes((current) => current.filter((node) => node.id !== selectedNodeId))
    setEdges((current) =>
      current.filter(
        (edge) =>
          edge.source !== selectedNodeId && edge.target !== selectedNodeId,
      ),
    )
    setSelectedNodeId(null)

    enqueueBatchActions(
      buildStructureBatchActions({
        deletedNodeIds: [selectedNodeId],
        deletedEdgeIds,
      }),
    )
  }

  function applyNodeJson() {
    if (!selectedNode) return

    try {
      const parsed = JSON.parse(nodeDataDraft) as Record<string, unknown>
      setNodes((current) =>
        current.map((node) =>
          node.id === selectedNode.id
            ? {
                ...node,
                data: mergeNodeDraftData(node, parsed),
              }
            : node,
        ),
      )
      toast.success('节点数据已更新')
    } catch {
      toast.error('节点 JSON 解析失败，请检查格式')
    }
  }

  function updateSelectedNodeMeta(
    key: 'label' | 'rawType',
    value: string,
    event?: ReactKeyboardEvent<HTMLInputElement>,
  ) {
    if (event && event.nativeEvent.isComposing) return
    if (!selectedNode) return

    setNodes((current) =>
      current.map((node) => {
        if (node.id !== selectedNode.id) return node
        const nextData = { ...(node.data as WorkflowNodeData) }
        if (key === 'label') {
          nextData.label = value
        }
        if (key === 'rawType') {
          nextData.nodeType = value
          nextData.rawType = value
        }
        return { ...node, data: nextData }
      }),
    )
  }

  function updateSelectedNodeDataField(
    key: string,
    value: unknown,
    event?: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (event && event.nativeEvent.isComposing) return
    if (!selectedNode) return

    setNodes((current) =>
      current.map((node) => {
        if (node.id !== selectedNode.id) return node
        return {
          ...node,
          data: {
            ...(node.data as WorkflowNodeData),
            [key]: value,
          },
        }
      }),
    )
  }

  function updateSelectedNodeDataFields(patch: Record<string, unknown>) {
    if (!selectedNode) return

    setNodes((current) =>
      current.map((node) => {
        if (node.id !== selectedNode.id) return node
        return {
          ...node,
          data: {
            ...(node.data as WorkflowNodeData),
            ...patch,
          },
        }
      }),
    )
  }

  function fitCanvas() {
    reactFlowRef.current?.fitView({
      duration: 400,
      padding: 0.18,
    })
  }

  async function importCanvasJson(file: File) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as WorkflowCanvas
      const nextNodes = buildFlowNodes(parsed)
      const nextEdges = buildFlowEdges(parsed)
      setNodes(nextNodes)
      setEdges(nextEdges)
      viewportRef.current = parsed.viewport ?? DEFAULT_VIEWPORT
      setCurrentStyle(parsed.currentStyle || '')
      setWorkflowMode(parsed.workflowMode || 'image')
      setSelectedNodeId(nextNodes[0]?.id ?? null)
      requestAnimationFrame(() => {
        reactFlowRef.current?.setViewport(viewportRef.current, { duration: 0 })
      })
      toast.success('已导入画布 JSON')
    } catch {
      toast.error('导入失败，文件内容不是有效的画布 JSON')
    }
  }

  if (!accessToken) {
    return (
      <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,rgba(125,155,255,0.18),transparent_28%),linear-gradient(180deg,#f4f7fb,#e8eef8)] px-4 py-6 sm:px-6">
        <section className="mx-auto max-w-4xl rounded-[2rem] border border-white/55 bg-white/82 px-6 py-10 shadow-[0_24px_80px_rgba(31,44,86,0.12)] backdrop-blur-xl sm:px-10">
          <p className="island-kicker mb-3">Workflow Canvas</p>
          <h1 className="display-title mb-4 text-4xl font-semibold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
            请先登录后再打开画布
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--sea-ink-soft)]">
            这个项目页需要鉴权后才能读取 `canvas2` 工作流数据。当前浏览器还没有登录，所以我先避免它一直停在加载状态。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link to="/login">去登录</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/">返回首页</Link>
            </Button>
          </div>
        </section>
      </main>
    )
  }

  if (workflowQuery.isLoading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(125,155,255,0.18),transparent_28%),linear-gradient(180deg,#f4f7fb,#e8eef8)] px-4 py-6 sm:px-6">
        <div className="flex w-full max-w-xl items-center gap-3 rounded-[2rem] border border-white/55 bg-white/82 px-6 py-8 text-[var(--sea-ink-soft)] shadow-[0_24px_80px_rgba(31,44,86,0.12)] backdrop-blur-xl">
          <LoaderCircle className="size-5 animate-spin text-[var(--lagoon-deep)]" />
          正在加载画布项目...
        </div>
      </main>
    )
  }

  if (workflowQuery.isError || !workflowQuery.data) {
    return (
      <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,rgba(125,155,255,0.18),transparent_28%),linear-gradient(180deg,#f4f7fb,#e8eef8)] px-4 py-6 sm:px-6">
        <section className="mx-auto max-w-4xl rounded-[2rem] border border-white/55 bg-white/82 px-6 py-10 shadow-[0_24px_80px_rgba(31,44,86,0.12)] backdrop-blur-xl sm:px-10">
          <p className="island-kicker mb-3">Workflow Canvas</p>
          <h1 className="display-title mb-4 text-4xl font-semibold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
            画布加载失败
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--sea-ink-soft)]">
            {getErrorMessage(workflowQuery.error)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void workflowQuery.refetch()}
            >
              重新加载
            </Button>
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/">返回首页</Link>
            </Button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="h-[calc(100dvh-4.5rem)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(125,155,255,0.18),transparent_24%),linear-gradient(180deg,#f5f8fc,#e7edf7)] p-3 sm:h-[calc(100dvh-5rem)] sm:p-4">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.6rem] border border-white/55 bg-[linear-gradient(165deg,rgba(255,255,255,0.78),rgba(235,240,250,0.66))] shadow-[0_26px_90px_rgba(31,44,86,0.14)] backdrop-blur-xl">
        <WorkflowCanvasHeader
          workflow={workflowQuery.data}
          projectName={projectName}
          currentStyle={currentStyle}
          workflowMode={workflowMode}
          nodesCount={nodes.length}
          edgesCount={edges.length}
          isDirty={isDirty}
          isSaving={isSaving}
          onProjectNameChange={setProjectName}
          onCreateNode={createNode}
          onImportClick={() => fileInputRef.current?.click()}
          onFitCanvas={fitCanvas}
          onSave={() => void saveWorkflowSnapshot()}
        />
        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="application/json"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void importCanvasJson(file)
            }
            event.target.value = ''
          }}
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="relative h-full min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(125,155,255,0.15),transparent_28%),linear-gradient(180deg,rgba(242,246,255,0.72),rgba(231,237,247,0.9))]">
            <ReactFlow
              className="h-full"
              nodes={nodes}
              edges={edges}
              nodeTypes={workflowNodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              onInit={(instance) => {
                reactFlowRef.current = instance
                instance.setViewport(viewportRef.current, { duration: 0 })
              }}
              onMoveEnd={(_, viewport) => {
                viewportRef.current = viewport
                updateDirtyState()
                scheduleViewportBatchSave()
              }}
              fitView
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: false,
                style: {
                  stroke: '#6f87ff',
                  strokeWidth: 2,
                },
              }}
              connectionLineType={ConnectionLineType.SmoothStep}
            >
              <Background
                color="rgba(93,127,255,0.16)"
                gap={22}
                size={1.15}
                variant={BackgroundVariant.Dots}
              />
              <MiniMap
                pannable
                zoomable
                className="!bottom-4 !left-4 !rounded-2xl !border !border-white/70 !bg-white/85 !shadow-[0_18px_42px_rgba(31,44,86,0.14)]"
                nodeColor="#8fa7ff"
                style={{ width: 160, height: 96 }}
              />
              <Controls className="!rounded-2xl !border !border-white/70 !bg-white/85 !shadow-[0_18px_42px_rgba(31,44,86,0.14)]" />
            </ReactFlow>

            <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2">
              <div className="rounded-full border border-white/70 bg-white/82 px-3 py-1.5 text-xs font-semibold text-[#4a5d88] shadow-[0_12px_28px_rgba(31,44,86,0.1)]">
                拖拽节点会走轻量保存
              </div>
              <div className="rounded-full border border-white/70 bg-white/82 px-3 py-1.5 text-xs font-semibold text-[#4a5d88] shadow-[0_12px_28px_rgba(31,44,86,0.1)]">
                视口移动会自动防抖保存
              </div>
              <div className="rounded-full border border-white/70 bg-white/82 px-3 py-1.5 text-xs font-semibold text-[#4a5d88] shadow-[0_12px_28px_rgba(31,44,86,0.1)]">
                `Ctrl/Cmd + S` 可立即整包保存
              </div>
            </div>
          </div>

          <WorkflowCanvasInspector
            workflow={workflowQuery.data}
            selectedNode={selectedNode}
            selectedImageNodeData={selectedImageNodeData}
            selectedStoryVideoNodeData={selectedStoryVideoNodeData}
            currentStyle={currentStyle}
            workflowMode={workflowMode}
            novelContent={novelContent}
            nodeDataDraft={nodeDataDraft}
            isSaving={isSaving}
            isDirty={isDirty}
            onCurrentStyleChange={setCurrentStyle}
            onWorkflowModeChange={setWorkflowMode}
            onNovelContentChange={setNovelContent}
            onRemoveSelectedNode={removeSelectedNode}
            onUpdateNodeMeta={(key, value) => updateSelectedNodeMeta(key, value)}
            onUpdateNodeDataField={updateSelectedNodeDataField}
            onUpdateNodeDataFields={updateSelectedNodeDataFields}
            onNodeDataDraftChange={setNodeDataDraft}
            onApplyNodeJson={applyNodeJson}
            onSave={() => void saveWorkflowSnapshot()}
            onParseLineList={parseLineList}
          />
        </div>
      </section>
    </main>
  )
}

export function WorkflowCanvasPage({ workflowId }: { workflowId: string }) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner workflowId={workflowId} />
    </ReactFlowProvider>
  )
}
