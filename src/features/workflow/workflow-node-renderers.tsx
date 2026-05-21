import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { getWorkflowNodeInfo } from './workflow-node-catalog'
import { getNodeExcerpt, getNodeTitle } from './workflow-canvas-utils'
import type { WorkflowNodeData } from './workflow-types'

const nodeTintMap: Record<string, string> = {
  novelInput: 'from-[#5d7fff]/20 via-[#7d9bff]/10 to-white/0',
  characterExtract: 'from-[#22c55e]/18 via-[#7ed3bf]/10 to-white/0',
  storyPrompt: 'from-[#fb7185]/18 via-[#fda4af]/10 to-white/0',
  shotPrompt: 'from-[#8b5cf6]/18 via-[#c4b5fd]/10 to-white/0',
  storyVideo: 'from-[#7c3aed]/18 via-[#c4b5fd]/10 to-white/0',
  imageNode: 'from-[#06b6d4]/18 via-[#67e8f9]/10 to-white/0',
  textNode: 'from-[#0f766e]/18 via-[#5eead4]/10 to-white/0',
  voiceNode: 'from-[#14b8a6]/18 via-[#99f6e4]/10 to-white/0',
}

function BaseHandle({
  type,
  position,
  id,
}: {
  type: 'source' | 'target'
  position: Position
  id?: string
}) {
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      className="!h-3 !w-3 !border-2 !border-white !bg-[#5d7fff]"
    />
  )
}

