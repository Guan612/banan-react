import type { HomeVideo } from './home-types'

export function formatDate(value?: string | null) {
  if (!value) {
    return '最近更新'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(value))
}

export function formatDateLong(value?: string | null) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('zh-CN').format(new Date(value))
}

export function videoTitle(video: HomeVideo) {
  return video.title?.trim() || '未命名作品'
}

export function getColumnCount(width: number) {
  if (width < 640) return 1
  if (width < 960) return 2
  if (width < 1280) return 3
  return 4
}
