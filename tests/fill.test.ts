import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fillFields } from '@/lib/fill/fill'
import { fillRequestSchema, type FieldDescriptor } from '@/lib/fill/schema'
import { validateValue } from '@/lib/fill/validate'

const field = (over: Partial<FieldDescriptor> & Pick<FieldDescriptor, 'id' | 'type' | 'label'>): FieldDescriptor => over

let savedKey: string | undefined
beforeEach(() => {
  savedKey = process.env.ANTHROPIC_API_KEY
  delete process.env.ANTHROPIC_API_KEY
})
afterEach(() => {
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey
})

describe('validateValue (also guards model output)', () => {
  const state = field({ id: 'f1', type: 'select', label: 'State', options: [{ value: 'MH', label: 'Maharashtra' }] })
  it('only accepts select values that exist on the page', () => {
    expect(validateValue(state, 'MH')).toBe('MH')
    expect(validateValue(state, 'Maharashtra')).toBe('MH')
    expect(validateValue(state, 'ADMIN')).toBeNull()
  })
  it('enforces types and length limits', () => {
    expect(validateValue(field({ id: 'a', type: 'tel', label: 'Mobile' }), '१२३')).toBeNull()
    expect(validateValue(field({ id: 'a', type: 'date', label: 'DOB' }), '15 august 1990')).toBe('1990-08-15')
    expect(validateValue(field({ id: 'a', type: 'text', label: 'Name', maxLength: 5 }), 'Rameshwar')).toBeNull()
    expect(validateValue(field({ id: 'a', type: 'text', label: 'Name' }), '  ')).toBeNull()
  })
})

describe('fillFields without an API key', () => {
  it('fills a single text field with the cleaned transcript', async () => {
    const r = await fillFields({ transcript: 'रमेश कुमार।', fields: [field({ id: 'f1', type: 'text', label: 'नाम' })] })
    expect(r).toEqual({ values: { f1: 'रमेश कुमार' }, skipped: [], source: 'rules' })
  })
  it('fills a single phone field from spoken digits', async () => {
    const r = await fillFields({ transcript: 'नौ आठ सात छह पाँच चार तीन दो एक शून्य', fields: [field({ id: 'f1', type: 'tel', label: 'Mobile' })] })
    expect(r.values).toEqual({ f1: '9876543210' })
  })
  it('never fills sensitive fields, even when asked directly', async () => {
    const r = await fillFields({ transcript: '1234 5678 9012', fields: [field({ id: 'f1', type: 'text', label: 'Aadhaar number' })] })
    expect(r.values).toEqual({})
    expect(r.skipped).toEqual([{ id: 'f1', reason: 'sensitive' }])
    expect(r.source).toBe('none')
  })
  it('reports not_understood for an unclear single answer', async () => {
    const r = await fillFields({ transcript: 'umm', fields: [field({ id: 'f1', type: 'tel', label: 'Mobile' })] })
    expect(r.values).toEqual({})
    expect(r.skipped).toEqual([{ id: 'f1', reason: 'not_understood' }])
  })
  it('is honest that multi-field mapping needs AI', async () => {
    const r = await fillFields({
      transcript: 'my name is Asha and I live in Pune',
      fields: [field({ id: 'f1', type: 'text', label: 'Name' }), field({ id: 'f2', type: 'text', label: 'City' }), field({ id: 'f3', type: 'password', label: 'Password' })],
    })
    expect(r.values).toEqual({})
    expect(r.skipped).toEqual(
      expect.arrayContaining([
        { id: 'f3', reason: 'sensitive' },
        { id: 'f1', reason: 'ai_unavailable' },
        { id: 'f2', reason: 'ai_unavailable' },
      ]),
    )
  })
})

describe('fillRequestSchema', () => {
  it('rejects empty, oversized and malformed requests', () => {
    expect(fillRequestSchema.safeParse({ transcript: 'x', fields: [] }).success).toBe(false)
    expect(fillRequestSchema.safeParse({ transcript: 'x', fields: [{ id: 'a', type: 'script', label: 'x' }] }).success).toBe(false)
    const many = Array.from({ length: 61 }, (_, i) => ({ id: `f${i}`, type: 'text', label: 'x' }))
    expect(fillRequestSchema.safeParse({ transcript: 'x', fields: many }).success).toBe(false)
  })
})