function NodeShell({
  nodeType,
  selected,
  children,
  className,
  badge,
}: {
  nodeType: string
  selected: boolean
  children: ReactNode
  className?: string
  badge?: ReactNode
}) {
  const info = getWorkflowNodeInfo(nodeType)

  return (
    <div
      className={cn(
        'rounded-[24px] border border-white/50 bg-[linear-gradient(160deg,rgba(255,255,255,0.94),rgba(237,241,247,0.78))] shadow-[0_24px_56px_rgba(31,44,86,0.16)] backdrop-blur-xl transition',
        selected && 'ring-2 ring-[#7d9bff]/60',
        className,
      )}
    >
      <div
        className={cn(
          'rounded-[24px] bg-gradient-to-br p-4',
          nodeTintMap[nodeType] ?? 'from-white/70 to-white/0',
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6c7b9a]">
              {info.label}
            </p>
            {children}
          </div>
          {badge ?? (
            <span
              className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold"
              style={{ color: info.color }}
            >
              {nodeType}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function WorkflowGenericNode({ data, selected }: NodeProps<Node>) {
  const nodeType = String(
    (data as WorkflowNodeData & { nodeType?: string }).nodeType || 'custom',
  )
  const info = getWorkflowNodeInfo(nodeType)
  const title = getNodeTitle({
    id: '',
    type: nodeType,
    data,
  })
  const excerpt = getNodeExcerpt(data as WorkflowNodeData)

  return (
    <div className="w-[280px]">
      <BaseHandle type="target" position={Position.Left} />
      <NodeShell nodeType={nodeType} selected={selected}>
        <h3 className="m-0 truncate text-sm font-bold text-[#1a2744]">{title}</h3>
        <p className="mt-3 line-clamp-4 text-xs leading-5 text-[#53627f]">
          {excerpt}
        </p>
        {info.nextNodes?.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {info.nextNodes.slice(0, 4).map((nextType) => (
              <span
                key={nextType}
                className="rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[10px] font-semibold text-[#64748b]"
              >
                {getWorkflowNodeInfo(nextType).label}
              </span>
            ))}
          </div>
        ) : null}
      </NodeShell>
      <BaseHandle type="source" position={Position.Right} />
    </div>
  )
}

function WorkflowTextNode({ data, selected }: NodeProps<Node>) {
  const textData = data as WorkflowNodeData & {
    content?: string
    aiGenerating?: boolean
  }
  const content = String(textData.content || '').trim()
  const paragraphCount = content
    ? content
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean).length
    : 0

  return (
    <div className="w-[340px]">
      <BaseHandle type="target" position={Position.Left} id="input" />
      <NodeShell nodeType="textNode" selected={selected} className="overflow-hidden">
        <h3 className="m-0 truncate text-sm font-bold text-[#1a2744]">
          {content.slice(0, 24) || '文本草稿'}
        </h3>
        <div className="mt-3 rounded-[18px] border border-white/70 bg-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="m-0 line-clamp-6 whitespace-pre-wrap text-[13px] leading-6 text-[#42526d]">
            {content || '开启你的创作...'}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-[#64748b]">
            {paragraphCount > 0 ? `${paragraphCount} 段文本` : '未填写内容'}
          </span>
          <span
            className={cn(
              'rounded-full border px-2.5 py-1 text-[10px] font-semibold',
              textData.aiGenerating
                ? 'border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#7c3aed]'
                : 'border-[#0f766e]/20 bg-[#0f766e]/8 text-[#0f766e]',
            )}
          >
            {textData.aiGenerating ? 'AI 处理中' : '可继续拆解'}
          </span>
        </div>
      </NodeShell>
      <BaseHandle type="source" position={Position.Right} id="output" />
    </div>
  )
}

function WorkflowImageNode({ data, selected }: NodeProps<Node>) {
  const imageData = data as WorkflowNodeData & {
    imageUrl?: string | null
    latestImages?: string[]
    imagePrompt?: string
    lastGeneratedPrompt?: string
    selectedRatio?: string
    imageAspectRatio?: string
    selectedResolution?: string
    imageResolution?: string
    isGenerating?: boolean
    generateError?: string | null
    linkedRefImages?: string[]
  }

  const latestImage = imageData.imageUrl || imageData.latestImages?.[0] || ''
  const prompt = String(
    imageData.imagePrompt || imageData.lastGeneratedPrompt || '',
  ).trim()
  const ratio = String(
    imageData.selectedRatio || imageData.imageAspectRatio || '未设置',
  )
  const resolution = String(
    imageData.selectedResolution || imageData.imageResolution || '未设置',
  )
  const refCount = Array.isArray(imageData.linkedRefImages)
    ? imageData.linkedRefImages.filter(Boolean).length
    : 0
  const imageCount = Array.isArray(imageData.latestImages)
    ? imageData.latestImages.filter(Boolean).length
    : latestImage
      ? 1
      : 0

  return (
    <div className="w-[320px]">
      <BaseHandle type="target" position={Position.Left} id="imageInput" />
      <NodeShell nodeType="imageNode" selected={selected} className="overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 truncate text-sm font-bold text-[#1a2744]">
            {latestImage ? '图片结果' : '待生成图片'}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold',
              imageData.generateError
                ? 'border-[#ef4444]/30 bg-[#ef4444]/10 text-[#b91c1c]'
                : imageData.isGenerating
                  ? 'border-[#06b6d4]/30 bg-[#06b6d4]/10 text-[#0f766e]'
                  : latestImage
                    ? 'border-[#16a34a]/25 bg-[#16a34a]/10 text-[#166534]'
                    : 'border-white/70 bg-white/72 text-[#64748b]',
            )}
          >
            {imageData.generateError
              ? '生成失败'
              : imageData.isGenerating
                ? '生成中'
                : latestImage
                  ? '已出图'
                  : '未出图'}
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-[18px] border border-white/70 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {latestImage ? (
            <img
              src={latestImage}
              alt="节点预览"
              className="block h-44 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-44 items-center justify-center bg-[linear-gradient(135deg,rgba(103,232,249,0.18),rgba(196,181,253,0.18))] px-6 text-center text-xs font-semibold text-[#5b6680]">
              {imageData.generateError
                ? imageData.generateError
                : '还没有生成图片，参数和提示词已保留'}
            </div>
          )}
        </div>

        <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-[#53627f]">
          {prompt || '暂无图片提示词'}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[10px] font-semibold text-[#64748b]">
            比例 {ratio}
          </span>
          <span className="rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[10px] font-semibold text-[#64748b]">
            分辨率 {resolution}
          </span>
          <span className="rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[10px] font-semibold text-[#64748b]">
            参考图 {refCount}
          </span>
          <span className="rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[10px] font-semibold text-[#64748b]">
            结果 {imageCount}
          </span>
        </div>
      </NodeShell>
      <BaseHandle type="source" position={Position.Right} id="imageOutput" />
    </div>
  )
}

function WorkflowStoryVideoNode({ data, selected }: NodeProps<Node>) {
  const videoData = data as WorkflowNodeData & {
    videoUrl?: string | null
    coverUrl?: string | null
    prompt?: string
    duration?: number | string
    selectedDuration?: number | string
    selectedVideoDuration?: number | string
    videoModel?: string
    selectedVideoModel?: string
    selectedResolution?: string
    videoResolution?: string
    progress?: number | string
    status?: string
    error?: string | null
  }

  const videoUrl = String(videoData.videoUrl || '').trim()
  const coverUrl = String(videoData.coverUrl || '').trim()
  const prompt = String(videoData.prompt || '').trim()
  const duration = String(
    videoData.duration ||
      videoData.selectedDuration ||
      videoData.selectedVideoDuration ||
      '未设置',
  )
  const model = String(
    videoData.selectedVideoModel || videoData.videoModel || '未设置',
  )
  const resolution = String(
    videoData.selectedResolution || videoData.videoResolution || '未设置',
  )
  const rawStatus = String(videoData.status || '').trim()
  const progress =
    typeof videoData.progress === 'number'
      ? videoData.progress
      : Number(videoData.progress || 0)

  let statusLabel = '未生成'
  let statusTone =
    'border-white/70 bg-white/72 text-[#64748b]'

  if (videoData.error) {
    statusLabel = '生成失败'
    statusTone = 'border-[#ef4444]/30 bg-[#ef4444]/10 text-[#b91c1c]'
  } else if (videoUrl) {
    statusLabel = '已出视频'
    statusTone = 'border-[#16a34a]/25 bg-[#16a34a]/10 text-[#166534]'
  } else if (
    rawStatus === 'processing' ||
    rawStatus === 'pending' ||
    rawStatus === 'running' ||
    progress > 0
  ) {
    statusLabel = progress > 0 ? `生成中 ${Math.round(progress)}%` : '生成中'
    statusTone = 'border-[#7c3aed]/30 bg-[#7c3aed]/10 text-[#6d28d9]'
  }

  return (
    <div className="w-[320px]">
      <BaseHandle type="target" position={Position.Left} id="videoInput" />
      <NodeShell nodeType="storyVideo" selected={selected} className="overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 truncate text-sm font-bold text-[#1a2744]">
            {videoUrl ? '分镜视频结果' : '待生成视频'}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold',
              statusTone,
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-[18px] border border-white/70 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {videoUrl ? (
            <video
              src={videoUrl}
              poster={coverUrl || undefined}
              className="block h-44 w-full object-cover"
              controls
              preload="metadata"
            />
          ) : coverUrl ? (
            <img
              src={coverUrl}
              alt="视频封面"
              className="block h-44 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-44 items-center justify-center bg-[linear-gradient(135deg,rgba(139,92,246,0.16),rgba(196,181,253,0.22))] px-6 text-center text-xs font-semibold text-[#5b6680]">
              {videoData.error ? videoData.error : '还没有生成视频，提示词和参数已保留'}
            </div>
          )}
        </div>

        <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-[#53627f]">
          {prompt || '暂无视频提示词'}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[10px] font-semibold text-[#64748b]">
            时长 {duration}
          </span>
          <span className="rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[10px] font-semibold text-[#64748b]">
            模型 {model}
          </span>
          <span className="rounded-full border border-white/70 bg-white/70 px-2 py-1 text-[10px] font-semibold text-[#64748b]">
            分辨率 {resolution}
          </span>
        </div>
      </NodeShell>
      <BaseHandle type="source" position={Position.Right} id="videoOutput" />
    </div>
  )
}

function WorkflowCanvasNode(props: NodeProps<Node>) {
  const nodeType = String(
    (props.data as WorkflowNodeData & { nodeType?: string }).nodeType || 'custom',
  )

  if (nodeType === 'textNode') {
    return <WorkflowTextNode {...props} />
  }

  if (nodeType === 'imageNode') {
    return <WorkflowImageNode {...props} />
  }

  if (nodeType === 'storyVideo') {
    return <WorkflowStoryVideoNode {...props} />
  }

  return <WorkflowGenericNode {...props} />
}

export const workflowNodeTypes = {
  workflow: WorkflowCanvasNode,
}
