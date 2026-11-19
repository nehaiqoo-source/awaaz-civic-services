import { describe, expect, it } from 'vitest'
import { grievanceDraftSchema, submitInputSchema, transcriptInputSchema } from '@/lib/grievance/schema'
import { extractJsonObject } from '@/lib/grievance/structure'

const validDraft = {
  title: 'No water',
  description: 'No water supply for five days',
  category: 'water_supply',
  urgency: 'high',
  location: '',
  complainantName: '',
}

describe('schemas', () => {
  it('rejects unknown categories and urgencies (model output is untrusted)', () => {
    expect(grievanceDraftSchema.safeParse({ ...validDraft, category: 'hack' }).success).toBe(false)
    expect(grievanceDraftSchema.safeParse({ ...validDraft, urgency: 'critical' }).success).toBe(false)
  })
  it('rejects too-short and too-long transcripts', () => {
    expect(transcriptInputSchema.safeParse({ transcript: 'short' }).success).toBe(false)
    expect(transcriptInputSchema.safeParse({ transcript: 'x'.repeat(4001) }).success).toBe(false)
  })
  it('accepts a valid submission', () => {
    expect(submitInputSchema.safeParse({ draft: validDraft, transcript: 'No water for five days', language: 'hi-IN' }).success).toBe(true)
  })
})

describe('extractJsonObject', () => {
  it('parses JSON wrapped in code fences', () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })
  it('throws when there is no object', () => {
    expect(() => extractJsonObject('no json here')).toThrow()
  })
})
