import { z } from 'zod'
import { MAX_ANSWER_CHARS, MAX_FIELDS, MAX_OPTIONS, textLimit } from './limits'

export { MAX_ANSWER_CHARS, MAX_FIELDS, MAX_OPTIONS, textLimit }

export const FIELD_TYPES = ['text', 'textarea', 'email', 'tel', 'number', 'date', 'select', 'radio', 'checkbox', 'password'] as const
export type FieldType = (typeof FIELD_TYPES)[number]


export const optionSchema = z.object({
  value: z.string().max(200),
  label: z.string().max(200),
})

/** Description of one form control (or radio group) on the page. Untrusted: it comes from a third-party site. */
export const fieldDescriptorSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(FIELD_TYPES),
  label: z.string().trim().max(300),
  name: z.string().max(200).optional(),
  placeholder: z.string().max(200).optional(),
  autocomplete: z.string().max(100).optional(),
  required: z.boolean().optional(),
  maxLength: z.number().int().positive().max(100_000).optional(),
  options: z.array(optionSchema).max(MAX_OPTIONS).optional(),
})

export type FieldDescriptor = z.infer<typeof fieldDescriptorSchema>

export const fillRequestSchema = z.object({
  transcript: z.string().trim().min(1).max(MAX_ANSWER_CHARS),
  language: z.string().trim().min(2).max(20).optional(),
  fields: z.array(fieldDescriptorSchema).min(1).max(MAX_FIELDS),
})

export type FillRequest = z.infer<typeof fillRequestSchema>

export type SkipReason = 'sensitive' | 'not_understood' | 'ai_unavailable'

export interface FillResult {
  values: Record<string, string>
  skipped: Array<{ id: string; reason: SkipReason }>
  source: 'rules' | 'llm' | 'none'
}
