import { guessCategory } from '@/lib/grievance/fallback'
import type { Category } from '@/lib/grievance/schema'
import { SERVICES, type Service } from './catalog'

const tokenize = (text: string): string[] => text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []

export interface Match {
  service: Service
  score: number
}

export interface SaathiResult {
  matches: Match[]
  /** true when the best match is strong enough to show without hedging. */
  confident: boolean
  category: Category
}


/**
 * Deterministic matcher (no network). Single-word keywords must equal a spoken word (so "tap" does not match "tape");
 * multi-word keywords match as phrases. Phrases weigh more than words. Weak or empty results are reported as such:
 * Saathi never pretends to know.
 */
export function matchServices(transcript: string, limit = 3): SaathiResult {
  const words = tokenize(transcript)
  const wordSet = new Set(words)
  const phrases = ` ${words.join(' ')} `
  const scored: Match[] = []
  for (const service of SERVICES) {
    let score = 0
    for (const raw of service.keywords) {
      const kw = tokenize(raw)
      if (kw.length === 0) continue
      if (kw.length === 1) {
        if (wordSet.has(kw[0]!)) score += 1
      } else if (phrases.includes(` ${kw.join(' ')} `)) score += 2
    }
    if (score > 0) scored.push({ service, score })
  }
  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]?.score ?? 0
  const second = scored[1]?.score ?? 0
  // Confident = a phrase / two word hits, or a single hit that nothing else competes with.
  const confident = best >= 2 ? best > second : best === 1 && second === 0
  const matches = scored.filter((m) => m.score >= Math.max(1, best / 2)).slice(0, limit)
  return { matches, confident, category: guessCategory(transcript) }
}
