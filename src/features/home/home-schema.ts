import { z } from 'zod'

export const createStorySchema = z.object({
  story: z
    .string()
    .trim()
    .min(1, '请先输入故事内容，再开始创作。')
    .max(5000, '故事内容最多 5000 字。'),
  selectedStyleKey: z.string(),
})

export type CreateStoryInput = z.infer<typeof createStorySchema>
