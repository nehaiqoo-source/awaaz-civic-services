import { z } from 'zod'

export const CATEGORIES = [
  'water_supply',
  'sanitation_waste',
  'roads_streetlights',
  'electricity',
  'public_health',
  'ration_welfare',
  'police_safety',
  'other',
] as const

export const URGENCIES = ['low', 'medium', 'high'] as const

export type Category = (typeof CATEGORIES)[number]
export type Urgency = (typeof URGENCIES)[number]

export const MAX_TRANSCRIPT_CHARS = 4000

/** Raw speech transcript as sent by the client. Untrusted. */
export const transcriptInputSchema = z.object({
  transcript: z.string().trim().min(10).max(MAX_TRANSCRIPT_CHARS),
  language: z.string().trim().min(2).max(20).optional(),
})

/** Structured grievance. Used to validate LLM output and user-edited form data. */
export const grievanceDraftSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(MAX_TRANSCRIPT_CHARS),
  category: z.enum(CATEGORIES),
  urgency: z.enum(URGENCIES),
  location: z.string().trim().max(200),
  complainantName: z.string().trim().max(100),
})

export type GrievanceDraft = z.infer<typeof grievanceDraftSchema>

/** Optional place the person chose to share (explicit tap). Rounded to ~11 m so it cannot be more precise than needed. */
export const geoSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracyM: z.number().min(0).max(100_000).optional(),
  })
  .transform((g) => ({ lat: round4(g.lat), lng: round4(g.lng), ...(g.accuracyM === undefined ? {} : { accuracyM: Math.round(g.accuracyM) }) }))

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000
}

export type Geo = z.infer<typeof geoSchema>

/** Submission payload: the reviewed draft plus the original transcript and language. */
export const submitInputSchema = z.object({
  draft: grievanceDraftSchema,
  transcript: z.string().trim().min(10).max(MAX_TRANSCRIPT_CHARS),
  language: z.string().trim().min(2).max(20).optional(),
  geo: geoSchema.optional(),
})

export type SubmitInput = z.infer<typeof submitInputSchema>

export type StructureSource = 'llm' | 'fallback'

export interface StructureResult {
  draft: GrievanceDraft
  source: StructureSource
}

export interface Grievance extends GrievanceDraft {
  id: string
  transcript: string
  language: string | null
  status: 'received'
  createdAt: string
  geo?: Geo
  hasPhoto?: boolean
  /** Secret that lets the submitter (only) upload the photo once. Never returned by any public route. */
  photoToken?: string
}

export const TRACKING_ID_PATTERN = /^GRV-[0-9A-HJKMNP-TV-Z]{8}$/
