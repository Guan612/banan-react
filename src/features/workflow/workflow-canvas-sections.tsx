import type { Node } from '@xyflow/react'
import { Link } from '@tanstack/react-router'
import {
  Check,
  CircleDot,
  LoaderCircle,
  Maximize2,
  Save,
  Trash2,
  Waypoints,
} from 'lucide-react'
import type { ChangeEvent } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { formatTime } from './workflow-canvas-utils'
import {
  getWorkflowNodeInfo,
  workflowQuickCreateTypes,
} from './workflow-node-catalog'
import type { WorkflowDetail, WorkflowNodeData } from './workflow-types'

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

export function WorkflowCanvasHeader(props: {
  workflow: WorkflowDetail
  projectName: string
  currentStyle: string
  workflowMode: string
  nodesCount: number
  edgesCount: number
  isDirty: boolean
  isSaving: boolean
  onProjectNameChange: (value: string) => void
  onCreateNode: (type: string) => void
  onImportClick: () => void
  onFitCanvas: () => void
  onSave: () => void
}) {
  return (
    <header className="border-b border-[var(--line)] px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--kicker)]">
              <span>Canvas 2.0</span>
              <span className="h-1 w-1 rounded-full bg-[var(--kicker)]/60" />
              <span>{props.workflow.collaboration_role || 'owner'}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--kicker)]/60" />
              <span>{props.nodesCount} 节点</span>
              <span className="h-1 w-1 rounded-full bg-[var(--kicker)]/60" />
              <span>{props.edgesCount} 连线</span>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Input
                value={props.projectName}
                onChange={(event) => props.onProjectNameChange(event.target.value)}
                className="h-11 max-w-2xl rounded-2xl border-white/60 bg-white/82 text-lg font-semibold text-[var(--sea-ink)] shadow-none"
                placeholder="输入项目名称"
              />
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
                <span className="rounded-full border border-white/60 bg-white/72 px-3 py-1.5">
                  更新于 {formatTime(props.workflow.updated_at)}
                </span>
                <span className="rounded-full border border-white/60 bg-white/72 px-3 py-1.5">
                  模式 {props.workflowMode || 'image'}
                </span>
                <span className="rounded-full border border-white/60 bg-white/72 px-3 py-1.5">
                  房间 {props.workflow.room_id || '未开启'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full border-white/60 bg-white/72"
              onClick={props.onImportClick}
            >
              导入 JSON
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/60 bg-white/72"
              onClick={props.onFitCanvas}
            >
              <Maximize2 />
              适配视图
            </Button>
            <Button
              className="rounded-full bg-[linear-gradient(135deg,#5d7fff,#7a94ff)] text-white shadow-[0_16px_34px_rgba(93,127,255,0.26)] hover:opacity-95"
              disabled={props.isSaving || !props.isDirty}
              onClick={props.onSave}
            >
              {props.isSaving ? (
                <LoaderCircle className="animate-spin" />
              ) : props.isDirty ? (
                <Save />
              ) : (
                <Check />
              )}
              {props.isSaving ? '保存中' : props.isDirty ? '保存' : '已保存'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {workflowQuickCreateTypes.map((type) => {
            const info = getWorkflowNodeInfo(type)

            return (
              <Button
                key={type}
                variant="outline"
                className="rounded-full border-white/60 bg-white/72"
                onClick={() => props.onCreateNode(type)}
              >
                {info.label}
              </Button>
            )
          })}
        </div>
      </div>
    </header>
  )
}

