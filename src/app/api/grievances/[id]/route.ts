import { NextResponse } from 'next/server'
import { isValidTrackingId, getRepository } from '@/lib/grievance/store'
import { clientKey, jsonError } from '@/lib/http'
import { RateLimiter } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const limiter = new RateLimiter(30, 60_000)

/** Public status lookup. Deliberately omits name, transcript, address, coordinates and the photo (personal data): only says whether a photo/location is attached. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const wait = limiter.check(clientKey(request))
  if (wait !== null) return jsonError('Too many requests', 429, { 'Retry-After': String(wait) })

  const { id } = await params
  const normalized = id.toUpperCase()
  if (!isValidTrackingId(normalized)) return jsonError('Not found', 404)

  let grievance
  try {
    grievance = await getRepository().getById(normalized)
  } catch {
    return jsonError('Service unavailable', 503)
  }
  if (!grievance) return jsonError('Not found', 404)

  return NextResponse.json({
    id: grievance.id,
    status: grievance.status,
    category: grievance.category,
    title: grievance.title,
    createdAt: grievance.createdAt,
    hasPhoto: grievance.hasPhoto === true,
    hasLocation: grievance.geo !== undefined,
  })
}
