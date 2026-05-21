import { Button } from '../../../components/ui/button'
import { Dialog, DialogContent } from '../../../components/ui/dialog'
import type { HomeVideo } from '../home-types'
import { videoTitle } from '../home-utils'

type VideoPreviewDialogProps = {
  selectedVideo: HomeVideo | null
  onClose: () => void
}

export function VideoPreviewDialog({
  selectedVideo,
  onClose,
}: VideoPreviewDialogProps) {
  return (
    <Dialog open={Boolean(selectedVideo)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-label={selectedVideo ? videoTitle(selectedVideo) : '用户作品预览'}
        className="w-full max-w-5xl border-0 bg-transparent p-0 shadow-none sm:max-w-5xl"
      >
        {selectedVideo ? (
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="absolute -top-12 right-0 rounded-full border-white/20 bg-black/40 text-white/80 hover:bg-black/55 hover:text-white"
            >
              关闭
            </Button>
            <video
              src={selectedVideo.video_url ?? undefined}
              poster={selectedVideo.cover_url ?? undefined}
              controls
              autoPlay
              playsInline
              className="max-h-[78vh] w-full rounded-[1.5rem] bg-black shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