export function WorkflowCanvasInspector(props: {
  workflow: WorkflowDetail
  selectedNode: Node | null
  selectedImageNodeData: ImageNodeInspectorData | null
  selectedStoryVideoNodeData: StoryVideoInspectorData | null
  currentStyle: string
  workflowMode: string
  novelContent: string
  nodeDataDraft: string
  isSaving: boolean
  isDirty: boolean
  onCurrentStyleChange: (value: string) => void
  onWorkflowModeChange: (value: string) => void
  onNovelContentChange: (value: string) => void
  onRemoveSelectedNode: () => void
  onUpdateNodeMeta: (key: 'label' | 'rawType', value: string) => void
  onUpdateNodeDataField: (key: string, value: unknown) => void
  onUpdateNodeDataFields: (patch: Record<string, unknown>) => void
  onNodeDataDraftChange: (value: string) => void
  onApplyNodeJson: () => void
  onSave: () => void
  onParseLineList: (value: string) => string[]
}) {
  return (
    <aside className="min-h-0 border-t border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(244,247,252,0.92))] xl:border-l xl:border-t-0">
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--kicker)]">
            Inspector
          </p>
          <h2 className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
            画布详情
          </h2>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-3 rounded-[1.6rem] border border-white/60 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--sea-ink)]">
              <Waypoints className="size-4 text-[var(--lagoon-deep)]" />
              工作流设置
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                  当前风格
                </label>
                <Input
                  value={props.currentStyle}
                  onChange={(event) => props.onCurrentStyleChange(event.target.value)}
                  className="rounded-xl border-white/60 bg-white/80"
                  placeholder="例如：电影感插画、赛博都市"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                  工作流模式
                </label>
                <Input
                  value={props.workflowMode}
                  onChange={(event) => props.onWorkflowModeChange(event.target.value)}
                  className="rounded-xl border-white/60 bg-white/80"
                  placeholder="image / video / agent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                  小说原文
                </label>
                <Textarea
                  value={props.novelContent}
                  onChange={(event) => props.onNovelContentChange(event.target.value)}
                  className="min-h-32 rounded-[1rem] border-white/60 bg-white/80"
                  placeholder="这里可以直接编辑项目原始故事内容"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-[1.6rem] border border-white/60 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--sea-ink)]">
                <CircleDot className="size-4 text-[var(--lagoon-deep)]" />
                节点检查器
              </div>
              {props.selectedNode ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-[#b42318]"
                  onClick={props.onRemoveSelectedNode}
                >
                  <Trash2 />
                  删除
                </Button>
              ) : null}
            </div>

            {props.selectedNode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                      节点 ID
                    </label>
                    <Input
                      value={props.selectedNode.id}
                      readOnly
                      className="rounded-xl border-white/60 bg-white/65 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                      节点类型
                    </label>
                    <Input
                      value={String(
                        (props.selectedNode.data as WorkflowNodeData & { rawType?: string })
                          ?.rawType || '',
                      )}
                      onChange={(event) =>
                        props.onUpdateNodeMeta('rawType', event.target.value)
                      }
                      className="rounded-xl border-white/60 bg-white/80"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                    节点标题
                  </label>
                  <Input
                    value={String((props.selectedNode.data as WorkflowNodeData)?.label || '')}
                    onChange={(event) =>
                      props.onUpdateNodeMeta('label', event.target.value)
                    }
                    className="rounded-xl border-white/60 bg-white/80"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                      X
                    </p>
                    <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                      {Math.round(props.selectedNode.position.x)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 p-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                      Y
                    </p>
                    <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
                      {Math.round(props.selectedNode.position.y)}
                    </p>
                  </div>
                </div>

                {props.selectedImageNodeData ? (
                  <div className="space-y-3 rounded-[1.2rem] border border-cyan-100/80 bg-cyan-50/55 p-4">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-800/80">
                      Image Node
                    </p>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                        图片提示词
                      </label>
                      <Textarea
                        value={String(
                          props.selectedImageNodeData.imagePrompt ||
                            props.selectedImageNodeData.lastGeneratedPrompt ||
                            '',
                        )}
                        onChange={(event) =>
                          props.onUpdateNodeDataFields({
                            imagePrompt: event.target.value,
                            lastGeneratedPrompt: event.target.value,
                          })
                        }
                        className="min-h-28 rounded-[1rem] border-white/60 bg-white/80"
                        placeholder="输入图片生成提示词"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                          比例
                        </label>
                        <Input
                          value={String(
                            props.selectedImageNodeData.selectedRatio ||
                              props.selectedImageNodeData.imageAspectRatio ||
                              '',
                          )}
                          onChange={(event) =>
                            props.onUpdateNodeDataFields({
                              selectedRatio: event.target.value,
                              imageAspectRatio: event.target.value,
                            })
                          }
                          className="rounded-xl border-white/60 bg-white/80"
                          placeholder="例如 16:9"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                          分辨率
                        </label>
                        <Input
                          value={String(
                            props.selectedImageNodeData.selectedResolution ||
                              props.selectedImageNodeData.imageResolution ||
                              '',
                          )}
                          onChange={(event) =>
                            props.onUpdateNodeDataFields({
                              selectedResolution: event.target.value,
                              imageResolution: event.target.value,
                            })
                          }
                          className="rounded-xl border-white/60 bg-white/80"
                          placeholder="例如 1024x1024"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                        主图 URL
                      </label>
                      <Input
                        value={String(props.selectedImageNodeData.imageUrl || '')}
                        onChange={(event) =>
                          props.onUpdateNodeDataField('imageUrl', event.target.value)
                        }
                        className="rounded-xl border-white/60 bg-white/80"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                        候选图列表
                      </label>
                      <Textarea
                        value={(props.selectedImageNodeData.latestImages || []).join('\n')}
                        onChange={(event) =>
                          props.onUpdateNodeDataField(
                            'latestImages',
                            props.onParseLineList(event.target.value),
                          )
                        }
                        className="min-h-24 rounded-[1rem] border-white/60 bg-white/80 font-mono text-xs"
                        placeholder="每行一个 URL"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                        参考图列表
                      </label>
                      <Textarea
                        value={(props.selectedImageNodeData.linkedRefImages || []).join('\n')}
                        onChange={(event) =>
                          props.onUpdateNodeDataField(
                            'linkedRefImages',
                            props.onParseLineList(event.target.value),
                          )
                        }
                        className="min-h-24 rounded-[1rem] border-white/60 bg-white/80 font-mono text-xs"
                        placeholder="每行一个参考图 URL"
                      />
                    </div>
                  </div>
                ) : null}

                {props.selectedStoryVideoNodeData ? (
                  <div className="space-y-3 rounded-[1.2rem] border border-violet-100/80 bg-violet-50/55 p-4">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-violet-800/80">
                      Story Video Node
                    </p>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                        视频提示词
                      </label>
                      <Textarea
                        value={String(props.selectedStoryVideoNodeData.prompt || '')}
                        onChange={(event) =>
                          props.onUpdateNodeDataField('prompt', event.target.value)
                        }
                        className="min-h-28 rounded-[1rem] border-white/60 bg-white/80"
                        placeholder="输入视频生成提示词"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                          时长
                        </label>
                        <Input
                          value={String(
                            props.selectedStoryVideoNodeData.duration ||
                              props.selectedStoryVideoNodeData.selectedDuration ||
                              props.selectedStoryVideoNodeData.selectedVideoDuration ||
                              '',
                          )}
                          onChange={(event) =>
                            props.onUpdateNodeDataFields({
                              duration: event.target.value,
                              selectedDuration: event.target.value,
                              selectedVideoDuration: event.target.value,
                            })
                          }
                          className="rounded-xl border-white/60 bg-white/80"
                          placeholder="例如 5秒"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                          状态
                        </label>
                        <Input
                          value={String(props.selectedStoryVideoNodeData.status || '')}
                          onChange={(event) =>
                            props.onUpdateNodeDataField('status', event.target.value)
                          }
                          className="rounded-xl border-white/60 bg-white/80"
                          placeholder="pending / processing / completed"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                          视频模型
                        </label>
                        <Input
                          value={String(
                            props.selectedStoryVideoNodeData.selectedVideoModel ||
                              props.selectedStoryVideoNodeData.videoModel ||
                              '',
                          )}
                          onChange={(event) =>
                            props.onUpdateNodeDataFields({
                              selectedVideoModel: event.target.value,
                              videoModel: event.target.value,
                            })
                          }
                          className="rounded-xl border-white/60 bg-white/80"
                          placeholder="例如 veo / kling"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                          分辨率
                        </label>
                        <Input
                          value={String(
                            props.selectedStoryVideoNodeData.selectedResolution ||
                              props.selectedStoryVideoNodeData.videoResolution ||
                              '',
                          )}
                          onChange={(event) =>
                            props.onUpdateNodeDataFields({
                              selectedResolution: event.target.value,
                              videoResolution: event.target.value,
                            })
                          }
                          className="rounded-xl border-white/60 bg-white/80"
                          placeholder="例如 720p"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                        视频 URL
                      </label>
                      <Input
                        value={String(props.selectedStoryVideoNodeData.videoUrl || '')}
                        onChange={(event) =>
                          props.onUpdateNodeDataField('videoUrl', event.target.value)
                        }
                        className="rounded-xl border-white/60 bg-white/80"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                        封面 URL
                      </label>
                      <Input
                        value={String(props.selectedStoryVideoNodeData.coverUrl || '')}
                        onChange={(event) =>
                          props.onUpdateNodeDataField('coverUrl', event.target.value)
                        }
                        className="rounded-xl border-white/60 bg-white/80"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
                    节点 JSON
                  </label>
                  <Textarea
                    value={props.nodeDataDraft}
                    onChange={(event) => props.onNodeDataDraftChange(event.target.value)}
                    className="min-h-72 rounded-[1rem] border-white/60 bg-white/82 font-mono text-xs"
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full rounded-xl border-white/60 bg-white/80"
                  onClick={props.onApplyNodeJson}
                >
                  应用节点 JSON
                </Button>
              </div>
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-[var(--line)] bg-white/55 px-4 py-6 text-sm leading-6 text-[var(--sea-ink-soft)]">
                选中一个节点后，这里会显示它的类型、位置和完整 data JSON。当前版本已经先把整包保存、轻量 patch 保存和自动保存接通，后续我们可以继续把这里替换成更细的业务面板。
              </div>
            )}
          </section>

          <section className="rounded-[1.6rem] border border-white/60 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
            <p className="mb-2 text-sm font-semibold text-[var(--sea-ink)]">
              项目元信息
            </p>
            <div className="space-y-2 text-sm text-[var(--sea-ink-soft)]">
              <p className="m-0">项目 ID：{props.workflow.id}</p>
              <p className="m-0">创建时间：{formatTime(props.workflow.created_at)}</p>
              <p className="m-0">项目类型：{props.workflow.project_type}</p>
              <p className="m-0">协作房间：{props.workflow.room_id || '未开启'}</p>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-4">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/">返回首页</Link>
          </Button>
          <Button
            className="rounded-full bg-[linear-gradient(135deg,#5d7fff,#7a94ff)] text-white"
            disabled={props.isSaving || !props.isDirty}
            onClick={props.onSave}
          >
            {props.isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
            保存本次修改
          </Button>
        </div>
      </div>
    </aside>
  )
}
