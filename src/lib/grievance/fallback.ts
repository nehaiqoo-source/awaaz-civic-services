import type { Category, GrievanceDraft, Urgency } from './schema'

/** Keyword rules (English, Hindi in Devanagari, and common Romanized Hindi). Order = priority. */
const CATEGORY_KEYWORDS: ReadonlyArray<readonly [Category, readonly string[]]> = [
  ['water_supply', ['water', 'pani', 'paani', 'पानी', 'jal', 'जल', 'tap', 'pipeline', 'नल']],
  ['sanitation_waste', ['garbage', 'waste', 'sewage', 'drain', 'nali', 'naali', 'kachra', 'कचरा', 'गंदगी', 'नाली', 'सफाई', 'sanitation']],
  ['roads_streetlights', ['road', 'pothole', 'gaddha', 'gadda', 'streetlight', 'street light', 'sadak', 'सड़क', 'गड्ढा', 'गड्ढे', 'बत्ती']],
  ['electricity', ['electricity', 'power cut', 'bijli', 'बिजली', 'transformer', 'voltage', 'light nahi']],
  ['public_health', ['hospital', 'clinic', 'doctor', 'medicine', 'अस्पताल', 'दवा', 'dawai', 'disease', 'dengue']],
  ['ration_welfare', ['ration', 'राशन', 'pension', 'पेंशन', 'scheme', 'योजना', 'aadhaar', 'आधार']],
  ['police_safety', ['police', 'theft', 'harass', 'पुलिस', 'चोरी', 'unsafe', 'threat']],
]

const HIGH_URGENCY = ['urgent', 'emergency', 'immediately', 'danger', 'accident', 'दिनों से', 'दिन से', 'din se', 'days', 'जरूरी', 'turant', 'खतरा', 'sick', 'बीमार']
const MEDIUM_URGENCY = ['week', 'हफ्ते', 'month', 'महीने', 'repeatedly', 'again', 'बार']

export function guessCategory(text: string): Category {
  const lower = text.toLowerCase()
  for (const [category, words] of CATEGORY_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return category
  }
  return 'other'
}

export function guessUrgency(text: string): Urgency {
  const lower = text.toLowerCase()
  if (HIGH_URGENCY.some((w) => lower.includes(w))) return 'high'
  if (MEDIUM_URGENCY.some((w) => lower.includes(w))) return 'medium'
  return 'low'
}

/**
 * Deterministic, keyword-based structuring used when no LLM is configured or its output is invalid.
 * Intentionally conservative: it never invents a location or a name.
 */
export function structureWithFallback(transcript: string): GrievanceDraft {
  const clean = transcript.replace(/\s+/g, ' ').trim()
  const firstSentence = clean.split(/[.!?।]/)[0]?.trim() ?? clean
  const title = (firstSentence.length >= 3 ? firstSentence : clean).slice(0, 120)
  return {
    title,
    description: clean,
    category: guessCategory(clean),
    urgency: guessUrgency(clean),
    location: '',
    complainantName: '',
  }
}
