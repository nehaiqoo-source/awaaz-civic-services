import type { Category, Urgency } from '@/lib/grievance/schema'

/**
 * Closed set of civic problems the on-device photo model may pick from. The model only scores these prompts; the
 * title and description come from this table, never from model output, so nothing in a photo can inject text.
 */
export interface PhotoLabel {
  prompt: string
  category: Category
  urgency: Urgency
  title: { en: string; hi: string }
}

export const PHOTO_LABELS: readonly PhotoLabel[] = [
  { prompt: 'a photo of a pothole or damaged road', category: 'roads_streetlights', urgency: 'medium', title: { en: 'Pothole or damaged road', hi: 'सड़क पर गड्ढा या टूटी सड़क' } },
  { prompt: 'a photo of a broken or dark street light pole', category: 'roads_streetlights', urgency: 'low', title: { en: 'Street light not working', hi: 'स्ट्रीट लाइट खराब है' } },
  { prompt: 'a photo of a pile of garbage or rubbish on the street', category: 'sanitation_waste', urgency: 'medium', title: { en: 'Garbage not cleared', hi: 'कचरा नहीं उठाया गया' } },
  { prompt: 'a photo of an overflowing drain or sewage water on the road', category: 'sanitation_waste', urgency: 'high', title: { en: 'Overflowing drain or sewage', hi: 'नाली या सीवर का पानी बह रहा है' } },
  { prompt: 'a photo of a leaking water pipe or a flooded street', category: 'water_supply', urgency: 'medium', title: { en: 'Water pipe leakage', hi: 'पानी की पाइप लीक हो रही है' } },
  { prompt: 'a photo of hanging electric wires or a damaged electric pole', category: 'electricity', urgency: 'high', title: { en: 'Dangerous electric wires or pole', hi: 'खतरनाक बिजली के तार या खंभा' } },
  { prompt: 'a photo of a transformer', category: 'electricity', urgency: 'medium', title: { en: 'Electricity transformer problem', hi: 'बिजली ट्रांसफ़ॉर्मर की समस्या' } },
  { prompt: 'a photo of stagnant dirty water with mosquitoes', category: 'public_health', urgency: 'medium', title: { en: 'Stagnant water, health risk', hi: 'जमा गंदा पानी, बीमारी का ख़तरा' } },
]

const NONE_PROMPT = 'a photo of something unrelated to civic problems, such as a person, a room or an object'
export const PHOTO_PROMPTS: readonly string[] = [...PHOTO_LABELS.map((l) => l.prompt), NONE_PROMPT]

export interface PhotoGuess {
  title: string
  description: string
  category: Category
  urgency: Urgency
  confidence: number
}

const MIN_CONFIDENCE = 0.5

/** Picks the best label from `{label: score}` pairs (scores sum to ~1). Returns null when unsure or "unrelated". */
export function guessFromScores(scores: ReadonlyArray<{ label: string; score: number }>, language: 'en' | 'hi'): PhotoGuess | null {
  let best: { label: string; score: number } | null = null
  for (const s of scores) {
    if (typeof s.score === 'number' && Number.isFinite(s.score) && (!best || s.score > best.score)) best = s
  }
  if (!best || best.score < MIN_CONFIDENCE) return null
  const label = PHOTO_LABELS.find((l) => l.prompt === best.label)
  if (!label) return null
  const title = label.title[language]
  return {
    title,
    description:
      language === 'hi'
        ? `फोटो में यह दिखता है: ${title}। (फोटो देखकर फ़ोन ने अनुमान लगाया है, कृपया जाँच लें।)`
        : `The photo appears to show: ${title}. (Guessed on your phone from the picture; please check it.)`,
    category: label.category,
    urgency: label.urgency,
    confidence: best.score,
  }
}
