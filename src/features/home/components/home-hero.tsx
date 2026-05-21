import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '../../../components/ui/badge'

type HomeHeroProps = {
  composer: ReactNode
  recentProjects?: ReactNode
}

export function HomeHero({ composer, recentProjects }: HomeHeroProps) {
  return (
    <section className="page-wrap px-4 pt-8 sm:px-6 sm:pt-12">
      <div className="home-hero-shell relative overflow-hidden rounded-[2rem] px-5 py-10 sm:px-8 sm:py-14 lg:min-h-[calc(100vh-9rem)] lg:px-12">
        <div className="pointer-events-none absolute inset-x-[10%] top-0 h-32 bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute -left-10 top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(246,193,82,0.26),transparent_70%)] blur-2xl" />
        <div className="pointer-events-none absolute -right-6 bottom-6 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(83,151,255,0.2),transparent_70%)] blur-3xl" />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <Badge
            variant="outline"
            className="mb-6 inline-flex items-center gap-2 rounded-full border-[var(--home-chip-border)] bg-[var(--home-chip-bg)] px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[var(--home-text-secondary)] uppercase shadow-[inset_0_1px_0_var(--inset-glint)] backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 驱动的全链路创意生产平台
          </Badge>

          <h1 className="home-display mb-4 max-w-3xl text-5xl leading-[0.94] font-semibold tracking-[-0.05em] text-[var(--home-text-primary)] sm:text-7xl">
            重新定义
            <br />
            AI 创意生产
          </h1>

          <p className="mb-8 max-w-2xl text-sm leading-7 text-[var(--home-text-secondary)] sm:text-base">
            从小说剧本到角色设计，从分镜漫画到视频成片，用一个现代化工作台把灵感直接推进到可执行的创作流程。
          </p>

          {composer}
          {recentProjects}
        </div>
      </div>
    </section>
  )
}
