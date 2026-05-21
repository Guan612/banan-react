import { Link } from '@tanstack/react-router'
import { Button } from '../../../components/ui/button'
import type { WorkflowSummary } from '../home-types'
import { formatDateLong } from '../home-utils'

type RecentProjectsStripProps = {
  isLoading: boolean
  projects: WorkflowSummary[]
  onOpenProject: (workflowId: string | number) => void
}

export function RecentProjectsStrip({
  isLoading,
  projects,
  onOpenProject,
}: RecentProjectsStripProps) {
  return (
    <section className="mt-8 w-full max-w-3xl text-left">
      <div className="recent-header mb-3 flex items-center justify-between gap-3">
        <span className="recent-label">最近项目</span>
        <Link
          to="/sora2-workflow"
          className="recent-link text-sm no-underline transition hover:text-[var(--home-text-primary)]"
        >
          全部 →
        </Link>
      </div>

      {isLoading ? (
        <p className="recent-chip m-0 rounded-full px-4 py-3 text-sm text-[var(--home-text-secondary)]">
          正在同步你的最近项目...
        </p>
      ) : projects.length > 0 ? (
        <div className="recent-list scrollbar-thin scrollbar-h-2 scrollbar-track-transparent scrollbar-thumb-[rgba(120,136,186,0.32)] hover:scrollbar-thumb-[rgba(120,136,186,0.48)] flex gap-3 overflow-x-auto pb-2">
          {projects.slice(0, 5).map((project) => (
            <Button
              type="button"
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              variant="ghost"
              className="recent-chip recent-project-pill h-auto min-w-[190px] flex-col items-start rounded-[1.35rem] px-4 py-3 text-left whitespace-normal transition hover:bg-[color-mix(in_oklab,var(--home-chip-bg)_72%,var(--link-bg-hover)_28%)]"
            >
              <span className="chip-date text-[11px] leading-none text-[var(--home-text-muted)]">
                {formatDateLong(project.updated_at || project.created_at)}
              </span>
              <span className="chip-name line-clamp-2 text-sm leading-5 text-[var(--home-text-secondary)]">
                {project.name || '未命名项目'}
              </span>
            </Button>
          ))}
        </div>
      ) : (
        <p className="recent-chip m-0 rounded-full border-dashed px-4 py-3 text-sm text-[var(--home-text-secondary)]">
          你还没有最近项目，先从上方输入故事开始。
        </p>
      )}
    </section>
  )
}
