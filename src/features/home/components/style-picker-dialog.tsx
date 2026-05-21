import { Check } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import type { StylePreset } from '../home-types'

type StylePickerDialogProps = {
  open: boolean
  presets: StylePreset[]
  selectedStyleKey: string
  onOpenChange: (open: boolean) => void
  onSelect: (styleKey: string) => void
}

export function StylePickerDialog({
  open,
  presets,
  selectedStyleKey,
  onOpenChange,
  onSelect,
}: StylePickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="app-modal max-w-4xl p-5 text-[var(--home-text-primary)] sm:max-w-4xl"
      >
        <DialogHeader className="mb-4 flex-row items-center justify-between gap-3 text-left">
          <div>
            <p className="m-0 text-xs font-semibold tracking-[0.18em] text-[var(--home-text-muted)] uppercase">
              Style Presets
            </p>
            <DialogTitle className="mt-2 text-xl font-semibold text-[var(--home-text-primary)]">
              选择画面风格
            </DialogTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-[var(--home-chip-border)] bg-[var(--home-chip-bg)] text-[var(--home-text-secondary)] shadow-[inset_0_1px_0_var(--inset-glint)] hover:bg-[color-mix(in_oklab,var(--home-chip-bg)_72%,var(--link-bg-hover)_28%)] hover:text-[var(--home-text-primary)]"
          >
            关闭
          </Button>
        </DialogHeader>

        {presets.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {presets.map((preset) => {
              const isSelected = preset.key === selectedStyleKey

              return (
                <button
                  type="button"
                  key={preset.key}
                  onClick={() => onSelect(preset.key)}
                  className={`overflow-hidden rounded-[1.25rem] border p-0 text-left transition ${
                    isSelected
                      ? 'border-[var(--lagoon-deep)] bg-[color-mix(in_oklab,var(--home-chip-bg)_78%,var(--link-bg-hover)_22%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--lagoon-deep)_30%,transparent)]'
                      : 'border-[var(--home-card-border)] bg-[var(--home-chip-bg)] hover:bg-[color-mix(in_oklab,var(--home-chip-bg)_72%,var(--link-bg-hover)_28%)]'
                  }`}
                >
                  <div className="relative aspect-square overflow-hidden bg-[linear-gradient(180deg,color-mix(in_oklab,var(--lagoon)_28%,transparent),color-mix(in_oklab,var(--bg-base)_78%,var(--lagoon)_22%))]">
                    {preset.img_url ? (
                      <img
                        src={preset.img_url}
                        alt={preset.label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-semibold text-[color-mix(in_oklab,var(--home-text-primary)_24%,transparent)]">
                        {preset.label.slice(0, 1)}
                      </div>
                    )}
                    {isSelected ? (
                      <div className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sea-ink)] text-white dark:bg-black/55">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>
                  <div className="px-4 py-3">
                    <p className="m-0 text-sm font-medium text-[var(--home-text-primary)]">
                      {preset.label}
                    </p>
                    {preset.description ? (
                      <p className="mt-2 text-xs leading-5 text-[var(--home-text-muted)]">
                        {preset.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--home-card-border)] px-6 py-10 text-center">
            <p className="m-0 text-base font-medium text-[var(--home-text-primary)]">
              暂无可用风格
            </p>
            <p className="mt-2 text-sm text-[var(--home-text-muted)]">
              当前展示以后端配置为准，请先在后台配置 `style` 类型的工作流提示词。
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
