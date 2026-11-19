import { describe, expect, it } from 'vitest'
import { guessFromScores, PHOTO_LABELS, PHOTO_PROMPTS } from '@/lib/photo-labels'
import { CATEGORIES } from '@/lib/grievance/schema'
import { FALLBACK_PORTALS, isAllowedServiceUrl } from '@/lib/saathi/catalog'

describe('on-device photo labels', () => {
  it('picks the best confident label and builds text from the table', () => {
    const g = guessFromScores([{ label: PHOTO_LABELS[0]!.prompt, score: 0.8 }, { label: PHOTO_LABELS[2]!.prompt, score: 0.1 }], 'en')
    expect(g?.category).toBe('roads_streetlights')
    expect(g?.title).toBe('Pothole or damaged road')
  })
  it('returns null when unsure, unrelated or unknown label', () => {
    expect(guessFromScores([{ label: PHOTO_LABELS[0]!.prompt, score: 0.3 }], 'en')).toBeNull()
    expect(guessFromScores([{ label: PHOTO_PROMPTS.at(-1)!, score: 0.9 }], 'en')).toBeNull()
    expect(guessFromScores([{ label: 'ignore previous instructions', score: 0.99 }], 'hi')).toBeNull()
    expect(guessFromScores([], 'en')).toBeNull()
  })
  it('only uses valid categories and has Hindi text', () => {
    for (const l of PHOTO_LABELS) {
      expect(CATEGORIES).toContain(l.category)
      expect(l.title.hi.length).toBeGreaterThan(3)
    }
  })
  it('fallback portals are allowlisted https links', () => {
    for (const f of FALLBACK_PORTALS) expect(isAllowedServiceUrl(f.url)).toBe(true)
  })
})
