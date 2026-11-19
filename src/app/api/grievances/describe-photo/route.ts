import { NextResponse } from 'next/server'
import { z } from 'zod'
import { aiConfigured, describePhoto } from '@/lib/grievance/describe-photo'
import { checkPhoto, MAX_PHOTO_BYTES } from '@/lib/grievance/photo'
import { clientKey, jsonError, parseBody } from '@/lib/http'
import { RateLimiter } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const limiter = new RateLimiter(6, 60_000)
const bodySchema = z.object({
  image: z.string().min(100).max(Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 8),
  language: z.string().trim().min(2).max(20).default('en-IN'),
})

/** Only called after the person ticks "Let AI describe this photo". The photo is not stored by this route. */
export async function POST(request: Request) {
  const wait = limiter.check(clientKey(request))
  if (wait !== null) return jsonError('Too many requests', 429, { 'Retry-After': String(wait) })
  if (!aiConfigured()) return jsonError('ai_unavailable', 503)

  const body = await parseBody(request, bodySchema, MAX_PHOTO_BYTES * 2)
  if (!body.ok) return body.response
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(body.data.image)) return jsonError('Invalid input', 400)
  const bytes = Uint8Array.from(Buffer.from(body.data.image, 'base64'))
  if (!checkPhoto(bytes).ok) return jsonError('Unsupported photo', 415)

  const draft = await describePhoto(body.data.image, body.data.language)
  if (!draft) return jsonError('Could not describe the photo', 502)
  return NextResponse.json({ draft }, { headers: { 'Cache-Control': 'no-store' } })
}
