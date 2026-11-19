import { describe, expect, it } from 'vitest'
import { guessCategory, guessUrgency, structureWithFallback } from '@/lib/grievance/fallback'
import { grievanceDraftSchema } from '@/lib/grievance/schema'

describe('fallback structuring', () => {
  it('detects Hindi water complaints', () => {
    expect(guessCategory('हमारी गली में पाँच दिन से पानी नहीं आ रहा')).toBe('water_supply')
  })
  it('detects English road complaints', () => {
    expect(guessCategory('There is a huge pothole near the school')).toBe('roads_streetlights')
  })
  it('defaults to other', () => {
    expect(guessCategory('I want to share something')).toBe('other')
  })
  it('flags emergencies as high urgency', () => {
    expect(guessUrgency('This is an emergency, live wire fell')).toBe('high')
    expect(guessUrgency('पाँच दिन से पानी नहीं आ रहा')).toBe('high')
    expect(guessUrgency('street is a little dirty')).toBe('low')
  })
  it('never invents location or name and produces a schema-valid draft', () => {
    const draft = structureWithFallback('Garbage has not been collected.   It smells terrible!')
    expect(draft.location).toBe('')
    expect(draft.complainantName).toBe('')
    expect(draft.title).toBe('Garbage has not been collected')
    expect(draft.category).toBe('sanitation_waste')
    expect(grievanceDraftSchema.safeParse(draft).success).toBe(true)
  })
  it('keeps title within the schema limit for long text', () => {
    const draft = structureWithFallback('water '.repeat(500))
    expect(draft.title.length).toBeLessThanOrEqual(120)
    expect(grievanceDraftSchema.safeParse(draft).success).toBe(true)
  })
})
