import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { UserProfile } from '../../lib/auth-types'
import { getFirstFieldError } from '../../lib/form-utils'
import { HomeGallery } from './components/home-gallery'
import { HomeHero } from './components/home-hero'
import { HomeStoryComposer } from './components/home-story-composer'
import { RecentProjectsStrip } from './components/recent-projects-strip'
import { StylePickerDialog } from './components/style-picker-dialog'
import { VideoPreviewDialog } from './components/video-preview-dialog'
import { createStorySchema } from './home-schema'
import type { HomeVideo } from './home-types'
import { getColumnCount } from './home-utils'
import {
  getErrorMessage,
  useCreateWorkflow,
  useHomeVideos,
  useRecentProjects,
  useStylePresets,
} from './use-home-page'

export function HomePage({ profile }: { profile?: UserProfile }) {
  const navigate = useNavigate()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [columnCount, setColumnCount] = useState(4)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<HomeVideo | null>(null)
  const [inlineMessage, setInlineMessage] = useState<string | null>(null)

  const isAuthenticated = Boolean(profile)
  const stylePresetsQuery = useStylePresets()
  const recentProjectsQuery = useRecentProjects(isAuthenticated)
  const homeVideosQuery = useHomeVideos()
  const createWorkflowMutation = useCreateWorkflow()
  const stylePresets = stylePresetsQuery.data ?? []

  const form = useForm({
    defaultValues: {
      story: '',
      selectedStyleKey: '',
    },
    validators: {
      onSubmit: createStorySchema,
    },
    onSubmit: async ({ value }) => {
      if (!isAuthenticated) {
        await navigate({ to: '/login' })
        return
      }

      const styleValue =
        stylePresets.find((preset) => preset.key === value.selectedStyleKey)?.value ?? ''

      try {
        setInlineMessage(null)
        await createWorkflowMutation.mutateAsync({
          story: value.story.trim(),
          styleValue,
        })
      } catch (error) {
        setInlineMessage(getErrorMessage(error))
      }
    },
  })

  const story = form.state.values.story
  const selectedStyleKey = form.state.values.selectedStyleKey
  const firstStyle = stylePresets.at(0)
  const selectedStyle =
    stylePresets.find((preset) => preset.key === selectedStyleKey) ??
    firstStyle ?? {
      key: '',
      label: '选择风格',
      value: '',
    }
  const recentProjects = recentProjectsQuery.data ?? []
  const homeVideos = homeVideosQuery.data ?? []
  const homeVideoColumns = useMemo(() => {
    const columns = Array.from({ length: columnCount }, () => ({
      height: 0,
      items: [] as Array<HomeVideo & { minHeight: number }>,
    }))

    for (const [index, video] of homeVideos.entries()) {
      const minHeight = 186 + (index % 4) * 24
      const targetColumn = columns.reduce((shortest, current) =>
        current.height < shortest.height ? current : shortest,
      )

      targetColumn.items.push({ ...video, minHeight })
      targetColumn.height += minHeight + 112
    }

    return columns.map((column) => column.items)
  }, [columnCount, homeVideos])

  useEffect(() => {
    const element = textareaRef.current

    if (!element) {
      return
    }

    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 320)}px`
  }, [story])

  useEffect(() => {
    const firstKey = stylePresetsQuery.data?.[0]?.key

    if (firstKey && !selectedStyleKey) {
      form.setFieldValue('selectedStyleKey', firstKey)
    }
  }, [form, selectedStyleKey, stylePresetsQuery.data])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updateColumnCount = () => {
      setColumnCount(getColumnCount(window.innerWidth))
    }

    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)

    return () => {
      window.removeEventListener('resize', updateColumnCount)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      setIsStyleDialogOpen(false)
      setSelectedVideo(null)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  async function openProject(workflowId: string | number) {
    await navigate({
      to: '/sora2-workflow/$workflowId',
      params: { workflowId: String(workflowId) },
    })
  }

  return (
    <main className="home-page pb-12">
      <form.Field name="story" validators={{ onChange: createStorySchema.shape.story }}>
        {(field) => {
          const error =
            field.state.meta.isTouched || form.state.isSubmitted
              ? getFirstFieldError(field.state.meta.errors)
              : null

          return (
            <HomeHero
              composer={
                <HomeStoryComposer
                  error={error}
                  inlineMessage={inlineMessage}
                  isFocused={isInputFocused}
                  isSubmitting={createWorkflowMutation.isPending}
                  selectedStyleLabel={selectedStyle.label || '选择风格'}
                  storyLength={field.state.value.length}
                  textareaRef={textareaRef}
                  value={field.state.value}
                  onBlur={() => {
                    setIsInputFocused(false)
                    field.handleBlur()
                  }}
                  onChange={field.handleChange}
                  onFocus={() => setIsInputFocused(true)}
                  onOpenStylePicker={() => setIsStyleDialogOpen(true)}
                  onSubmit={() => void form.handleSubmit()}
                />
              }
              recentProjects={
                isAuthenticated ? (
                  <RecentProjectsStrip
                    isLoading={recentProjectsQuery.isLoading}
                    projects={recentProjects}
                    onOpenProject={(workflowId) => void openProject(workflowId)}
                  />
                ) : undefined
              }
            />
          )
        }}
      </form.Field>

      <HomeGallery
        columns={homeVideoColumns}
        isLoading={homeVideosQuery.isLoading}
        onSelectVideo={setSelectedVideo}
      />

      <section className="page-wrap px-4 pb-4 pt-10 text-center sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="home-quote m-0 text-sm leading-8">
            扎克伯格说过：没有人一开始就什么都会，想法一开始都不会是完美无缺的，只有你在实践中不断打磨，想法才会逐渐清晰，你只需要开始行动就行了。
          </p>
        </div>
      </section>

      <StylePickerDialog
        open={isStyleDialogOpen}
        presets={stylePresets}
        selectedStyleKey={selectedStyle.key}
        onOpenChange={setIsStyleDialogOpen}
        onSelect={(styleKey) => {
          form.setFieldValue('selectedStyleKey', styleKey)
          setIsStyleDialogOpen(false)
        }}
      />

      <VideoPreviewDialog
        selectedVideo={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </main>
  )
}
