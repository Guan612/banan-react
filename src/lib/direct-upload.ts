import { z } from 'zod'
import { apiRequest, parseApiData } from './api'

const presignedUploadSchema = z.object({
  presigned_url: z.string(),
  signed_headers: z.record(z.string(), z.string()).optional().default({}),
  public_url: z.string(),
  object_key: z.string(),
  content_type: z.string(),
  filename: z.string(),
})

const confirmedUploadSchema = z.object({
  url: z.string(),
  media_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  object_key: z.string(),
  id: z.string(),
  filename: z.string(),
  size: z.number(),
  content_type: z.string(),
  directory: z.string().optional(),
  category: z.string().optional(),
  storage_type: z.string(),
})

export type PresignedUpload = z.infer<typeof presignedUploadSchema>
export type ConfirmedUpload = z.infer<typeof confirmedUploadSchema>

async function getPresignedUploadData(file: File | Blob, filename: string) {
  const data = await apiRequest<unknown>('/api/upload/presign', {
    method: 'POST',
    body: JSON.stringify({
      filename,
      content_type: file.type || 'application/octet-stream',
      size: file.size,
    }),
  })

  return parseApiData(presignedUploadSchema, data)
}

async function putFileToObjectStorage(file: File | Blob, presigned: PresignedUpload) {
  const headers = new Headers({
    'Content-Type': file.type || presigned.content_type || 'application/octet-stream',
  })

  for (const [key, value] of Object.entries(presigned.signed_headers || {})) {
    headers.set(key, value)
  }

  const response = await fetch(presigned.presigned_url, {
    method: 'PUT',
    headers,
    body: file,
  })

  if (!response.ok) {
    throw new Error(`TOS上传失败: ${response.status} ${response.statusText}`)
  }
}

async function confirmDirectUpload(
  file: File | Blob,
  filename: string,
  presigned: PresignedUpload,
) {
  const data = await apiRequest<unknown>('/api/upload/confirm', {
    method: 'POST',
    body: JSON.stringify({
      object_key: presigned.object_key,
      public_url: presigned.public_url,
      filename,
      size: file.size,
      content_type: file.type || presigned.content_type,
    }),
  })

  return parseApiData(confirmedUploadSchema, data)
}

export async function directUploadFile(file: File | Blob, filename?: string) {
  const resolvedFilename =
    filename || (file instanceof File && file.name) || `upload-${Date.now()}`
  const presigned = await getPresignedUploadData(file, resolvedFilename)

  await putFileToObjectStorage(file, presigned)

  return confirmDirectUpload(file, resolvedFilename, presigned)
}

export async function directUploadImageFile(file: File | Blob, filename?: string) {
  const result = await directUploadFile(file, filename)

  return {
    ...result,
    url: result.image_url || result.url,
  }
}
