export type StylePreset = {
  key: string
  label: string
  value: string
  description?: string | null
  img_url?: string | null
}

export type WorkflowSummary = {
  id: number | string
  name: string
  created_at?: string | null
  updated_at?: string | null
}

export type HomeVideo = {
  id: number | string
  title?: string | null
  description?: string | null
  cover_url?: string | null
  video_url?: string | null
  sort_order?: number | null
  is_enabled?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}
