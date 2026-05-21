import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Clock3,
  LoaderCircle,
  PanelsTopLeft,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import { getErrorMessage } from '../home/use-home-page'
import {
  createWorkflow,
  deleteWorkflow,
  listWorkflows,
  workflowProjectsQueryKey,
} from './workflow-api'
import type { WorkflowSummary } from './workflow-types'

const canvasCategories = [
  { value: 'my_canvas', label: '我的画布' },
  { value: 'sub_account_canvas', label: '子账户画布' },
  { value: 'my_collaboration_canvas', label: '我的协作画布' },
  { value: 'invited_collaboration_canvas', label: '被邀请的协作画布' },
] as const

function getProjectCategory(project: WorkflowSummary) {
  if (project.collaboration_category) {
    return project.collaboration_category
  }

  if (project.is_sub_account_canvas) {
    return 'sub_account_canvas'
  }

  return project.collaboration_role === 'owner'
    ? 'my_canvas'
    : 'invited_collaboration_canvas'
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    owner: '拥有者',
    editor: '可编辑',
    viewer: '只读',
  }

  return labels[role] ?? '协作者'
}

function formatProjectTime(value?: string | null) {
  if (!value) return '刚刚更新'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚更新'

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatProjectDateLabel(value?: string | null) {
  if (!value) return '暂无记录'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '暂无记录'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function isVideoUrl(value?: string | null) {
  if (!value) return false
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(value)
}

function WorkflowProjectCard({
  project,
  index,
  onOpen,
  onDelete,
  isDeleting,
}: {
  project: WorkflowSummary
  index: number
  onOpen: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const category = getProjectCategory(project)
  const canDelete = project.collaboration_role === 'owner'
  const updatedAt = project.updated_at || project.created_at
  const createdAt = project.created_at || project.updated_at

  return (
    <article
      className="feature-card group relative overflow-hidden rounded-[1.9rem] border border-[var(--line)] p-4 rise-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-10 cursor-pointer rounded-[inherit]"
        aria-label={`打开项目 ${project.name}`}
      />

      <div className="workflow-project-preview relative overflow-hidden rounded-[1.45rem]">
        {project.thumbnail ? (
          <>
            {isVideoUrl(project.thumbnail) ? (
              <video
                className="workflow-project-preview-media"
                src={project.thumbnail}
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                className="workflow-project-preview-media"
                src={project.thumbnail}
                alt={`${project.name} 预览`}
              />
            )}
            <div className="workflow-project-preview-shade" />
          </>
        ) : (
          <div
            className="workflow-project-preview-empty"
            style={{ ['--gradient-seed' as string]: String(index + 1) }}
          >
            <PanelsTopLeft className="size-9" />
          </div>
        )}
      </div>

      <div className="relative z-20 mt-4 space-y-3 px-1 pb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="workflow-role-badge">{getRoleLabel(project.collaboration_role)}</span>
              <span className="workflow-category-badge">
                {
                  canvasCategories.find((item) => item.value === category)?.label ??
                  '画布项目'
                }
              </span>
            </div>
            <h3 className="workflow-project-title text-[1.38rem] leading-8 font-semibold text-[var(--sea-ink)]">
              {project.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--sea-ink-soft)]">
              项目 #{project.id} · {project.project_type.toUpperCase()} ·{' '}
              {project.collaboration_role === 'owner' ? '你拥有这张画布' : '你正在参与协作'}
            </p>
          </div>
          {canDelete ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="relative z-30 rounded-full border border-transparent text-[var(--sea-ink-soft)] hover:border-[var(--chip-line)] hover:bg-[var(--chip-bg)] hover:text-rose-500"
              onClick={(event) => {
                event.stopPropagation()
                onDelete()
              }}
              disabled={isDeleting}
              aria-label={`删除项目 ${project.name}`}
            >
              {isDeleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-2 rounded-[1.2rem] border border-[var(--chip-line)] bg-[rgba(255,255,255,0.42)] p-3 text-sm text-[var(--sea-ink-soft)] dark:bg-white/4">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4" />
              最近更新
            </span>
            <span className="font-medium text-[var(--sea-ink)]">
              {formatProjectTime(updatedAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>创建日期</span>
            <span className="font-medium text-[var(--sea-ink)]">
              {formatProjectDateLabel(createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-sm">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--kicker)]">
            Canvas 2.0 Workspace
          </span>
          <span className="font-semibold text-[var(--lagoon-deep)] transition group-hover:translate-x-0.5">
            进入画布
          </span>
        </div>
      </div>
    </article>
  )
}

export function WorkflowProjectsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<
    (typeof canvasCategories)[number]['value']
  >('my_canvas')
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())

  const workflowsQuery = useQuery({
    queryKey: workflowProjectsQueryKey,
    queryFn: listWorkflows,
  })

  const createMutation = useMutation({
    mutationFn: async () =>
      createWorkflow({
        name: `画布2.0项目 ${new Date().toLocaleString('zh-CN')}`,
        current_step: 1,
        canvas_nodes: { nodes: [], edges: [] },
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: workflowProjectsQueryKey })
      toast.success('画布项目已创建')
      startTransition(() => {
        navigate({
          to: '/sora2-workflow/$workflowId',
          params: { workflowId: String(data.id) },
        })
      })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({
      workflowId,
      workflowName,
    }: {
      workflowId: number
      workflowName: string
    }) => {
      const confirmed = window.confirm(`确认删除「${workflowName}」吗？此操作无法撤销。`)
      if (!confirmed) {
        return false
      }

      await deleteWorkflow(String(workflowId))
      return true
    },
    onSuccess: async (deleted) => {
      if (!deleted) return
      await queryClient.invalidateQueries({ queryKey: workflowProjectsQueryKey })
      toast.success('项目已删除')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const allProjects = workflowsQuery.data?.workflows ?? []

  const categoryCounts = useMemo(() => {
    const source = deferredSearch
      ? allProjects.filter((project) =>
          project.name.toLowerCase().includes(deferredSearch),
        )
      : allProjects

    return source.reduce<Record<string, number>>((acc, project) => {
      const key = getProjectCategory(project)
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
  }, [allProjects, deferredSearch])

  const visibleProjects = useMemo(() => {
    return allProjects.filter((project) => {
      if (getProjectCategory(project) !== activeCategory) return false
      if (!deferredSearch) return true
      return project.name.toLowerCase().includes(deferredSearch)
    })
  }, [activeCategory, allProjects, deferredSearch])

  const hasProjectsInActiveCategory = (categoryCounts[activeCategory] ?? 0) > 0
  const emptyCategory = !workflowsQuery.isPending && !hasProjectsInActiveCategory

  return (
    <main className="mx-auto w-[min(1320px,calc(100%-2rem))] px-4 pb-14 pt-8 sm:px-6">
      <section className="workflow-projects-shell island-shell overflow-hidden rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8">
        <div className="workflow-projects-header flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--kicker)]">
                <PanelsTopLeft className="size-3.5" />
                工作台 · 选画布
              </div>
              <h1 className="display-title text-4xl font-semibold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
                画布 2.0
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--sea-ink-soft)] sm:text-base">
                先把工作台入口对齐过来。这里集中展示你的个人画布、协作画布和被邀请项目，选中后直接进入编辑画布。
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="workflow-search-field relative min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sea-ink-soft)]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="搜索画布项目"
                  className="h-11 rounded-full border-[var(--chip-line)] bg-[var(--chip-bg)] pl-10 pr-4"
                />
              </label>
              <Button
                type="button"
                size="lg"
                className="rounded-full bg-[linear-gradient(135deg,#5d7fff,#7ed3bf)] px-5 text-white shadow-[0_16px_38px_rgba(75,101,190,0.22)] hover:opacity-92"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Plus />
                )}
                新建项目
              </Button>
            </div>
          </div>

          <nav
            aria-label="画布分类"
            className="workflow-category-tabs flex gap-2 overflow-x-auto pb-1"
          >
            {canvasCategories.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setActiveCategory(category.value)}
                className={cn(
                  'workflow-category-tab inline-flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap',
                  activeCategory === category.value
                    ? 'border-[color:var(--lagoon-deep)] bg-[color:color-mix(in_oklab,var(--chip-bg)_82%,white_18%)] text-[var(--sea-ink)] shadow-[0_10px_24px_rgba(55,84,170,0.12)]'
                    : 'border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]',
                )}
              >
                {category.label}
                <span className="rounded-full bg-black/6 px-2 py-0.5 text-xs dark:bg-white/8">
                  {categoryCounts[category.value] ?? 0}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {workflowsQuery.isPending ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex items-center gap-3 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-5 py-3 text-sm text-[var(--sea-ink-soft)]">
              <LoaderCircle className="size-4 animate-spin" />
              正在加载画布项目...
            </div>
          </div>
        ) : workflowsQuery.isError ? (
          <div className="mt-8 rounded-[1.5rem] border border-rose-200/70 bg-rose-50/80 p-6 text-rose-700 dark:border-rose-400/20 dark:bg-rose-950/20 dark:text-rose-200">
            <p className="text-base font-semibold">画布列表加载失败</p>
            <p className="mt-2 text-sm opacity-80">
              {getErrorMessage(workflowsQuery.error)}
            </p>
          </div>
        ) : visibleProjects.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleProjects.map((project, index) => (
              <WorkflowProjectCard
                key={project.id}
                project={project}
                index={index}
                onOpen={() =>
                  startTransition(() => {
                    navigate({
                      to: '/sora2-workflow/$workflowId',
                      params: { workflowId: String(project.id) },
                    })
                  })
                }
                onDelete={() =>
                  deleteMutation.mutate({
                    workflowId: project.id,
                    workflowName: project.name,
                  })
                }
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables?.workflowId === project.id
                }
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex min-h-[320px] items-center justify-center">
            <div className="workflow-empty-card max-w-lg rounded-[1.75rem] border border-[var(--line)] px-8 py-10 text-center">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,rgba(93,127,255,0.18),rgba(126,211,191,0.18))] text-[var(--lagoon-deep)]">
                <PanelsTopLeft className="size-8" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--sea-ink)]">
                {emptyCategory ? '当前分类还没有画布' : '没有找到匹配项目'}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--sea-ink-soft)]">
                {deferredSearch
                  ? '试试换个关键词，或者切换到别的画布分类看看。'
                  : '从这里创建第一个 React 版画布项目，后面我们再继续把画布 2.0 详情能力逐步补齐。'}
              </p>
              <Button
                type="button"
                size="lg"
                className="mt-6 rounded-full bg-[linear-gradient(135deg,#5d7fff,#7ed3bf)] px-5 text-white"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                <Plus />
                新建画布项目
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
