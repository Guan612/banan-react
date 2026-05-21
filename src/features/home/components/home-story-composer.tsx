import { LoaderCircle, Play, WandSparkles } from 'lucide-react'
import type { RefObject } from 'react'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'

type HomeStoryComposerProps = {
  error: string | null
  inlineMessage: string | null
  isFocused: boolean
  isSubmitting: boolean
  selectedStyleLabel: string
  storyLength: number
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onBlur: () => void
  onChange: (value: string) => void
  onFocus: () => void
  onOpenStylePicker: () => void
  onSubmit: () => void
}

export function HomeStoryComposer({
  error,
  inlineMessage,
  isFocused,
  isSubmitting,
  selectedStyleLabel,
  storyLength,
  textareaRef,
  value,
  onBlur,
  onChange,
  onFocus,
  onOpenStylePicker,
  onSubmit,
}: HomeStoryComposerProps) {
  return (
    <div
      className={`home-panel w-full max-w-3xl rounded-[1.75rem] p-3 text-left shadow-[0_30px_90px_rgba(7,10,25,0.28)] ${
        isFocused ? 'home-panel-active' : ''
      }`}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onSubmit()
        }}
      >
        <label htmlFor="story-input" className="sr-only">
          故事内容
        </label>
        <Textarea
          id="story-input"
          ref={textareaRef}
          value={value}
          maxLength={5000}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder="把你的故事粘贴到这里，开始创作..."
          className="home-textarea min-h-[160px] resize-none border-0 bg-transparent px-4 py-4 text-base leading-7 text-[var(--home-text-primary)] shadow-none ring-0 placeholder:text-[var(--home-text-muted)] focus-visible:border-transparent focus-visible:ring-0"
        />

        <div className="flex flex-col gap-3 border-t border-[var(--home-panel-divider)] px-3 pb-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={onOpenStylePicker}
              variant="outline"
              className="rounded-full border-[var(--home-chip-border)] bg-[var(--home-chip-bg)] px-4 text-sm font-medium text-[var(--home-text-secondary)] shadow-[inset_0_1px_0_var(--inset-glint)] hover:bg-[color-mix(in_oklab,var(--home-chip-bg)_78%,var(--link-bg-hover)_22%)] hover:text-[var(--home-text-primary)]"
            >
              <WandSparkles className="h-4 w-4" />
              {selectedStyleLabel || '选择风格'}
            </Button>
            <span className="text-xs text-[var(--home-text-muted)]">
              {storyLength}/5000
            </span>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-[var(--sea-ink)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(24,37,61,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)] dark:bg-white dark:text-slate-950 dark:hover:bg-[rgba(255,255,255,0.92)]"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                创建中
              </>
            ) : (
              <>
                开始创作
                <Play className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {error ? (
          <p className="m-0 px-4 pb-2 text-sm text-amber-600 dark:text-amber-200" role="status">
            {error}
          </p>
        ) : null}
      </form>

      {inlineMessage ? (
        <p className="m-0 px-4 pb-2 text-sm text-amber-600 dark:text-amber-100" role="status">
          {inlineMessage}
        </p>
      ) : null}
    </div>
  )
}
