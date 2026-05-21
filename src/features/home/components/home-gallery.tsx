import { Film } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import type { HomeVideo } from '../home-types'
import { formatDate, videoTitle } from '../home-utils'

type HomeGalleryColumnVideo = HomeVideo & { minHeight: number }

type HomeGalleryProps = {
  columns: HomeGalleryColumnVideo[][]
  isLoading: boolean
  onSelectVideo: (video: HomeVideo) => void
}

export function HomeGallery({
  columns,
  isLoading,
  onSelectVideo,
}: HomeGalleryProps) {
  const hasVideos = columns.some((column) => column.length > 0)

  return (
    <section className="home-gallery-shell mx-auto mt-6 w-[min(1280px,calc(100%-2rem))] rounded-[2.25rem] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-semibold tracking-[0.18em] text-[var(--home-text-muted)] uppercase">
            User Works
          </p>
          <h2 className="home-display mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--home-text-primary)] sm:text-5xl">
            用户作品
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div className="home-empty-card rounded-[1.75rem] px-6 py-8 text-sm text-[var(--home-text-secondary)]">
          正在加载用户作品...
        </div>
      ) : hasVideos ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((column, columnIndex) => (
            <div key={`column-${columnIndex}`} className="flex flex-col gap-4">
              {column.map((video) => (
                <article
                  key={video.id}
                  className="home-gallery-card overflow-hidden rounded-[1.5rem]"
                >
                  <button
                    type="button"
                    onClick={() => onSelectVideo(video)}
                    className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                  >
                    <div
                      className="relative overflow-hidden"
                      style={{ minHeight: `${video.minHeight}px` }}
                    >
                      {video.cover_url ? (
                        <img
                          src={video.cover_url}
                          alt={videoTitle(video)}
                          className="block w-full object-cover transition duration-300 hover:scale-[1.03]"
                          style={{ minHeight: `${video.minHeight}px` }}
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center bg-[linear-gradient(180deg,color-mix(in_oklab,var(--lagoon)_18%,transparent),color-mix(in_oklab,var(--bg-base)_78%,var(--lagoon)_22%))] px-6 py-10 text-3xl font-semibold text-[color-mix(in_oklab,var(--home-text-primary)_28%,transparent)]"
                          style={{ minHeight: `${video.minHeight}px` }}
                        >
                          {videoTitle(video).slice(0, 2)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--home-overlay-top),var(--home-overlay-bottom))]" />
                      <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="outline"
                            className="rounded-full border-[var(--home-chip-border)] bg-[var(--home-chip-bg)] px-3 py-1 text-[11px] font-medium text-[var(--home-text-secondary)] backdrop-blur"
                          >
                            <Film className="h-3 w-3" />
                            视频作品
                          </Badge>
                          {(video.sort_order ?? 0) > 0 ? (
                            <Badge className="rounded-full bg-[rgba(255,214,10,0.88)] px-3 py-1 text-[11px] font-semibold text-black hover:bg-[rgba(255,214,10,0.88)]">
                              精选
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="absolute inset-x-4 bottom-4">
                        <h3 className="m-0 text-2xl font-semibold tracking-[-0.03em] text-white">
                          {videoTitle(video)}
                        </h3>
                      </div>
                    </div>
                    <div className="px-4 py-4">
                      <p className="home-gallery-description m-0 text-sm leading-6 text-[var(--home-text-secondary)]">
                        {video.description?.trim() || '点击播放用户作品。'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--home-text-muted)]">
                        <span>用户作品</span>
                        <span>点击播放</span>
                        <span>{formatDate(video.updated_at || video.created_at)}</span>
                      </div>
                    </div>
                  </button>
                </article>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="home-empty-card rounded-[1.75rem] px-6 py-10 text-center">
          <p className="m-0 text-lg font-semibold text-[var(--home-text-primary)]">
            用户作品正在补充中
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--home-text-secondary)]">
            现在可以先从上方输入故事开始，等更多用户作品上线后，这里会成为你的灵感库。
          </p>
        </div>
      )}
    </section>
  )
}
