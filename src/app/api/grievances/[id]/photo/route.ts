import { NextResponse } from 'next/server'
import { checkPhoto, MAX_PHOTO_BYTES } from '@/lib/grievance/photo'
import { getRepository, isValidTrackingId } from '@/lib/grievance/store'
import { clientKey, jsonError } from '@/lib/http'
import { RateLimiter } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const limiter = new RateLimiter(10, 60_000)

/**
 * Upload the single photo of a complaint. Write-only: there is deliberately no public GET, because the picture can
 * show people and homes. Needs the one-time token that only the submitter received. Body = raw JPEG bytes.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const wait = limiter.check(clientKey(request))
  if (wait !== null) return jsonError('Too many requests', 429, { 'Retry-After': String(wait) })

  const { id } = await params
  const normalized = id.toUpperCase()
  const token = request.headers.get('x-photo-token') ?? ''
  if (!isValidTrackingId(normalized) || token.length < 16 || token.length > 128) return jsonError('Not found', 404)

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_PHOTO_BYTES) return jsonError('Photo too large', 413)
  const bytes = new Uint8Array(await request.arrayBuffer())
  const check = checkPhoto(bytes)
  if (!check.ok) return jsonError(check.reason === 'too_large' ? 'Photo too large' : 'Unsupported photo', check.reason === 'too_large' ? 413 : 415)

  let result
  try {
    result = await getRepository().savePhoto(normalized, token, bytes)
  } catch (error) {
    console.error('photo save failed:', error instanceof Error ? error.message : 'unknown error')
    return jsonError('Could not save the photo', 503)
  }
  if (result === 'saved') return NextResponse.json({ ok: true }, { status: 201 })
  if (result === 'exists') return jsonError('Photo already attached', 409)
  if (result === 'invalid') return jsonError('Unsupported photo', 415)
  return jsonError('Not found', 404) // not_found and forbidden look the same on purpose
}
